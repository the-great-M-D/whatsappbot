#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")"
echo "[BOOT] Installing minimal mobile dependencies..."
npm install --omit=dev
echo "[BOOT] Building..."
npm run build
echo "[BOOT] Starting..."
npm start
