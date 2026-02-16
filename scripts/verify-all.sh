#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_PORT="${WEB_PORT:-3000}"
MOBILE_PORT="${MOBILE_PORT:-8088}"
TMP_DIR="$ROOT_DIR/.tmp"
mkdir -p "$TMP_DIR"

WEB_LOG="$TMP_DIR/verify-web.log"
MOBILE_LOG="$TMP_DIR/verify-mobile.log"

cleanup() {
  set +e
  [[ -n "${MOBILE_PID:-}" ]] && kill "$MOBILE_PID" >/dev/null 2>&1
  [[ -n "${WEB_PID:-}" ]] && kill "$WEB_PID" >/dev/null 2>&1
}
trap cleanup EXIT INT TERM

echo "[verify] Starting web server..."
(
  cd "$ROOT_DIR"
  LIFEOS_STRICT_INTEGRATIONS=false npm run dev -- --port "$WEB_PORT"
) >"$WEB_LOG" 2>&1 &
WEB_PID=$!

for _ in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:${WEB_PORT}" >/dev/null; then
    break
  fi
  sleep 1
done

echo "[verify] Testing login + APIs..."
LOGIN_JSON=$(curl -s -X POST "http://127.0.0.1:${WEB_PORT}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@lifeos.dev","password":"demo1234"}')

TOKEN=$(printf '%s' "$LOGIN_JSON" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [[ -z "$TOKEN" ]]; then
  echo "[verify] Failed to get token"
  echo "$LOGIN_JSON"
  exit 1
fi

curl -sf "http://127.0.0.1:${WEB_PORT}/api/auth/me" -H "Authorization: Bearer $TOKEN" >/dev/null
curl -sf "http://127.0.0.1:${WEB_PORT}/api/lifeos/dashboard" -H "Authorization: Bearer $TOKEN" >/dev/null
curl -sf "http://127.0.0.1:${WEB_PORT}/api/lifeos/live" -H "Authorization: Bearer $TOKEN" >/dev/null
curl -sf -X POST "http://127.0.0.1:${WEB_PORT}/api/lifeos/actions/run" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"actionId":"job-sprint"}' >/dev/null

echo "[verify] Starting Expo Metro (non-interactive) ..."
(
  cd "$ROOT_DIR/apps/mobile"
  EXPO_PUBLIC_API_BASE_URL="http://localhost:${WEB_PORT}" npm run start -- --non-interactive --port "$MOBILE_PORT"
) >"$MOBILE_LOG" 2>&1 &
MOBILE_PID=$!

sleep 15
if ! ps -p "$MOBILE_PID" >/dev/null 2>&1; then
  echo "[verify] Metro process exited early"
  tail -n 80 "$MOBILE_LOG" || true
  exit 1
fi

echo "[verify] Running TypeScript checks..."
(
  cd "$ROOT_DIR"
  npx tsc --noEmit >/dev/null
)
(
  cd "$ROOT_DIR/apps/mobile"
  npx tsc --noEmit >/dev/null
)

echo "[verify] PASS"
echo "  web log: $WEB_LOG"
echo "  mobile log: $MOBILE_LOG"
