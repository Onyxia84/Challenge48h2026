const fs = require('fs');
const csv = require('csv-parser');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'parkshare.db'); 
const db = new Database(dbPath);

db.pragma('foreign_keys = OFF');
db.exec(`
    DROP TABLE IF EXISTS kpi_city_scores;
    CREATE TABLE kpi_city_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_name TEXT NOT NULL,
        region TEXT,
        lat REAL,
        lng REAL,
        total_spots INTEGER,
        opportunity_score INTEGER,
        demand_category TEXT
    );
`);
db.pragma('foreign_keys = ON');

const citiesData = {};
console.log('Lecture du CSV en cours...');

const csvFilePath = 'data_base_copro.csv';

fs.createReadStream(csvFilePath, { encoding: 'utf-8' })
  .pipe(csv({ separator: ',' })) 
  .on('data', (row) => {
      const ville = row.VILLE;
      if (!ville) return;

      if (!citiesData[ville]) {
          citiesData[ville] = {
              region: row.REGION || 'Inconnue',
              lat: parseFloat(row.lat) || 0,
              lng: parseFloat(row.long) || 0, // <-- C'était 'long' !
              lots_parking: 0,
              lots_habitation: 0
          };
      }

      // <-- C'était LOTS_PARKING !
      citiesData[ville].lots_parking += parseInt(row.LOTS_PARKING) || 0;
      citiesData[ville].lots_habitation += parseInt(row.LOTS_HABITATION) || 0;
  })
  .on('end', () => {
      console.log('Traitement terminé. Insertion...');

      const insertCity = db.prepare(`
          INSERT INTO kpi_city_scores 
          (city_name, region, lat, lng, total_spots, opportunity_score, demand_category) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let insertedCount = 0;

      const insertMany = db.transaction((cities) => {
          for (const [ville, data] of Object.entries(cities)) {
              // Calcul du score d'opportunité
              let ratio = data.lots_habitation > 0 ? (data.lots_parking / data.lots_habitation) : 0;
              let score = Math.min(Math.round(ratio * 100), 100); 
              let category = score > 80 ? 'Forte' : score > 50 ? 'Moyenne' : 'Faible';

              // On insère uniquement si on a des coordonnées valides
              if (data.lat !== 0 && data.lng !== 0) {
                  insertCity.run(
                      ville, data.region, data.lat, data.lng, 
                      data.lots_parking, score, category
                  );
                  insertedCount++;
              }
          }
      });

      insertMany(citiesData);
      console.log(`✅ Importation terminée ! ${insertedCount} villes ajoutées avec leurs vraies places de parking.`);
  })
  .on('error', (err) => {
      console.error('Erreur :', err.message);
  });
