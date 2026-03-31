# Parkshare Dashboard — Challenge 48h 2026

Outil d'analyse de marché pour identifier les opportunités de parking en France, développé dans le cadre du Challenge 48h Ynov B3.

---

## Sommaire

- [Présentation](#présentation)
- [Architecture du projet](#architecture-du-projet)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation et lancement](#installation-et-lancement)
- [Variables d&#39;environnement](#variables-denvironnement)
- [API](#api)
- [Base de données](#base-de-données)
- [Analyse de données (KPIs)](#analyse-de-données-kpis)
- [Infrastructure](#infrastructure)
- [Déploiement en production](#déploiement-en-production)

---

## Présentation

**Parkshare Dashboard** est une application web d'aide à la décision qui permet d'identifier les immeubles et zones géographiques en France avec un fort potentiel de demande en parking résidentiel. L'outil croise :

- Les données du **Registre National des Copropriétés (RNC)**
- Des indicateurs socio-démographiques
- Des scores d'opportunité calculés par des analyses Python (Jupyter Notebooks)

Le résultat est un tableau de bord interactif avec carte, filtres et graphiques, accessible via navigateur.

---

## Architecture du projet

```
Challenge48h2026/
├── app/                        # Application web (backend + frontend)
│   ├── database/
│   │   ├── init_db.js          # Création du schéma SQLite
│   │   ├── seed_db.js          # Population des données
│   │   ├── import_csv.js       # Import de données CSV
│   │   ├── setup_db.js         # Script de setup complet
│   │   ├── parkshare.db        # Base de données SQLite
│   │   └── export_kpi*.csv     # Exports KPI (1 à 4)
│   ├── public/
│   │   ├── index.html          # Interface du dashboard
│   │   └── dashboard.js        # Logique carte & graphiques
│   ├── server.js               # Serveur Express (API REST)
│   ├── Dockerfile              # Image Docker de l'app
│   ├── entrypoint.sh           # Point d'entrée Docker
│   └── package.json
├── data/                       # Analyse de données & KPIs
│   ├── KPI/
│   │   ├── Score_kpi1.ipynb    # Score potentiel géographique
│   │   ├── Score_kpi2.ipynb    # Ciblage au niveau immeuble
│   │   ├── Score_kpi3.ipynb    # Analyse volumétrique par département
│   │   └── Syndic_kpi4.ipynb   # Classification des syndics
│   ├── Netoyage_data.sql       # Requêtes SQL de nettoyage
│   └── requirements.txt        # Dépendances Python
└── infra/                      # Infrastructure & DevOps
    ├── docker-compose.yml      # Orchestration Docker
    ├── nginx/
    │   └── default.conf        # Reverse proxy Nginx + HTTPS
    ├── .env                    # Variables d'environnement (non versionné)
    └── .env.example            # Template des variables d'environnement
```

---

## Stack technique

### Backend

| Composant        | Technologie                 |
| ---------------- | --------------------------- |
| Runtime          | Node.js                     |
| Framework        | Express.js                  |
| Base de données | SQLite (`better-sqlite3`) |
| Import CSV       | `csv-parser`              |

### Frontend

| Composant         | Technologie                       |
| ----------------- | --------------------------------- |
| Interface         | HTML5 / CSS3 / JavaScript vanilla |
| Carte interactive | Leaflet.js + OpenStreetMap        |
| Graphiques        | Chart.js                          |

### Analyse de données

| Composant  | Technologie      |
| ---------- | ---------------- |
| Notebooks  | Jupyter / Python |
| Traitement | Pandas, NumPy    |
| Requêtes  | SQL (DBeaver)    |

### Infrastructure

| Composant        | Technologie                   |
| ---------------- | ----------------------------- |
| Conteneurisation | Docker                        |
| Orchestration    | Docker Compose                |
| Reverse proxy    | Nginx                         |
| HTTPS            | Let's Encrypt / Certbot       |
| Hébergement     | Proxmox VE (CT1 Alpine Linux) |

---

## Installation et lancement

### Docker

```bash
cd infra

# Copier et configurer les variables d'environnement
cp .env.example .env

# Démarrer le service
docker compose up -d

# Voir les logs
docker compose logs -f
```

---

## Variables d'environnement

Copier `infra/.env.example` vers `infra/.env` et renseigner les valeurs :

| Variable    | Description                | Valeur par défaut             |
| ----------- | -------------------------- | ------------------------------ |
| `PORT`    | Port d'écoute du serveur  | `3000`                       |
| `DB_PATH` | Chemin vers la base SQLite | `/app/database/parkshare.db` |

---

## API

Toutes les routes retournent du JSON.

| Endpoint                    | Méthode | Description                               |
| --------------------------- | -------- | ----------------------------------------- |
| `GET /`                   | GET      | Dashboard HTML                            |
| `GET /api/cities`         | GET      | Liste des immeubles/villes avec filtres   |
| `GET /api/stats`          | GET      | Statistiques globales (nb villes, scores) |
| `GET /api/regions/list`   | GET      | Liste des départements disponibles       |
| `GET /api/regions`        | GET      | Scores moyens par département            |
| `GET /api/villes/ranking` | GET      | Top 15 villes par score d'opportunité    |

### Paramètres de filtrage (`/api/cities`)

| Paramètre   | Type   | Description                    |
| ------------ | ------ | ------------------------------ |
| `maxScore` | number | Score maximum (0–100)         |
| `region`   | string | Code département (ex:`75`)  |
| `minLat`   | number | Latitude minimum (bbox carte)  |
| `maxLat`   | number | Latitude maximum (bbox carte)  |
| `minLng`   | number | Longitude minimum (bbox carte) |
| `maxLng`   | number | Longitude maximum (bbox carte) |

**Exemple :**

```
GET /api/cities?maxScore=70&region=75&minLat=48.8&maxLat=49&minLng=2&maxLng=2.5
```

---

## Base de données

Le schéma SQLite est organisé en trois couches :

### Couche 1 — Données brutes

| Table                | Contenu                             |
| -------------------- | ----------------------------------- |
| `raw_cities`       | Villes avec coordonnées et région |
| `raw_parking`      | Disponibilité parking              |
| `raw_demographics` | Indicateurs socio-démographiques   |

### Couche 2 — Données transformées

| Table                        | Contenu                       |
| ---------------------------- | ----------------------------- |
| `transformed_city_parking` | Données enrichies et jointes |

### Couche 3 — KPIs calculés

| Table                  | Contenu                                    |
| ---------------------- | ------------------------------------------ |
| `kpi_city_scores`    | Score par ville et niveau de demande       |
| `kpi_regional_stats` | Agrégats régionaux                       |
| `kpi1_villes`        | Ciblage géographique (KPI 1)              |
| `kpi2_immeubles`     | Score par immeuble (KPI 2)                 |
| `kpi3_dept`          | Analyse volumétrique département (KPI 3) |
| `kpi4_syndics`       | Classification syndics (KPI 4)             |

### Colonnes clés

| Colonne                         | Description                                     |
| ------------------------------- | ----------------------------------------------- |
| `score_immeuble`              | Score opportunité (0.0–1.0, affiché sur 100) |
| `lots_habitation`             | Nombre de lots résidentiels                    |
| `lots_parking`                | Nombre de places de parking                     |
| `lat` / `long`              | Coordonnées géographiques                     |
| `code_postal` / `dept_code` | Codes localisation                              |

---

## Analyse de données (KPIs)

Les notebooks se trouvent dans `data/KPI/` et s'exécutent avec Jupyter.

```bash
cd data
pip install -r requirements.txt
jupyter notebook
```

| Notebook              | KPI   | Description                             |
| --------------------- | ----- | --------------------------------------- |
| `Score_kpi1.ipynb`  | KPI 1 | Score potentiel géographique par ville |
| `Score_kpi2.ipynb`  | KPI 2 | Ciblage au niveau immeuble              |
| `Score_kpi3.ipynb`  | KPI 3 | Analyse volumétrique par département  |
| `Syndic_kpi4.ipynb` | KPI 4 | Classification et ciblage des syndics   |

Les résultats sont exportés en CSV dans `app/database/` puis importés dans SQLite via `import_csv.js`.

### Code couleur du dashboard

| Couleur | Score  | Interprétation                             |
| ------- | ------ | ------------------------------------------- |
| Vert    | < 65   | Très intéressant — forte tension parking |
| Jaune   | 65–79 | Potentiel moyen                             |
| Rouge   | 80+    | Moins intéressant — parking accessible    |

---

## Infrastructure

Le fichier `infra/docker-compose.yml` orchestre :

- Le conteneur `parkshare_dashboard` (Node.js + SQLite)
- Le reverse proxy Nginx (HTTP → HTTPS)
- Le volume persistant pour la base de données

```
Internet (80/443)
      |
    Nginx (reverse proxy + TLS)
      |
    Dashboard (Node.js :3000)
      |
    SQLite (volume Docker)
```

### Commandes Docker utiles

```bash
# Démarrer
docker compose up -d

# Voir les logs
docker compose logs -f

# Redémarrer le service
docker compose restart dashboard

# Accéder au shell du conteneur
docker exec -it parkshare_dashboard sh

# Arrêter
docker compose down
```

---

## Déploiement en production

| Paramètre     | Valeur                                      |
| -------------- | ------------------------------------------- |
| Domaine        | `parkshare-dashboard.duckdns.org`         |
| IP publique    | `51.77.216.210`                           |
| IP interne     | `10.0.0.10` (CT1)                         |
| Ports exposés | `80` (HTTP → redirect) / `443` (HTTPS) |
| Port interne   | `3000`                                    |
| HTTPS          | Let's Encrypt (renouvellement auto Certbot) |
| Hébergeur     | Proxmox VE — Alpine Linux                  |

Le renouvellement du certificat SSL est géré automatiquement par Certbot via un cron dans le conteneur Nginx.
