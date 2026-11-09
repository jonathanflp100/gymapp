#!/usr/bin/env bash
# Atualiza o app em todas as academias depois de um git pull.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(cd ../.. && pwd)"
./scripts/backup.sh
docker build -t gymapp-hub:latest "$ROOT/server/hub"
docker build -t gymapp-web:latest "$ROOT"
for env in tenants/*/.env; do
  [[ -e "$env" ]] || continue
  SLUG="$(basename "$(dirname "$env")")"
  [[ -e "sites/$SLUG.caddy.pausado" ]] && { echo "pulando $SLUG (pausada)"; continue; }
  docker compose -p "gym-$SLUG" --env-file "$env" -f academia.compose.yml up -d
  echo "atualizada: $SLUG"
done
