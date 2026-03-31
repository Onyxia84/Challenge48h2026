const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database', 'parkshare.db');
const db = new Database(DB_PATH);

app.use(express.static(path.join(__dirname, 'public')));

// 1. Route API : Récupération des IMMEUBLES pour la carte
app.get('/api/cities', (req, res) => {
    try {
        const maxScore = parseInt(req.query.maxScore) || 100;
        const region = req.query.region; 
        const { minLat, maxLat, minLng, maxLng } = req.query;

        let query = `
            SELECT 
                ville AS city_name, 
                SUBSTR(code_postal, 1, 2) AS region, 
                adresse,
                CAST(REPLACE(lat, ',', '.') AS REAL) AS lat, 
                CAST(REPLACE(long, ',', '.') AS REAL) AS lng, 
                lots_habitation AS total_spots, 
                CASE 
                    WHEN CAST(score_immeuble * 100 AS INTEGER) > 100 THEN 100
                    ELSE CAST(score_immeuble * 100 AS INTEGER)
                END AS opportunity_score, 
                CASE 
                    WHEN (score_immeuble * 100) >= 80 THEN 'Moins intéressant'
                    WHEN (score_immeuble * 100) >= 65 THEN 'Potentiel moyen'
                    ELSE 'Très intéressant'
                END AS demand_category
            FROM kpi2_immeubles 
            WHERE (score_immeuble * 100) <= ?
        `;
        const params = [maxScore];

        if (region && region !== 'Toutes') {
            query += ` AND SUBSTR(code_postal, 1, 2) = ?`;
            params.push(region);
        }

        if (minLat && maxLat && minLng && maxLng) {
            query += ` AND CAST(REPLACE(lat, ',', '.') AS REAL) BETWEEN ? AND ? 
                       AND CAST(REPLACE(long, ',', '.') AS REAL) BETWEEN ? AND ?`;
            params.push(minLat, maxLat, minLng, maxLng);
        }

        query += ` ORDER BY score_immeuble ASC LIMIT 1500`;

        const rows = db.prepare(query).all(params);
        res.json(rows);
    } catch (error) {
        console.error("Erreur SQL :", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Route API : Stats globales
app.get('/api/stats', (req, res) => {
    try {
        const stats = db.prepare(`
            SELECT 
                COUNT(DISTINCT UPPER(ville)) as total_cities,
                CASE 
                    WHEN CAST(ROUND(AVG(score_immeuble * 100), 0) AS INTEGER) > 100 THEN 100
                    ELSE CAST(ROUND(AVG(score_immeuble * 100), 0) AS INTEGER)
                END as avg_score,
                CASE 
                    WHEN CAST(MAX(score_immeuble * 100) AS INTEGER) > 100 THEN 100
                    ELSE CAST(MAX(score_immeuble * 100) AS INTEGER)
                END as max_score,
                CAST(MIN(score_immeuble * 100) AS INTEGER) as min_score
            FROM kpi2_immeubles
        `).get();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Route API : Liste des départements
app.get('/api/regions/list', (req, res) => {
    try {
        const regions = db.prepare(`
            SELECT DISTINCT dept_code AS id, dept_nom AS name
            FROM kpi3_dept 
            WHERE dept_nom IS NOT NULL
            ORDER BY dept_nom ASC
        `).all();
        res.json(regions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Route API : Score moyen par département
app.get('/api/regions', (req, res) => {
    try {
        const regions = db.prepare(`
            SELECT 
                dept_nom AS region, 
                CASE 
                    WHEN CAST(ROUND(score_potentiel_dept * 100, 0) AS INTEGER) > 100 THEN 100
                    ELSE CAST(ROUND(score_potentiel_dept * 100, 0) AS INTEGER)
                END as avg_score
            FROM kpi3_dept
            WHERE score_potentiel_dept IS NOT NULL
            ORDER BY avg_score ASC
            LIMIT 15
        `).all();
        res.json(regions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Route API : Classement global des villes
app.get('/api/villes/ranking', (req, res) => {
    try {
        const villes = db.prepare(`
            SELECT 
                UPPER(ville) AS city_name, 
                CASE 
                    WHEN CAST(ROUND(score_moyen_cibles, 0) AS INTEGER) > 100 THEN 100
                    ELSE CAST(ROUND(score_moyen_cibles, 0) AS INTEGER)
                END AS opportunity_score
            FROM kpi1_villes
            WHERE score_moyen_cibles IS NOT NULL
            GROUP BY UPPER(ville)
            ORDER BY opportunity_score ASC
            LIMIT 15
        `).all();
        res.json(villes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});

