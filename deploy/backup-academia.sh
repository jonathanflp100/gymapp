#!/usr/bin/env bash
# Backup diário da LICENÇA PRÓPRIA (uma academia): contas, treinos, marca, equipe, aulas, avaliações e fotos.
# Instale uma vez, na pasta do projeto:   ./deploy/backup-academia.sh --instalar
# Depois disso ele roda sozinho todo dia às 3h e guarda os últimos 14 dias em ./backups.
# Copie a pasta backups/ para fora do servidor de vez em quando (ex.: rclone para o Google Drive).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

if [[ "${1:-}" == "--instalar" ]]; then
  command -v crontab >/dev/null || { echo "Este servidor não tem cron. Instale com: sudo apt install cron"; exit 1; }
  LINE="0 3 * * * $ROOT/deploy/backup-academia.sh >> $ROOT/backups/backup.log 2>&1"
  mkdir -p backups
  (crontab -l 2>/dev/null | grep -v 'backup-academia.sh' ; echo "$LINE") | crontab -
  echo "Backup diário agendado (3h). Fazendo o primeiro agora…"
fi

STAMP="$(date +%Y-%m-%d_%H%M)"
mkdir -p backups
tar -czf "backups/academia_$STAMP.tar.gz" data
find backups -name 'academia_*.tar.gz' -mtime +14 -delete
echo "Backup salvo: backups/academia_$STAMP.tar.gz ($(du -h "backups/academia_$STAMP.tar.gz" | cut -f1))"
