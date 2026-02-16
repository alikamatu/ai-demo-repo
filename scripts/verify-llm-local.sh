#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$ROOT_DIR/.tmp"
mkdir -p "$TMP_DIR"

LLAMA_PORT="${LLAMA_PORT:-8081}"
WEB_PORT="${WEB_PORT:-3000}"
MODEL_PATH="${MODEL_PATH:-$ROOT_DIR/.models/qwen2.5-0.5b-instruct-q4_k_m.gguf}"
MODEL_NAME="$(basename "$MODEL_PATH")"

LLAMA_LOG="$TMP_DIR/verify-llamacpp.log"
WEB_LOG="$TMP_DIR/verify-llm-web.log"

cleanup() {
  set +e
  [[ -n "${WEB_PID:-}" ]] && kill "$WEB_PID" >/dev/null 2>&1
  [[ -n "${LLAMA_PID:-}" ]] && kill "$LLAMA_PID" >/dev/null 2>&1
}
trap cleanup EXIT INT TERM

if [[ ! -f "$MODEL_PATH" ]]; then
  echo "[verify-llm] Missing model file: $MODEL_PATH"
  exit 1
fi

echo "[verify-llm] Starting llama-server..."
(
  cd "$ROOT_DIR"
  llama-server -m "$MODEL_PATH" --host 127.0.0.1 --port "$LLAMA_PORT" --ctx-size 2048 --threads 6
) >"$LLAMA_LOG" 2>&1 &
LLAMA_PID=$!

for _ in $(seq 1 120); do
  if ! ps -p "$LLAMA_PID" >/dev/null 2>&1; then
    echo "[verify-llm] llama-server exited early"
    tail -n 80 "$LLAMA_LOG" || true
    exit 1
  fi
  if curl -sf "http://127.0.0.1:${LLAMA_PORT}/v1/models" >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -sf "http://127.0.0.1:${LLAMA_PORT}/v1/models" >/dev/null; then
  echo "[verify-llm] llama-server did not become ready"
  tail -n 80 "$LLAMA_LOG" || true
  exit 1
fi

echo "[verify-llm] Starting web in llamacpp mode..."
(
  cd "$ROOT_DIR"
  LIFEOS_LLM_MODE=llamacpp \
  LIFEOS_LLAMACPP_BASE_URL="http://127.0.0.1:${LLAMA_PORT}" \
  LIFEOS_LLAMACPP_MODEL="$MODEL_NAME" \
  npm run dev -- --port "$WEB_PORT"
) >"$WEB_LOG" 2>&1 &
WEB_PID=$!

for _ in $(seq 1 90); do
  if ! ps -p "$WEB_PID" >/dev/null 2>&1; then
    echo "[verify-llm] Web process exited early"
    tail -n 80 "$WEB_LOG" || true
    exit 1
  fi
  if curl -sf "http://127.0.0.1:${WEB_PORT}" >/dev/null; then
    break
  fi
  sleep 1
done

echo "[verify-llm] Running auth + action call..."
LOGIN_JSON=$(curl -s -X POST "http://127.0.0.1:${WEB_PORT}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@lifeos.dev","password":"demo1234"}')

TOKEN=$(printf '%s' "$LOGIN_JSON" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [[ -z "$TOKEN" ]]; then
  echo "[verify-llm] Failed to get token"
  echo "$LOGIN_JSON"
  exit 1
fi

curl -sf -X POST "http://127.0.0.1:${WEB_PORT}/api/lifeos/llm/mode" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"llamacpp"}' >/dev/null

RUN_JSON=$(curl -s -X POST "http://127.0.0.1:${WEB_PORT}/api/lifeos/actions/run" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"actionId":"job-sprint"}')

PROVIDER=$(printf '%s' "$RUN_JSON" | sed -n 's/.*"provider":"\([^"]*\)".*/\1/p')
MODEL=$(printf '%s' "$RUN_JSON" | sed -n 's/.*"model":"\([^"]*\)".*/\1/p')

if [[ "$PROVIDER" != "llamacpp" ]]; then
  echo "[verify-llm] Expected provider=llamacpp, got: ${PROVIDER:-<empty>}"
  echo "$RUN_JSON"
  exit 1
fi

echo "[verify-llm] PASS"
echo "  provider: $PROVIDER"
echo "  model: $MODEL"
echo "  llama log: $LLAMA_LOG"
echo "  web log: $WEB_LOG"
