#!/usr/bin/env bash
# Backup de todas as academias (contas, treinos, marca, aulas, avaliações).
# Agende todo dia às 3h:  crontab -e  →  0 3 * * * /caminho/deploy/saas/scripts/backup.sh
# Mantém os últimos 14 dias. Copie a pasta backups/ para fora da VPS (ex.: rclone para o Google Drive).
set -euo pipefail
cd "$(dirname "$0")/.."
STAMP="$(date +%Y-%m-%d_%H%M)"
mkdir -p backups
tar -czf "backups/academias_$STAMP.tar.gz" tenants
find backups -name 'academias_*.tar.gz' -mtime +14 -delete
echo "Backup salvo: backups/academias_$STAMP.tar.gz ($(du -h "backups/academias_$STAMP.tar.gz" | cut -f1))"
