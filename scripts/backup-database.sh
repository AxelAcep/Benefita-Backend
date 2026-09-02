#!/usr/bin/env bash
#
# Backup database ke file .sql plain-text (bukan format custom/directory)
# biar aman dipindah/restore lintas versi PostgreSQL yang beda (pakai psql,
# bukan pg_restore yang rewel soal versi).
#
# Baca DATABASE_URL dari .env, strip query param `?schema=...` yang gak
# dikenal libpq (pg_dump nolak URI kalau ada query param asing), terus pass
# schema-nya lewat flag --schema= punya pg_dump sendiri.
#
# Usage: ./scripts/backup-database.sh [nama-file-output]
# Default output: new_benefita_backup.sql di root project ini.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
OUTPUT_FILE="${1:-$ROOT_DIR/new_benefita_backup.sql}"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env tidak ditemukan di $ENV_FILE" >&2
  exit 1
fi

# Ambil DATABASE_URL dari .env tanpa nge-source seluruh file (hindari efek
# samping kalau ada baris lain yang aneh-aneh).
DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -n1 | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//')"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL tidak ketemu di .env" >&2
  exit 1
fi

# Pisahin base URL (tanpa query string) dan ambil nilai schema-nya kalau ada.
BASE_URL="${DATABASE_URL%%\?*}"
QUERY_STRING="${DATABASE_URL#*\?}"
SCHEMA="public"
if [[ "$DATABASE_URL" == *"?"* ]] && [[ "$QUERY_STRING" == *"schema="* ]]; then
  SCHEMA="$(echo "$QUERY_STRING" | tr '&' '\n' | grep '^schema=' | head -n1 | cut -d'=' -f2)"
fi

echo "→ Dumping schema \"$SCHEMA\" dari $(echo "$BASE_URL" | sed -E 's#(://[^:]+):[^@]+@#\1:***@#')"
echo "→ Output: $OUTPUT_FILE"

pg_dump "$BASE_URL" \
  --schema="$SCHEMA" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --file="$OUTPUT_FILE"

SIZE="$(du -h "$OUTPUT_FILE" | cut -f1)"
echo "✅ Backup selesai — $OUTPUT_FILE ($SIZE)"
