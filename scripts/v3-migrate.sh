#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

echo "Checking Drizzle migration state..."
npm run db:check
echo "Applying migrations..."
npm run db:migrate
echo "V3 database migration complete."
