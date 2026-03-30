const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'parkshare.db'));

// Activer les clés étrangères
db.pragma('foreign_keys = ON');

db.exec(`
    -- =============================================
    -- 1. TABLES SOURCES BRUTES
    -- =============================================
    CREATE TABLE IF NOT EXISTS raw_cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        lat REAL,
        lng REAL,
        population INTEGER,
        region TEXT
    );

    CREATE TABLE IF NOT EXISTS raw_parking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_name TEXT NOT NULL,
        available_spots INTEGER,
        avg_price REAL
    );

    -- =============================================
    -- 2. TABLES TRANSFORMÉES (Jointure et nettoyage)
    -- =============================================
    CREATE TABLE IF NOT EXISTS transformed_city_parking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_id INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        lat REAL,
        lng REAL,
        population INTEGER,
        region TEXT,
        total_spots INTEGER,
        avg_price REAL,
        FOREIGN KEY (city_id) REFERENCES raw_cities(id)
    );

    -- =============================================
    -- 3. TABLES DE KPIs (Scores et Agrégations)
    -- =============================================
    CREATE TABLE IF NOT EXISTS kpi_city_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transformed_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        demand_level TEXT NOT NULL,
        competition_level TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        FOREIGN KEY (transformed_id) REFERENCES transformed_city_parking(id)
    );

    CREATE TABLE IF NOT EXISTS kpi_regional_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region TEXT NOT NULL UNIQUE,
        avg_score REAL NOT NULL,
        total_spots INTEGER NOT NULL
    );
`);

console.log('✅ Tables créées avec succès (sans erreur de clés étrangères)');
db.close();
