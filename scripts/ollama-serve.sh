#!/usr/bin/env bash
# Start local Ollama with CORS so the Vite admin (browser) can call /api/chat.
set -euo pipefail

export OLLAMA_HOST="${OLLAMA_HOST:-127.0.0.1:11434}"
export OLLAMA_ORIGINS="${OLLAMA_ORIGINS:-http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama no está en PATH. Instálalo desde https://ollama.com" >&2
  exit 1
fi

if curl -sf --max-time 2 "http://${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  echo "Ollama ya responde en http://${OLLAMA_HOST}"
  ollama list || true
  exit 0
fi

echo "Iniciando ollama serve (OLLAMA_ORIGINS=${OLLAMA_ORIGINS})"
exec ollama serve
