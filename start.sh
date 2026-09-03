#!/bin/bash
cd "$(dirname "$0")"

# ── Environment ──
export SESSION="${SESSION:-M_D}"
export PREFIX="${PREFIX:-!}"
export NAME="${NAME:-M_D Bot}"
export PORT="${PORT:-4041}"
export NODE_ENV="${NODE_ENV:-production}"

# Source secrets if available
source /app/.agents/.env 2>/dev/null

export DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-https://discord.com/api/webhooks/1511458704036462633/Lyn_GnEfW9ckUxUeJffW13EfHKI1_xpYAvIrSQlXmZr_8q51Coq1OVDTf210_SoKlzsK}"

LOG="/tmp/bot_output.log"
BRIDGE_LOG="/tmp/discord_bridge.log"
MAX_RESTARTS=999
RESTART_DELAY=5
restart_count=0

echo "[Manager] Starting resilient bot manager..."

while [ $restart_count -lt $MAX_RESTARTS ]; do
    restart_count=$((restart_count + 1))
    echo "[Manager] Starting bot (attempt $restart_count) at $(date)"

    # Start the WhatsApp bot
    node dist/kaoi.js > "$LOG" 2>&1 &
    BOT_PID=$!
    echo "[Manager] Bot PID: $BOT_PID"

    # Wait for it to exit
    wait $BOT_PID
    EXIT_CODE=$?
    echo "[Manager] Bot exited with code $EXIT_CODE at $(date)"

    # If it exited cleanly (code 0), don't restart
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[Manager] Clean exit — not restarting."
        break
    fi

    echo "[Manager] Crash detected — restarting in ${RESTART_DELAY}s..."
    sleep $RESTART_DELAY
done

echo "[Manager] Bot manager stopped after $restart_count attempts."
