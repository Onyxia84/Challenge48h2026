const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database(path.join(__dirname, 'database', 'parkshare.db'));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables dans la DB :", tables);

try {
    const count = db.prepare("SELECT COUNT(*) as c FROM kpi_city_scores").get();
    console.log("Nombre de lignes dans kpi_city_scores :", count.c);
} catch (e) {
    console.log("La table kpi_city_scores n'existe pas !");
}
console.log("Lignes dans transformed_city_parking :", db.prepare("SELECT COUNT(*) as c FROM transformed_city_parking").get().c);


// Servir les fichiers du dashboard
app.use(express.static(path.join(__dirname, 'public')));

// 1. Route API : Récupération des villes
app.get('/api/cities', (req, res) => {
    try {
        const minScore = parseInt(req.query.minScore) || 0;
        const region = req.query.region || 'Toutes';

        let query = `
            SELECT 
                city_name, 
                lat, 
                lng, 
                region, 
                total_spots, 
                opportunity_score, 
                demand_category, 
                RANK() OVER (ORDER BY opportunity_score DESC) as rank
            FROM kpi_city_scores 
            WHERE opportunity_score >= ?
        `;
        const params = [minScore];

        if (region && region !== 'Toutes') {
            query += ` AND region = ?`;
            params.push(region);
        }

        const rows = db.prepare(query).all(params);
        res.json(rows);
    } catch (error) {
        console.error("Erreur SQL sur /api/cities :", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Route API : Stats globales
app.get('/api/stats', (req, res) => {
    try {
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total_cities,
                ROUND(AVG(opportunity_score), 1) as avg_score,
                MAX(opportunity_score) as max_score,
                MIN(opportunity_score) as min_score
            FROM kpi_city_scores
        `).get();
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Route API : Liste des régions
app.get('/api/regions/list', (req, res) => {
    try {
        const regions = db.prepare(`SELECT DISTINCT region FROM kpi_city_scores ORDER BY region`).all();
        res.json(regions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Route API : Score moyen par région
app.get('/api/regions', (req, res) => {
    try {
        const regions = db.prepare(`
            SELECT 
                region, 
                ROUND(AVG(opportunity_score), 1) as avg_score
            FROM kpi_city_scores
            GROUP BY region
            ORDER BY avg_score DESC
        `).all();
        res.json(regions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});

