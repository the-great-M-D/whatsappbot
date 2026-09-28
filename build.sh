#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")"
npm install
npm run build
echo "[OK] Mobile Termux build complete."
