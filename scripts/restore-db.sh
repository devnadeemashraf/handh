#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# H&H PostgreSQL Database Restore Utility
# ==============================================================================

if [ $# -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz> [--force]"
    exit 1
fi

BACKUP_FILE="$1"
FORCE="${2:-}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}" >&2
    exit 1
fi

echo "=================================================="
echo " H&H Database Restore Utility"
echo " Target File: ${BACKUP_FILE}"
echo "=================================================="

if [ "${FORCE}" != "--force" ]; then
    read -rp "WARNING: This will overwrite existing database records! Are you sure? (y/N) " CONFIRM
    if [[ ! "${CONFIRM}" =~ ^[Yy]$ ]]; then
        echo "Restore aborted by user."
        exit 0
    fi
fi

echo "[$(date -Iseconds)] Restoring database..."

if docker ps --format '{{.Names}}' | grep -q "hh-postgres-prod"; then
    echo "Restoring to hh-postgres-prod container..."
    gunzip -c "${BACKUP_FILE}" | docker exec -i hh-postgres-prod psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-hh_prod}"
elif docker ps --format '{{.Names}}' | grep -q "hh-postgres"; then
    echo "Restoring to local dev container hh-postgres..."
    gunzip -c "${BACKUP_FILE}" | docker exec -i hh-postgres psql -U postgres -d hh_dev
elif [ -n "${DATABASE_URL:-}" ]; then
    echo "Restoring to DATABASE_URL..."
    gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}"
else
    echo "ERROR: Neither running postgres container nor DATABASE_URL found." >&2
    exit 1
fi

echo "[$(date -Iseconds)] Database restoration completed successfully!"
