#!/bin/sh
set -e

DB_PATH="/app/database/parkshare.db"

if [ ! -f "$DB_PATH" ]; then
  echo "Base de données introuvable, initialisation..."
  node database/init_db.js
  node database/seed_db.js
  echo "Base de données initialisée et peuplée."
fi

exec node server.js
