# 🅿️ Parkshare — Dashboard d'Opportunités de Stationnement

## 📦 Stack technique
- **Base de données** : SQLite (via better-sqlite3)
- **Backend** : Node.js + Express
- **Frontend** : HTML/CSS + Leaflet.js + Chart.js
- **Données** : Générées avec @faker-js/faker

---

## 🗄️ Schéma de la base de données

### Couche 1 — Tables sources brutes
Données telles que reçues de l'équipe Data, sans transformation.

| Table | Colonnes | Description |
|-------|----------|-------------|
| `raw_cities` | id, name, lat, lng, population, region, source, imported_at | Villes brutes |
| `raw_parking` | id, city_name, nb_public_spots, nb_private_spots, avg_hourly_price, congestion_index, competition_count, source, imported_at | Données parking brutes |
| `raw_demographics` | id, city_name, density_per_km2, car_ownership_rate, avg_income, commuter_ratio, source, imported_at | Données socio-économiques brutes |

### Couche 2 — Table transformée
Jointure + enrichissement des données brutes.

| Table | Colonnes | Description |
|-------|----------|-------------|
| `transformed_city_parking` | id, city_id (FK→raw_cities), city_name, lat, lng, region, population, density_per_km2, car_ownership_rate, avg_income, commuter_ratio, total_spots, spots_per_capita, avg_hourly_price, congestion_index, competition_count, demand_level, computed_at | Données nettoyées et enrichies |

### Couche 3 — Tables de KPIs
Résultats agrégés prêts à l'affichage.

| Table | Colonnes | Description |
|-------|----------|-------------|
| `kpi_city_scores` | id, city_id (FK), city_name, opportunity_score, rank, demand_category, recommendation, computed_at | Score par ville |
| `kpi_regional_summary` | id, region, nb_cities, avg_score, max_score, min_score, total_population, computed_at | Agrégation régionale |

### Relations
