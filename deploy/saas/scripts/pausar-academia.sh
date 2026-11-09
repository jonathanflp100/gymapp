#!/usr/bin/env bash
# Pausa uma academia (ex.: mensalidade atrasada). Os dados ficam guardados.
# Uso: ./scripts/pausar-academia.sh <apelido>      Para voltar: ./scripts/reativar-academia.sh <apelido>
set -euo pipefail
cd "$(dirname "$0")/.."
SLUG="${1:?Informe o apelido}"
ENV="tenants/$SLUG/.env"; [[ -e "$ENV" ]] || { echo "Academia '$SLUG' não existe."; exit 1; }
docker compose -p "gym-$SLUG" --env-file "$ENV" -f academia.compose.yml stop
[[ -e "sites/$SLUG.caddy" ]] && mv "sites/$SLUG.caddy" "sites/$SLUG.caddy.pausado"
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
echo "Academia '$SLUG' pausada. Dados preservados em tenants/$SLUG/data."
