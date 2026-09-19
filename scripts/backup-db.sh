#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# H&H Automated PostgreSQL Backup Script
# ==============================================================================

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/hh_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Starting PostgreSQL database backup..."

# If running inside docker compose environment
if docker ps --format '{{.Names}}' | grep -q "hh-postgres-prod"; then
    echo "[$(date -Iseconds)] Dumping from hh-postgres-prod container..."
    docker exec hh-postgres-prod pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-hh_prod}" | gzip > "${BACKUP_FILE}"
elif docker ps --format '{{.Names}}' | grep -q "hh-postgres"; then
    echo "[$(date -Iseconds)] Dumping from local dev container hh-postgres..."
    docker exec hh-postgres pg_dump -U postgres hh_dev | gzip > "${BACKUP_FILE}"
elif [ -n "${DATABASE_URL:-}" ]; then
    echo "[$(date -Iseconds)] Dumping from DATABASE_URL..."
    pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILE}"
else
    echo "ERROR: Neither running postgres container nor DATABASE_URL found." >&2
    exit 1
fi

# Verify backup was created and is non-empty
if [ -s "${BACKUP_FILE}" ]; then
    FILE_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
    echo "[$(date -Iseconds)] Backup completed successfully: ${BACKUP_FILE} (${FILE_SIZE})"
else
    echo "ERROR: Backup file is empty or was not created!" >&2
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Prune old backups older than RETENTION_DAYS
echo "[$(date -Iseconds)] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "hh_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "[$(date -Iseconds)] Backup operation finished."
