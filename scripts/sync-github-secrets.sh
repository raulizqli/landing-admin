#!/usr/bin/env bash
# Sync Vite build secrets from landing-admin/.env.local to GitHub Actions.
# Does not print secret values.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/landing-admin/.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

get_env() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 || true)"
  if [[ -z "$line" ]]; then
    echo ""
    return
  fi
  printf '%s' "${line#*=}"
}

set_secret() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "skip $name (empty)"
    return
  fi
  printf '%s' "$value" | gh secret set "$name"
  echo "set  $name"
}

API_KEY="$(get_env VITE_FIREBASE_API_KEY)"
AUTH_DOMAIN="$(get_env VITE_FIREBASE_AUTH_DOMAIN)"
PROJECT_ID="$(get_env VITE_FIREBASE_PROJECT_ID)"
STORAGE_BUCKET="$(get_env VITE_FIREBASE_STORAGE_BUCKET)"
MESSAGING_SENDER_ID="$(get_env VITE_FIREBASE_MESSAGING_SENDER_ID)"
APP_ID="$(get_env VITE_FIREBASE_APP_ID)"
MEASUREMENT_ID="$(get_env VITE_FIREBASE_MEASUREMENT_ID)"
BOOTSTRAP_EMAIL="$(get_env VITE_BOOTSTRAP_ROOT_EMAIL)"
RECAPTCHA="$(get_env VITE_RECAPTCHA_SITE_KEY)"
if [[ -z "$RECAPTCHA" ]]; then
  RECAPTCHA="$(get_env RECAPCHA_WEB)"
fi
PAGINA_ID="$(get_env VITE_PAGINA_ID)"

set_secret VITE_FIREBASE_API_KEY "$API_KEY"
set_secret VITE_FIREBASE_AUTH_DOMAIN "$AUTH_DOMAIN"
set_secret VITE_FIREBASE_PROJECT_ID "$PROJECT_ID"
set_secret VITE_FIREBASE_STORAGE_BUCKET "$STORAGE_BUCKET"
set_secret VITE_FIREBASE_MESSAGING_SENDER_ID "$MESSAGING_SENDER_ID"
set_secret VITE_FIREBASE_APP_ID "$APP_ID"
set_secret VITE_FIREBASE_MEASUREMENT_ID "$MEASUREMENT_ID"
set_secret VITE_BOOTSTRAP_ROOT_EMAIL "$BOOTSTRAP_EMAIL"
set_secret VITE_RECAPTCHA_SITE_KEY "$RECAPTCHA"
set_secret VITE_PAGINA_ID "$PAGINA_ID"

echo "Done. Redeploy with: git commit --allow-empty -m 'chore: rebuild with secrets' && git push"
