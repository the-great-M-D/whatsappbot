#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")"

echo "[BOOT] Installing mobile dependencies..."
npm install

echo "[BOOT] Building TypeScript..."
npm run build

echo "[BOOT] Starting..."
npm start
