#!/usr/bin/env bash
# Lista as academias do SaaS e se estão no ar.
cd "$(dirname "$0")/.."
printf "%-16s %-36s %-10s %s\n" APELIDO DOMINIO STATUS CRIADA
for env in tenants/*/.env; do
  [[ -e "$env" ]] || { echo "(nenhuma academia ainda)"; exit 0; }
  # shellcheck disable=SC1090
  ( set -a; source "$env"; set +a
    up=$(docker compose -p "gym-$SLUG" -f academia.compose.yml --env-file "$env" ps --status running -q 2>/dev/null | wc -l)
    status="parada"; [[ "$up" -ge 3 ]] && status="no ar"
    printf "%-16s %-36s %-10s %s\n" "$SLUG" "$DOMAIN" "$status" "${CREATED_AT:-?}" )
done
