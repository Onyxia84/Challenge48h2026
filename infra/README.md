# Infra — Parkshare Dashboard

## Architecture

```
Internet
   │
   ▼
Nginx (hôte VPS) — HTTPS 443 / redirect 80→443
   │  reverse proxy
   ▼
Docker : parkshare_dashboard (Node.js:3000)
   │
   ▼
Volume Docker : sqlite_data  (/app/database/parkshare.db)
```

| Composant        | Technologie              | Exposition          |
|------------------|--------------------------|---------------------|
| Dashboard        | Node.js / Express        | Interne (port 3000) |
| Base de données  | SQLite (volume Docker)   | Interne uniquement  |
| Reverse proxy    | Nginx + Let's Encrypt    | Publique (443/80)   |

> La base de données n'est jamais exposée à l'extérieur. Seul Nginx est en frontal.

---

## Prérequis

- Docker >= 24 et Docker Compose >= 2
- Nginx installé sur le VPS hôte
- Certbot installé sur le VPS hôte
- Un domaine/sous-domaine pointant vers l'IP du VPS (ici via DuckDNS)

---

## Déploiement

### 1. Cloner le dépôt sur le VPS

```bash
git clone <url-du-repo> Challenge48h2026
cd Challenge48h2026
```

### 2. Variables d'environnement

Copier le fichier exemple et renseigner les valeurs :

```bash
cp .env.example .env
# Éditer .env avec les valeurs réelles
```

### 3. Démarrer le container

Depuis le dossier `infra/` :

```bash
cd infra
docker compose up -d --build
```

Le dashboard démarre sur `http://localhost:3000`.  
Au premier lancement, l'entrypoint initialise et peuple automatiquement la base SQLite.

### 4. Configurer Nginx

Copier la configuration dans Nginx :

```bash
sudo cp infra/nginx/default.conf /etc/nginx/sites-available/parkshare
sudo ln -s /etc/nginx/sites-available/parkshare /etc/nginx/sites-enabled/parkshare
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Certificat HTTPS (Let's Encrypt)

```bash
sudo certbot --nginx -d parkshare-dashboard.duckdns.org
```

Certbot modifie automatiquement la config Nginx pour injecter les chemins de certificats.  
Le renouvellement automatique est géré par le timer systemd de Certbot.

---

## URL d'accès

| Service   | URL                                          |
|-----------|----------------------------------------------|
| Dashboard | https://parkshare-dashboard.duckdns.org      |

Le HTTP (port 80) redirige automatiquement vers HTTPS.

---

## Variables d'environnement

Voir [`.env.example`](../.env.example) à la racine du dépôt.

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT`   | Port d'écoute du dashboard | `3000` |

> Ne jamais committer le fichier `.env` avec des valeurs réelles. Il est listé dans `.gitignore`.

---

## Commandes utiles

```bash
# Voir les logs du container
docker compose logs -f dashboard

# Arrêter la stack
docker compose down

# Reconstruire l'image après modification du code
docker compose up -d --build

# Accéder au shell du container
docker compose exec dashboard sh

# Vérifier le statut Nginx
sudo systemctl status nginx

# Renouveler le certificat manuellement
sudo certbot renew --dry-run
```

---

## Structure des fichiers

```
infra/
├── docker-compose.yml   # Orchestration des services
├── nginx/
│   └── default.conf     # Config reverse proxy + HTTPS
└── README.md            # Ce fichier

app/
├── Dockerfile           # Image Node.js 20 Alpine
└── entrypoint.sh        # Init BDD + démarrage serveur
```

---

## Sécurité

- Les secrets sont gérés via variables d'environnement (fichier `.env` non versionné)
- La base de données SQLite est dans un volume Docker interne, non exposée
- Seul Nginx est accessible depuis l'extérieur (ports 80 et 443)
- HTTPS activé via Let's Encrypt avec redirection forcée depuis HTTP
- L'image Docker utilise `node:20-alpine` (surface d'attaque minimale)
