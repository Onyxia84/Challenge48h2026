cat > ~/Challenge48h2026/infra/README.md << 'EOF'

# Infra — Parkshare Challenge 48h

## Architecture

```
Internet
   │
   ▼
[51.77.216.210:80/443]
   │
Nginx (système, CT1)  ← HTTPS via Let's Encrypt
   │
   ▼
[localhost:3000]
   │
Docker (dashboard)  ← Node.js + Express + SQLite
```

### Services

| Service          | Technologie       | Port   | Accès             |
| ---------------- | ----------------- | ------ | ------------------ |
| Reverse proxy    | Nginx (système)  | 80/443 | Public             |
| Dashboard        | Node.js + Express | 3000   | Interne uniquement |
| Base de données | SQLite            | —     | Volume Docker      |

### Réseau

- **vmbr0** : bridge public (`51.77.216.210/24`)
- **vmbr1** : bridge privé NAT (`10.0.0.1/24`)
- **CT1** : `10.0.0.10` — héberge Nginx + Docker
- Port forwarding : `51.77.216.210:80/443` → `10.0.0.10:80/443`---

---

## Accès

| Service          | URL                                     |
| ---------------- | --------------------------------------- |
| Dashboard        | https://parkshare-dashboard.duckdns.org |
| Dashboard (HTTP) | http://parkshare-dashboard.duckdns.org  |

---

## Variables d'environnement

Voir `.env.example` à la racine du projet.

```bash
cp .env.example .env
# Remplir les valeurs dans .env
```

| Variable           | Description              | Exemple                             |
| ------------------ | ------------------------ | ----------------------------------- |
| `DASHBOARD_PORT` | Port du dashboard        | `3000`                            |
| `SQLITE_DB_PATH` | Chemin de la base SQLite | `/app/database/parkshare.db`      |
| `DOMAIN`         | Nom de domaine           | `parkshare-dashboard.duckdns.org` |

---

## Commandes utiles

```bash
# Voir les logs en temps réel
docker compose logs -f

# Redémarrer le dashboard
docker compose restart dashboard

# Arrêter la stack
docker compose down

# Arrêter et supprimer les volumes (⚠ supprime la DB)
docker compose down -v

# Vérifier l'état des conteneurs
docker compose ps

# Accéder au shell du conteneur
docker exec -it parkshare_dashboard sh
```

---

## Sécurité

- **Secrets** : gérés via `.env` (jamais commité — voir `.gitignore`)
- **Base de données** : SQLite dans un volume Docker, non exposée
- **Pare-feu** : ufw actif sur CT1 (ports 22, 80, 443 uniquement)
- **HTTPS** : certificat Let's Encrypt via Certbot (renouvellement automatique)
- **Réseau** : CT1 en IP privée `10.0.0.10`, jamais exposé directement

---

## Structure

```
infra/
├── docker-compose.yml   ← Orchestration des services
├── nginx/
│   └── default.conf     ← Config reverse proxy + HTTPS
└── README.md            ← Ce fichier
```
