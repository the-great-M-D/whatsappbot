#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== WhatsApp Bot — Termux Installer ==="

if [ -z "${PREFIX:-}" ] || [ ! -d "$PREFIX" ]; then
  echo "[ERROR] This installer must run inside Termux."
  exit 1
fi

command -v node >/dev/null 2>&1 || { echo "[ERROR] Node.js is missing. Run: pkg install nodejs"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "[ERROR] Git is missing. Run: pkg install git"; exit 1; }

echo "[BOOT] Node: $(node --version)"
echo "[BOOT] Installing minimal dependencies..."
npm install

mkdir -p scripts
mkdir -p "${WA_AUTH_DIR:-/storage/1FC3-111D/whatsapp-auth}"
mkdir -p "${BOT_DATA_DIR:-/storage/1FC3-111D/discord}"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[CONFIG] Created .env from .env.example"
else
  echo "[CONFIG] Existing .env preserved"
fi

echo "[BOOT] Building..."
npm run build

echo
echo "[OK] Installation/build complete."
echo
echo "Next:"
echo "  1. Edit .env: nano .env"
echo "  2. Set WA_PHONE_NUMBER and OWNER_NUMBERS."
echo "  3. Optionally configure Discord."
echo "  4. Start: ./start.sh"
echo
echo "QR pairing is disabled. The bot uses a WhatsApp phone-number pairing code."
