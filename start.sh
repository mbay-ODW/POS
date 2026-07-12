#!/usr/bin/env bash
#
# POS Komplett-Start für den Raspberry Pi.
#   - startet MongoDB + UI als Container (docker-compose_pi.yml)
#   - startet die REST-API direkt auf dem Host im venv (USB-Drucker)
#
# Nutzung:   ./start.sh
# Beenden:   Strg+C (stoppt die API; Container laufen weiter)
#            ./start.sh stop   -> stoppt auch die Container
#
set -euo pipefail

# Ins Verzeichnis des Skripts wechseln (egal von wo aufgerufen)
cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose_pi.yml"

# ── stop-Modus ───────────────────────────────────────────────
if [[ "${1:-}" == "stop" ]]; then
  echo "▶ Stoppe Container..."
  docker compose -f "$COMPOSE_FILE" down
  echo "✔ Container gestoppt. (Die API war im Vordergrund, ist mit Strg+C beendet.)"
  exit 0
fi

# ── 1. Container (MongoDB + UI) ───────────────────────────────
echo "▶ Starte Container (MongoDB + UI)..."
docker compose -f "$COMPOSE_FILE" pull --quiet || true
docker compose -f "$COMPOSE_FILE" up -d

# ── 2. Auf MongoDB warten ─────────────────────────────────────
echo -n "▶ Warte auf MongoDB "
until docker compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --quiet --eval 'db.runCommand({ping:1})' >/dev/null 2>&1; do
  echo -n "."
  sleep 1
done
echo " bereit."

# ── 3. venv sicherstellen ─────────────────────────────────────
cd RestAPI
if [[ ! -d venv ]]; then
  echo "▶ Lege Python-venv an..."
  python3 -m venv venv
  ./venv/bin/pip install --upgrade pip
  ./venv/bin/pip install -r requirements.txt
fi

# ── 4. API im Vordergrund starten ─────────────────────────────
echo "▶ Starte REST-API (Strg+C zum Beenden)..."
exec ./venv/bin/python server.py
