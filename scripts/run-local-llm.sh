#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODEL_PATH="${MODEL_PATH:-$ROOT_DIR/.models/qwen2.5-0.5b-instruct-q4_k_m.gguf}"
LLAMA_PORT="${LLAMA_PORT:-8081}"
HOST="${HOST:-127.0.0.1}"
THREADS="${THREADS:-6}"
CTX_SIZE="${CTX_SIZE:-2048}"

if [[ ! -f "$MODEL_PATH" ]]; then
  echo "[run-local-llm] Missing model file:"
  echo "  $MODEL_PATH"
  echo "[run-local-llm] Download first or set MODEL_PATH=/absolute/path/to/model.gguf"
  exit 1
fi

echo "[run-local-llm] Starting llama-server"
echo "  model: $MODEL_PATH"
echo "  host:  $HOST"
echo "  port:  $LLAMA_PORT"

exec llama-server \
  -m "$MODEL_PATH" \
  --host "$HOST" \
  --port "$LLAMA_PORT" \
  --threads "$THREADS" \
  --ctx-size "$CTX_SIZE"
