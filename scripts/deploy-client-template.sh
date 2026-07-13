#!/usr/bin/env bash
# Despliega landing-template para un cliente en un sitio de Firebase Hosting.
#
# Uso:
#   ./scripts/deploy-client-template.sh maria-garcia landing-maria-garcia
#
# Requisitos:
#   - firebase-tools (npm install en la raíz del repo)
#   - Sitio creado en Firebase Console → Hosting → Agregar otro sitio
#   - .firebaserc con el project ID correcto

set -euo pipefail

PAGE_ID="${1:?Falta VITE_PAGINA_ID (ej. maria-garcia)}"
SITE_ID="${2:?Falta site ID de Firebase Hosting (ej. landing-maria-garcia)}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE_DIR="$ROOT_DIR/landing-template"
ENV_FILE="$TEMPLATE_DIR/.env.production"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Crea $ENV_FILE (copia desde .env.production.example) con VITE_FIREBASE_*."
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.firebaserc" ]]; then
  echo "Copia .firebaserc.example → .firebaserc y configura TU_PROJECT_ID."
  exit 1
fi

export VITE_PAGINA_ID="$PAGE_ID"

echo "→ Build template (VITE_PAGINA_ID=$PAGE_ID)"
npm run build --prefix "$TEMPLATE_DIR"

echo "→ Asociar target template → $SITE_ID"
cd "$TEMPLATE_DIR"
if [[ ! -f ".firebaserc" && -f "$ROOT_DIR/.firebaserc" ]]; then
  cp "$ROOT_DIR/.firebaserc" .firebaserc
fi
firebase target:apply hosting template "$SITE_ID"

echo "→ Deploy"
firebase deploy --only hosting:template

echo "✓ Listo. Dominio: Firebase Console → Hosting → $SITE_ID → Dominios personalizados"
