#!/usr/bin/env bash
# Cria e sobe uma academia nova no SaaS.
# Uso: ./scripts/nova-academia.sh <apelido> <dominio> "<Nome da Academia>" [pt-BR|es-PY] [#cor]
# Ex.: ./scripts/nova-academia.sh titan titan.seuapp.com "Gimnasio Titán" es-PY "#2563EB"
#
# Antes: aponte o domínio (registro A) para o IP desta VPS.
set -euo pipefail
cd "$(dirname "$0")/.."

SLUG="${1:?Informe o apelido (só letras minúsculas, números e hífen)}"
DOMAIN="${2:?Informe o domínio (ex.: app.academia.com.br)}"
NAME="${3:?Informe o nome da academia entre aspas}"
LANG_CODE="${4:-pt-BR}"
COLOR="${5:-#DC2626}"

[[ "$SLUG" =~ ^[a-z0-9-]{2,30}$ ]] || { echo "Apelido inválido: use 2 a 30 letras minúsculas, números ou hífen."; exit 1; }
[[ "$LANG_CODE" == "pt-BR" || "$LANG_CODE" == "es-PY" ]] || { echo "Idioma deve ser pt-BR ou es-PY."; exit 1; }
TENANT_DIR="$(pwd)/tenants/$SLUG"
[[ -e "$TENANT_DIR/.env" ]] && { echo "A academia '$SLUG' já existe em $TENANT_DIR"; exit 1; }

TZ_NAME="America/Sao_Paulo"; [[ "$LANG_CODE" == "es-PY" ]] && TZ_NAME="America/Asuncion"
SETUP_CODE="$(tr -dc 'A-Z0-9' </dev/urandom | head -c 8)"
GYM_CODE="$(echo "$SLUG" | tr 'a-z' 'A-Z' | tr -cd 'A-Z0-9' | head -c 12)"

mkdir -p "$TENANT_DIR/data/opengym" "$TENANT_DIR/data/hub"
cat > "$TENANT_DIR/.env" <<ENV
SLUG=$SLUG
DOMAIN=$DOMAIN
TENANT_DIR=$TENANT_DIR
GYM_NAME="$NAME"
GYM_LANG=$LANG_CODE
GYM_CODE=$GYM_CODE
GYM_COLOR=$COLOR
TZ=$TZ_NAME
SETUP_CODE=$SETUP_CODE
CREATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
ENV
chmod 600 "$TENANT_DIR/.env"

docker compose -p "gym-$SLUG" --env-file "$TENANT_DIR/.env" -f academia.compose.yml up -d

cat > "sites/$SLUG.caddy" <<SITE
$DOMAIN {
	encode gzip
	reverse_proxy gym-$SLUG-web:80
}
SITE
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile

cat <<MSG

Academia criada!
  Endereço ........ https://$DOMAIN
  Código ativação . $SETUP_CODE   (guarde e passe só para o dono da academia)

Próximos passos:
  1. Abra https://$DOMAIN, crie a conta do dono.
  2. Perfil → "Administrador da academia" → digite o código acima.
  3. Engrenagem no topo → logo, cores, contato, equipe e cartaz com QR code.
MSG
