#!/usr/bin/env bash
# Prepara a VPS do SaaS: compila as imagens e sobe o proxy com HTTPS.
# Uso (dentro de deploy/saas):  ACME_EMAIL=voce@seudominio.com ./scripts/instalar.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(cd ../.. && pwd)"

command -v docker >/dev/null || { echo "Instale o Docker primeiro: https://docs.docker.com/engine/install/"; exit 1; }

echo "==> Compilando o servidor de contas (openGym v1.4.4)"
docker build -t gymapp-opengym-api:v1.4.4 "https://github.com/DuarteSantos8/openGym.git#v1.4.4:api"

echo "==> Compilando o servidor da academia (hub)"
docker build -t gymapp-hub:latest "$ROOT/server/hub"

echo "==> Compilando o app"
docker build -t gymapp-web:latest "$ROOT"

echo "==> Subindo o proxy (Caddy, HTTPS automático)"
mkdir -p sites tenants backups
docker compose up -d

echo
echo "Pronto. Crie a primeira academia com:"
echo "  ./scripts/nova-academia.sh forcatotal app.forcatotal.com.br \"Academia Força Total\" pt-BR"
