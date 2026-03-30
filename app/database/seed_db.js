const Database = require('better-sqlite3');
const { faker } = require('@faker-js/faker/locale/fr');
const path = require('path');
const db = new Database(path.join(__dirname, 'parkshare.db'));

// 1. Nettoyage des tables existantes
try {
    db.exec(`
        DELETE FROM kpi_city_scores;
        DELETE FROM transformed_city_parking;
        DELETE FROM raw_parking;
        DELETE FROM raw_cities;
    `);
    console.log('🧹 Base de données nettoyée.');
} catch (e) {
    console.log('⚠️ Note : Certaines tables ont déjà été nettoyées.');
}

// 2. Le Top 100 des villes françaises (vraies coordonnées et régions)
const realCities = [
    // --- Les 20 plus grandes ---
    { name: 'Paris', region: 'Île-de-France', lat: 48.8566, lng: 2.3522, pop: 2161000 },
    { name: 'Marseille', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.2965, lng: 5.3698, pop: 861635 },
    { name: 'Lyon', region: 'Auvergne-Rhône-Alpes', lat: 45.7640, lng: 4.8357, pop: 513275 },
    { name: 'Toulouse', region: 'Occitanie', lat: 43.6047, lng: 1.4442, pop: 471941 },
    { name: 'Nice', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.7102, lng: 7.2620, pop: 342522 },
    { name: 'Nantes', region: 'Pays de la Loire', lat: 47.2184, lng: -1.5536, pop: 303382 },
    { name: 'Montpellier', region: 'Occitanie', lat: 43.6108, lng: 3.8767, pop: 277929 },
    { name: 'Strasbourg', region: 'Grand Est', lat: 48.5734, lng: 7.7521, pop: 277270 },
    { name: 'Bordeaux', region: 'Nouvelle-Aquitaine', lat: 44.8378, lng: -0.5792, pop: 249712 },
    { name: 'Lille', region: 'Hauts-de-France', lat: 50.6292, lng: 3.0573, pop: 232741 },
    { name: 'Rennes', region: 'Bretagne', lat: 48.1173, lng: -1.6778, pop: 215366 },
    { name: 'Reims', region: 'Grand Est', lat: 49.2583, lng: 4.0317, pop: 184076 },
    { name: 'Saint-Étienne', region: 'Auvergne-Rhône-Alpes', lat: 45.4397, lng: 4.3872, pop: 171057 },
    { name: 'Toulon', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.1242, lng: 5.9280, pop: 167479 },
    { name: 'Le Havre', region: 'Normandie', lat: 49.4944, lng: 0.1079, pop: 172366 },
    { name: 'Grenoble', region: 'Auvergne-Rhône-Alpes', lat: 45.1885, lng: 5.7245, pop: 160649 },
    { name: 'Dijon', region: 'Bourgogne-Franche-Comté', lat: 47.3220, lng: 5.0415, pop: 153668 },
    { name: 'Angers', region: 'Pays de la Loire', lat: 47.4784, lng: -0.5532, pop: 151520 },
    { name: 'Nîmes', region: 'Occitanie', lat: 43.8367, lng: 4.3601, pop: 150610 },
    { name: 'Villeurbanne', region: 'Auvergne-Rhône-Alpes', lat: 45.7667, lng: 4.8833, pop: 147712 },
    
    // --- 80 autres grandes et moyennes villes ---
    { name: 'Saint-Denis', region: 'La Réunion', lat: -20.8789, lng: 55.4481, pop: 147931 }, // Hors métropole mais intéressant !
    { name: 'Le Mans', region: 'Pays de la Loire', lat: 48.0061, lng: 0.1996, pop: 142946 },
    { name: 'Aix-en-Provence', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.5297, lng: 5.4474, pop: 142668 },
    { name: 'Clermont-Ferrand', region: 'Auvergne-Rhône-Alpes', lat: 45.7772, lng: 3.0870, pop: 141398 },
    { name: 'Brest', region: 'Bretagne', lat: 48.3904, lng: -4.4861, pop: 139163 },
    { name: 'Tours', region: 'Centre-Val de Loire', lat: 47.3941, lng: 0.6848, pop: 136252 },
    { name: 'Amiens', region: 'Hauts-de-France', lat: 49.8941, lng: 2.2957, pop: 132874 },
    { name: 'Limoges', region: 'Nouvelle-Aquitaine', lat: 45.8336, lng: 1.2611, pop: 131624 },
    { name: 'Annecy', region: 'Auvergne-Rhône-Alpes', lat: 45.8992, lng: 6.1294, pop: 126924 },
    { name: 'Perpignan', region: 'Occitanie', lat: 42.6886, lng: 2.8948, pop: 120158 },
    { name: 'Boulogne-Billancourt', region: 'Île-de-France', lat: 48.8356, lng: 2.2402, pop: 119954 },
    { name: 'Metz', region: 'Grand Est', lat: 49.1193, lng: 6.1757, pop: 116581 },
    { name: 'Besançon', region: 'Bourgogne-Franche-Comté', lat: 47.2378, lng: 6.0241, pop: 115934 },
    { name: 'Orléans', region: 'Centre-Val de Loire', lat: 47.9029, lng: 1.9093, pop: 114644 },
    { name: 'Saint-Denis', region: 'Île-de-France', lat: 48.9362, lng: 2.3574, pop: 111135 },
    { name: 'Rouen', region: 'Normandie', lat: 49.4432, lng: 1.0999, pop: 110169 },
    { name: 'Argenteuil', region: 'Île-de-France', lat: 48.9478, lng: 2.2483, pop: 110210 },
    { name: 'Montreuil', region: 'Île-de-France', lat: 48.8623, lng: 2.4412, pop: 109897 },
    { name: 'Mulhouse', region: 'Grand Est', lat: 47.7508, lng: 7.3359, pop: 109443 },
    { name: 'Caen', region: 'Normandie', lat: 49.1829, lng: -0.3707, pop: 105403 },
    { name: 'Nancy', region: 'Grand Est', lat: 48.6921, lng: 6.1844, pop: 104286 },
    { name: 'Tourcoing', region: 'Hauts-de-France', lat: 50.7239, lng: 3.1612, pop: 97368 },
    { name: 'Roubaix', region: 'Hauts-de-France', lat: 50.6927, lng: 3.1778, pop: 96118 },
    { name: 'Nanterre', region: 'Île-de-France', lat: 48.8924, lng: 2.2069, pop: 95105 },
    { name: 'Vitry-sur-Seine', region: 'Île-de-France', lat: 48.7876, lng: 2.3928, pop: 93357 },
    { name: 'Avignon', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.9493, lng: 4.8055, pop: 91921 },
    { name: 'Créteil', region: 'Île-de-France', lat: 48.7904, lng: 2.4556, pop: 90605 },
    { name: 'Poitiers', region: 'Nouvelle-Aquitaine', lat: 46.5802, lng: 0.3404, pop: 88291 },
    { name: 'Dunkerque', region: 'Hauts-de-France', lat: 51.0343, lng: 2.3768, pop: 86865 },
    { name: 'Aubervilliers', region: 'Île-de-France', lat: 48.9131, lng: 2.3831, pop: 86375 },
    { name: 'Versailles', region: 'Île-de-France', lat: 48.8014, lng: 2.1301, pop: 85205 },
    { name: 'Aulnay-sous-Bois', region: 'Île-de-France', lat: 48.9386, lng: 2.4906, pop: 85111 },
    { name: 'Asnières-sur-Seine', region: 'Île-de-France', lat: 48.9106, lng: 2.2891, pop: 85191 },
    { name: 'Colombes', region: 'Île-de-France', lat: 48.9236, lng: 2.2522, pop: 85177 },
    { name: 'Courbevoie', region: 'Île-de-France', lat: 48.8966, lng: 2.2561, pop: 82198 },
    { name: 'Cherbourg-en-Cotentin', region: 'Normandie', lat: 49.6337, lng: -1.6221, pop: 80616 },
    { name: 'Rueil-Malmaison', region: 'Île-de-France', lat: 48.8778, lng: 2.1802, pop: 77986 },
    { name: 'Pau', region: 'Nouvelle-Aquitaine', lat: 43.2951, lng: -0.3708, pop: 77130 },
    { name: 'Champigny-sur-Marne', region: 'Île-de-France', lat: 48.8171, lng: 2.5146, pop: 77039 },
    { name: 'La Rochelle', region: 'Nouvelle-Aquitaine', lat: 46.1603, lng: -1.1511, pop: 75735 },
    { name: 'Saint-Maur-des-Fossés', region: 'Île-de-France', lat: 48.8055, lng: 2.4850, pop: 75298 },
    { name: 'Antibes', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.5804, lng: 7.1251, pop: 72999 },
    { name: 'Calais', region: 'Hauts-de-France', lat: 50.9513, lng: 1.8587, pop: 72929 },
    { name: 'Cannes', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.5528, lng: 7.0174, pop: 73965 },
    { name: 'Béziers', region: 'Occitanie', lat: 43.3442, lng: 3.2158, pop: 77599 },
    { name: 'Colmar', region: 'Grand Est', lat: 48.0794, lng: 7.3585, pop: 68703 },
    { name: 'Saint-Nazaire', region: 'Pays de la Loire', lat: 47.2736, lng: -2.2137, pop: 70619 },
    { name: 'Drancy', region: 'Île-de-France', lat: 48.9238, lng: 2.4431, pop: 71318 },
    { name: 'Bourges', region: 'Centre-Val de Loire', lat: 47.0810, lng: 2.3988, pop: 64668 },
    { name: 'Mérignac', region: 'Nouvelle-Aquitaine', lat: 44.8386, lng: -0.6436, pop: 70813 },
    { name: 'Ajaccio', region: 'Corse', lat: 41.9267, lng: 8.7369, pop: 70659 },
    { name: 'Issy-les-Moulineaux', region: 'Île-de-France', lat: 48.8245, lng: 2.2743, pop: 68260 },
    { name: 'Levallois-Perret', region: 'Île-de-France', lat: 48.8950, lng: 2.2872, pop: 65817 },
    { name: 'Villeneuve-d\'Ascq', region: 'Hauts-de-France', lat: 50.6233, lng: 3.1442, pop: 63153 },
    { name: 'Quimper', region: 'Bretagne', lat: 47.9975, lng: -4.0979, pop: 63166 },
    { name: 'Valence', region: 'Auvergne-Rhône-Alpes', lat: 44.9334, lng: 4.8924, pop: 63714 },
    { name: 'Noisy-le-Grand', region: 'Île-de-France', lat: 48.8475, lng: 2.5522, pop: 68126 },
    { name: 'La Seyne-sur-Mer', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.0984, lng: 5.8845, pop: 62762 },
    { name: 'Antony', region: 'Île-de-France', lat: 48.7539, lng: 2.2975, pop: 62570 },
    { name: 'Neuilly-sur-Seine', region: 'Île-de-France', lat: 48.8844, lng: 2.2692, pop: 59940 },
    { name: 'Troyes', region: 'Grand Est', lat: 48.2973, lng: 4.0744, pop: 61996 },
    { name: 'Vénissieux', region: 'Auvergne-Rhône-Alpes', lat: 45.6978, lng: 4.8864, pop: 67129 },
    { name: 'Clichy', region: 'Île-de-France', lat: 48.9044, lng: 2.3047, pop: 62485 },
    { name: 'Pessac', region: 'Nouvelle-Aquitaine', lat: 44.8055, lng: -0.6308, pop: 64374 },
    { name: 'Ivry-sur-Seine', region: 'Île-de-France', lat: 48.8153, lng: 2.3847, pop: 63309 },
    { name: 'Chambéry', region: 'Auvergne-Rhône-Alpes', lat: 45.5646, lng: 5.9178, pop: 58833 },
    { name: 'Lorient', region: 'Bretagne', lat: 47.7483, lng: -3.3702, pop: 57084 },
    { name: 'Cergy', region: 'Île-de-France', lat: 49.0359, lng: 2.0601, pop: 65177 },
    { name: 'Montauban', region: 'Occitanie', lat: 44.0176, lng: 1.3550, pop: 60952 },
    { name: 'Niort', region: 'Nouvelle-Aquitaine', lat: 46.3237, lng: -0.4645, pop: 59059 },
    { name: 'Villejuif', region: 'Île-de-France', lat: 48.7917, lng: 2.3636, pop: 54964 },
    { name: 'Sarcelles', region: 'Île-de-France', lat: 48.9958, lng: 2.3800, pop: 58811 },
    { name: 'Hyères', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.1205, lng: 6.1286, pop: 55588 },
    { name: 'Cholet', region: 'Pays de la Loire', lat: 47.0592, lng: -0.8773, pop: 53917 },
    { name: 'Vannes', region: 'Bretagne', lat: 47.6582, lng: -2.7608, pop: 53352 },
    { name: 'Pantin', region: 'Île-de-France', lat: 48.8966, lng: 2.4017, pop: 59060 },
    { name: 'Fréjus', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.4332, lng: 6.7370, pop: 53039 },
    { name: 'Beauvais', region: 'Hauts-de-France', lat: 49.4295, lng: 2.0812, pop: 56020 },
    { name: 'Narbonne', region: 'Occitanie', lat: 43.1842, lng: 3.0031, pop: 55375 },
    { name: 'Arles', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.6766, lng: 4.6278, pop: 51031 },
    { name: 'Annecy', region: 'Auvergne-Rhône-Alpes', lat: 45.8992, lng: 6.1294, pop: 126924 },
    { name: 'Brive-la-Gaillarde', region: 'Nouvelle-Aquitaine', lat: 45.1585, lng: 1.5321, pop: 46630 },
    { name: 'Châteauroux', region: 'Centre-Val de Loire', lat: 46.8103, lng: 1.6912, pop: 43442 },
    { name: 'Tarbes', region: 'Occitanie', lat: 43.2327, lng: 0.0761, pop: 41518 },
    { name: 'Albi', region: 'Occitanie', lat: 43.9279, lng: 2.1480, pop: 48970 },
    { name: 'Carcassonne', region: 'Occitanie', lat: 43.2128, lng: 2.3536, pop: 46513 },
    { name: 'Charleville-Mézières', region: 'Grand Est', lat: 49.7719, lng: 4.7161, pop: 46428 },
    { name: 'Chalon-sur-Saône', region: 'Bourgogne-Franche-Comté', lat: 46.7806, lng: 4.8532, pop: 45056 },
    { name: 'Angoulême', region: 'Nouvelle-Aquitaine', lat: 45.6484, lng: 0.1560, pop: 41740 },
    { name: 'Belfort', region: 'Bourgogne-Franche-Comté', lat: 47.6397, lng: 6.8638, pop: 47656 },
    { name: 'Roanne', region: 'Auvergne-Rhône-Alpes', lat: 46.0354, lng: 4.0722, pop: 34366 },
    { name: 'Auxerre', region: 'Bourgogne-Franche-Comté', lat: 47.7989, lng: 3.5736, pop: 34634 },
    { name: 'Nevers', region: 'Bourgogne-Franche-Comté', lat: 46.9935, lng: 3.1627, pop: 33279 },
    { name: 'Épinal', region: 'Grand Est', lat: 48.1751, lng: 6.4497, pop: 31740 },
    { name: 'Macon', region: 'Bourgogne-Franche-Comté', lat: 46.3051, lng: 4.8320, pop: 33810 },
    { name: 'Bastia', region: 'Corse', lat: 42.6973, lng: 9.4509, pop: 48044 },
    { name: 'Vichy', region: 'Auvergne-Rhône-Alpes', lat: 46.1278, lng: 3.4265, pop: 24980 },
    { name: 'Thionville', region: 'Grand Est', lat: 49.3579, lng: 6.1674, pop: 40701 },
    { name: 'Castres', region: 'Occitanie', lat: 43.6050, lng: 2.2400, pop: 41636 }
];

// Préparation des requêtes d'insertion
const insertCity = db.prepare('INSERT INTO raw_cities (name, lat, lng, population, region) VALUES (?, ?, ?, ?, ?)');
const insertParking = db.prepare('INSERT INTO raw_parking (city_name, available_spots, avg_price) VALUES (?, ?, ?)');
const insertTransformed = db.prepare('INSERT INTO transformed_city_parking (city_id, name, lat, lng, population, region, total_spots, avg_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const insertScore = db.prepare('INSERT INTO kpi_city_scores (transformed_id, score, demand_level, competition_level, recommendation) VALUES (?, ?, ?, ?, ?)');

// 3. Génération des données
db.transaction(() => {
    for (const city of realCities) {
        // Insertion Raw City
        const cityInfo = insertCity.run(city.name, city.lat, city.lng, city.pop, city.region);
        const cityId = cityInfo.lastInsertRowid;

        // Génération Faker pour les métriques de parking (proportionnelle à la population)
        const spots = Math.floor(city.pop * faker.number.float({ min: 0.05, max: 0.15 })); 
        const price = faker.number.float({ min: 1.5, max: 6.0, fractionDigits: 2 });
        insertParking.run(city.name, spots, price);

        // Insertion Transformed
        const transformedInfo = insertTransformed.run(cityId, city.name, city.lat, city.lng, city.pop, city.region, spots, price);
        const transformedId = transformedInfo.lastInsertRowid;

        // Génération Faker pour les KPI
        const score = faker.number.int({ min: 30, max: 95 });
        const demand = score >= 80 ? 'Pénurie' : score >= 50 ? 'Zone tendue' : 'Accessible';
        
        insertScore.run(transformedId, score, demand, 'Moyenne', 'À surveiller');
    }
})();

console.log(`✅ ${realCities.length} villes réalistes générées avec succès !`);
db.close();

