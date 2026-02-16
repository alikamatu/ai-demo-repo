#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_PORT="${WEB_PORT:-3000}"
MOBILE_PORT="${MOBILE_PORT:-8081}"
TMP_DIR="$ROOT_DIR/.tmp"
mkdir -p "$TMP_DIR"

WEB_LOG="$TMP_DIR/web-dev.log"
MOBILE_LOG="$TMP_DIR/mobile-dev.log"

cleanup() {
  set +e
  if [[ -n "${MOBILE_PID:-}" ]]; then kill "$MOBILE_PID" >/dev/null 2>&1; fi
  if [[ -n "${WEB_PID:-}" ]]; then kill "$WEB_PID" >/dev/null 2>&1; fi
}
trap cleanup EXIT INT TERM

echo "[run-all] Starting web on port $WEB_PORT"
(
  cd "$ROOT_DIR"
  npm run dev -- --port "$WEB_PORT"
) >"$WEB_LOG" 2>&1 &
WEB_PID=$!

echo "[run-all] Waiting for web server..."
for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${WEB_PORT}/api/healthz" -o /dev/null; then
    break
  fi
  sleep 1
done

echo "[run-all] Starting mobile Metro on port $MOBILE_PORT"
(
  cd "$ROOT_DIR/apps/mobile"
  EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-http://localhost:${WEB_PORT}}" npm run start -- --non-interactive --port "$MOBILE_PORT"
) >"$MOBILE_LOG" 2>&1 &
MOBILE_PID=$!

echo "[run-all] Running"
echo "  Web:    http://localhost:${WEB_PORT}"
echo "  Mobile: Expo Metro on ${MOBILE_PORT}"
echo "  Logs:   $WEB_LOG"
echo "  Logs:   $MOBILE_LOG"
echo "Press Ctrl+C to stop both."

while true; do
  if ! kill -0 "$WEB_PID" >/dev/null 2>&1; then
    wait "$WEB_PID"
    EXIT_CODE=$?
    echo "[run-all] Web process exited with code $EXIT_CODE"
    exit "$EXIT_CODE"
  fi

  if ! kill -0 "$MOBILE_PID" >/dev/null 2>&1; then
    wait "$MOBILE_PID"
    EXIT_CODE=$?
    echo "[run-all] Mobile process exited with code $EXIT_CODE"
    exit "$EXIT_CODE"
  fi

  sleep 1
done
