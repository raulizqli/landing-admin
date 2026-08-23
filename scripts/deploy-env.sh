#!/usr/bin/env bash
# Deploy rules, functions, and hosting to a named Firebase alias (dev|stage|prod).
set -euo pipefail

ENV_NAME="${1:-}"
if [[ "$ENV_NAME" != "dev" && "$ENV_NAME" != "stage" && "$ENV_NAME" != "prod" ]]; then
  echo "Usage: $0 <dev|stage|prod>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .firebaserc ]]; then
  echo "Missing .firebaserc — copy .firebaserc.example and set your project IDs." >&2
  exit 1
fi

echo "==> firebase use ${ENV_NAME}"
npx firebase use "$ENV_NAME"

BUILD_MODE="production"
if [[ "$ENV_NAME" == "stage" || "$ENV_NAME" == "dev" ]]; then
  BUILD_MODE="staging"
fi

echo "==> check-env (${BUILD_MODE} / ${ENV_NAME})"
node scripts/check-env.mjs --mode "$BUILD_MODE" --env "$ENV_NAME"

if [[ "$BUILD_MODE" == "staging" ]]; then
  echo "==> build admin + template (mode=staging)"
  npm run build:admin:staging
  npm run build:template:staging
else
  echo "==> build admin + template (production)"
  npm run build:admin
  npm run build:template
fi

# Firebase Functions loads `.env`, `.env.<projectId>`, `.env.<alias>`.
# Hide local dev `functions/.env` on promote deploys so test keys do not override prod/stage files.
FUNCTIONS_ENV_BACKUP=""
if [[ "$ENV_NAME" == "stage" ]]; then
  if [[ -f functions/.env.staging ]]; then
    cp functions/.env.staging functions/.env.landings-stage
    rm -f functions/.env.stage
  fi
  if [[ -f functions/.env ]]; then
    FUNCTIONS_ENV_BACKUP="$(mktemp)"
    mv functions/.env "$FUNCTIONS_ENV_BACKUP"
    echo "==> staged functions env (hid functions/.env for Stage deploy)"
  fi
elif [[ "$ENV_NAME" == "prod" ]]; then
  if [[ -f functions/.env.production ]]; then
    cp functions/.env.production functions/.env.landing-admin-9452e
    rm -f functions/.env.prod
    echo "==> synced functions/.env.production → .env.landing-admin-9452e"
  fi
  if [[ -f functions/.env ]]; then
    FUNCTIONS_ENV_BACKUP="$(mktemp)"
    mv functions/.env "$FUNCTIONS_ENV_BACKUP"
    echo "==> prod functions env (hid functions/.env for Prod deploy)"
  fi
fi
restore_functions_env() {
  if [[ -n "${FUNCTIONS_ENV_BACKUP}" && -f "${FUNCTIONS_ENV_BACKUP}" ]]; then
    mv "${FUNCTIONS_ENV_BACKUP}" functions/.env
    echo "==> restored functions/.env"
  fi
}
trap restore_functions_env EXIT

echo "==> deploy firestore rules/indexes + storage"
npx firebase deploy --only firestore:rules,firestore:indexes,storage

echo "==> deploy functions"
(cd functions && npm install --no-fund --no-audit)
npx firebase deploy --only functions --force

echo "==> deploy hosting (admin + template)"
npx firebase deploy --only hosting:admin
npx firebase deploy --only hosting:template --config landing-template/firebase.json

echo "==> done (${ENV_NAME})"
