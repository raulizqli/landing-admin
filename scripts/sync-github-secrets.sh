#!/usr/bin/env bash
# Sync Vite build secrets from landing-admin/.env.local (+ template prod ads) to GitHub Actions.
# Does not print secret values.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/landing-admin/.env.local}"
TEMPLATE_PROD_ENV="${TEMPLATE_PROD_ENV:-$ROOT_DIR/landing-template/.env.production}"
ADMIN_PROD_ENV="${ADMIN_PROD_ENV:-$ROOT_DIR/landing-admin/.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

get_env_from() {
  local file="$1"
  local key="$2"
  local line
  if [[ ! -f "$file" ]]; then
    echo ""
    return
  fi
  line="$(grep -E "^${key}=" "$file" | tail -n1 || true)"
  if [[ -z "$line" ]]; then
    echo ""
    return
  fi
  printf '%s' "${line#*=}"
}

get_env() {
  get_env_from "$ENV_FILE" "$1"
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
  RECAPTCHA="$(get_env_from "$ADMIN_PROD_ENV" VITE_RECAPTCHA_SITE_KEY)"
fi
if [[ -z "$RECAPTCHA" ]]; then
  RECAPTCHA="$(get_env RECAPCHA_WEB)"
fi
RECAPTCHA_ENTERPRISE="$(get_env VITE_RECAPTCHA_ENTERPRISE)"
if [[ -z "$RECAPTCHA_ENTERPRISE" ]]; then
  RECAPTCHA_ENTERPRISE="$(get_env_from "$ADMIN_PROD_ENV" VITE_RECAPTCHA_ENTERPRISE)"
fi
PAGINA_ID="$(get_env VITE_PAGINA_ID)"

# Template Prod: AdSense + admin public URL (from landing-template/.env.production)
ADS_CLIENT="$(get_env_from "$TEMPLATE_PROD_ENV" VITE_GOOGLE_ADS_CLIENT)"
ADS_SLOT="$(get_env_from "$TEMPLATE_PROD_ENV" VITE_GOOGLE_ADS_SLOT)"
# Admin CMS AdSense slot (free-tier bar + save/publish gate) — distinct from landings
ADMIN_ADS_CLIENT="$(get_env_from "$ADMIN_PROD_ENV" VITE_GOOGLE_ADS_CLIENT)"
ADMIN_ADS_SLOT="$(get_env_from "$ADMIN_PROD_ENV" VITE_GOOGLE_ADS_SLOT)"
FACEBOOK_APP_ID="$(get_env_from "$ADMIN_PROD_ENV" VITE_FACEBOOK_APP_ID)"
if [[ -z "$FACEBOOK_APP_ID" ]]; then
  FACEBOOK_APP_ID="$(get_env VITE_FACEBOOK_APP_ID)"
fi
if [[ -z "$ADS_CLIENT" && -n "$ADMIN_ADS_CLIENT" ]]; then
  ADS_CLIENT="$ADMIN_ADS_CLIENT"
fi
ADMIN_PUBLIC_URL="$(get_env_from "$TEMPLATE_PROD_ENV" VITE_ADMIN_PUBLIC_URL)"
ADMIN_ORIGIN="$(get_env_from "$TEMPLATE_PROD_ENV" VITE_ADMIN_ORIGIN)"
if [[ -z "$ADMIN_ORIGIN" ]]; then
  ADMIN_ORIGIN="$ADMIN_PUBLIC_URL"
fi

set_secret VITE_FIREBASE_API_KEY "$API_KEY"
set_secret VITE_FIREBASE_AUTH_DOMAIN "$AUTH_DOMAIN"
set_secret VITE_FIREBASE_PROJECT_ID "$PROJECT_ID"
set_secret VITE_FIREBASE_STORAGE_BUCKET "$STORAGE_BUCKET"
set_secret VITE_FIREBASE_MESSAGING_SENDER_ID "$MESSAGING_SENDER_ID"
set_secret VITE_FIREBASE_APP_ID "$APP_ID"
set_secret VITE_FIREBASE_MEASUREMENT_ID "$MEASUREMENT_ID"
set_secret VITE_BOOTSTRAP_ROOT_EMAIL "$BOOTSTRAP_EMAIL"
set_secret VITE_RECAPTCHA_SITE_KEY "$RECAPTCHA"
if [[ -n "$RECAPTCHA_ENTERPRISE" ]]; then
  printf '%s' "$RECAPTCHA_ENTERPRISE" | gh variable set VITE_RECAPTCHA_ENTERPRISE
  echo "set  var VITE_RECAPTCHA_ENTERPRISE"
fi
set_secret VITE_PAGINA_ID "$PAGINA_ID"
set_secret VITE_GOOGLE_ADS_CLIENT "$ADS_CLIENT"
set_secret VITE_GOOGLE_ADS_SLOT "$ADS_SLOT"
set_secret VITE_GOOGLE_ADS_SLOT_ADMIN "$ADMIN_ADS_SLOT"
set_secret VITE_FACEBOOK_APP_ID "$FACEBOOK_APP_ID"
set_secret VITE_ADMIN_PUBLIC_URL "$ADMIN_PUBLIC_URL"
set_secret VITE_ADMIN_ORIGIN "$ADMIN_ORIGIN"

# Prod Environment secrets used by Promote to Prod env guardrails (and ops).
FUNCTIONS_PROD_ENV="${FUNCTIONS_PROD_ENV:-$ROOT_DIR/functions/.env.production}"
set_secret_env() {
  local name="$1"
  local value="$2"
  local env_name="$3"
  if [[ -z "$value" ]]; then
    echo "skip $env_name/$name (empty)"
    return
  fi
  printf '%s' "$value" | gh secret set "$name" --env "$env_name"
  echo "set  $env_name/$name"
}

for key in \
  STRIPE_SECRET_KEY \
  STRIPE_PRICE_STARTER \
  STRIPE_PRICE_STARTER_USD \
  STRIPE_PRICE_STARTER_MXN \
  STRIPE_PRICE_PRO \
  STRIPE_PRICE_PRO_USD \
  STRIPE_PRICE_PRO_MXN \
  STRIPE_PRICE_AGENCY \
  STRIPE_PRICE_AGENCY_USD \
  STRIPE_PRICE_AGENCY_MXN \
  MERCADOPAGO_ACCESS_TOKEN
do
  set_secret_env "$key" "$(get_env_from "$FUNCTIONS_PROD_ENV" "$key")" prod
done

echo "Done. Redeploy with: git commit --allow-empty -m 'chore: rebuild with secrets' && git push"
