#!/usr/bin/env bash
# Reativa uma academia pausada.
set -euo pipefail
cd "$(dirname "$0")/.."
SLUG="${1:?Informe o apelido}"
ENV="tenants/$SLUG/.env"; [[ -e "$ENV" ]] || { echo "Academia '$SLUG' não existe."; exit 1; }
docker compose -p "gym-$SLUG" --env-file "$ENV" -f academia.compose.yml up -d
[[ -e "sites/$SLUG.caddy.pausado" ]] && mv "sites/$SLUG.caddy.pausado" "sites/$SLUG.caddy"
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
echo "Academia '$SLUG' reativada."
