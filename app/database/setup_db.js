const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');

const db = new sqlite3.Database('parkshare.db'); 

// 1. Initialisation de la BDD
function initDB() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`DROP TABLE IF EXISTS kpi1_villes`);
            db.run(`CREATE TABLE kpi1_villes (
                code_postal TEXT, ville TEXT, nb_immeubles_cibles INTEGER, total_lots_cibles INTEGER, score_moyen_cibles REAL
            )`);

            db.run(`DROP TABLE IF EXISTS kpi2_immeubles`);
            db.run(`CREATE TABLE kpi2_immeubles (
                code_postal TEXT, ville TEXT, adresse TEXT, lots_habitation INTEGER, score_immeuble REAL, lat REAL, long REAL
            )`);

            db.run(`DROP TABLE IF EXISTS kpi3_dept`);
            db.run(`CREATE TABLE kpi3_dept (
                dept_code TEXT, dept_nom TEXT, nb_coproprietes_cibles INTEGER, score_potentiel_dept REAL
            )`);

            db.run(`DROP TABLE IF EXISTS kpi4_syndics`);
            db.run(`CREATE TABLE kpi4_syndics (
                nom_syndic TEXT, nb_immeubles_cibles INTEGER, total_places_parking INTEGER
            )`, (err) => {
                if (err) reject(err);
                else {
                    console.log("✅ Tables créées avec succès.");
                    resolve();
                }
            });
        });
    });
}

// 2. Fonction d'importation robuste (Transactions + File d'attente sécurisée)
function importCSV(filePath, tableName, insertQuery) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Fichier introuvable, import ignoré : ${filePath}`);
            return resolve(); 
        }

        let count = 0;

        // On enveloppe l'import dans serialize() pour garantir l'ordre d'exécution
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            const stmt = db.prepare(insertQuery);

            fs.createReadStream(filePath)
                .pipe(csv({
                    // Optionnel : On nettoie les en-têtes pour éviter les bugs d'espaces invisibles
                    mapHeaders: ({ header }) => header.trim().toLowerCase()
                }))
                .on('data', (row) => {
                    // On récupère les valeurs sous forme de tableau (fallback si les noms de colonnes sont étranges)
                    const vals = Object.values(row);

                    if (tableName === 'kpi1_villes') {
                        // code_postal, ville, nb_immeubles, total_lots, score
                        stmt.run(row.code_postal || vals[0], row.ville || vals[1], row.nb_immeubles_cibles || vals[2], row.total_lots_cibles || vals[3], row.score_moyen_cibles || vals[4]);
                    
                    } else if (tableName === 'kpi2_immeubles') {
                        // code_postal, ville, adresse, lots_habitation, score, lat, long
                        const score = (row.score_immeuble || vals[6] || "").toString().replace(',', '.');
                        const lat = row.lat || row.latitude || vals[3] || null;
                        const long = row.long || row.lng || row.longitude || vals[4] || null;
                        stmt.run(row.code_postal || vals[0], row.ville || vals[1], row.adresse || vals[2], row.lots_habitation || vals[5], score, lat, long);
                    
                    } else if (tableName === 'kpi3_dept') {
                        stmt.run(row.dept_code || vals[0], row.dept_nom || vals[1], row.nb_coproprietes_cibles || vals[2], row.score_potentiel_dept || vals[3]);
                    
                    } else if (tableName === 'kpi4_syndics') {
                        stmt.run(row.nom_syndic || vals[0], row.nb_immeubles_cibles || vals[1], row.total_places_parking || vals[2]);
                    }
                    count++;
                })
                .on('end', () => {
                    // Les commandes ici seront mises en attente de la fin de toutes les insertions grâce à serialize()
                    stmt.finalize();
                    db.run("COMMIT", (err) => {
                        if (err) reject(err);
                        else {
                            console.log(`✅ ${count} lignes insérées dans ${tableName}.`);
                            resolve();
                        }
                    });
                })
                .on('error', (err) => {
                    db.run("ROLLBACK");
                    reject(err);
                });
        });
    });
}

// 3. Exécution principale
async function runImport() {
    try {
        await initDB(); 

        await importCSV('./export_kpi1_villes.csv', 'kpi1_villes', `INSERT INTO kpi1_villes VALUES (?, ?, ?, ?, ?)`);
        await importCSV('./export_kpi2_immeubles.csv', 'kpi2_immeubles', `INSERT INTO kpi2_immeubles VALUES (?, ?, ?, ?, ?, ?, ?)`);
        await importCSV('./export_kpi3_departements.csv', 'kpi3_dept', `INSERT INTO kpi3_dept VALUES (?, ?, ?, ?)`);
        await importCSV('./export_kpi4_syndics.csv', 'kpi4_syndics', `INSERT INTO kpi4_syndics VALUES (?, ?, ?)`);

        console.log("🎉 Import terminé avec succès !");
        
        db.close(() => {
            console.log("🛑 Base de données fermée. Arrêt du script.");
            process.exit(0); 
        });

    } catch (err) {
        console.error("❌ Erreur :", err);
        process.exit(1); 
    }
}

runImport();

