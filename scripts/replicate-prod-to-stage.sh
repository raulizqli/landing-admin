#!/usr/bin/env bash
# Replicate production data into the Stage Firebase project.
#
# Copies:
#   - Firestore  (prod (default) database  ->  stage (default) database)
#   - Storage    (prod default bucket      ->  stage default bucket, mirrored)
#   - Auth       (optional, MODE=full only: prod users -> stage users)
#
# Firestore export/import runs through a transfer bucket in the Stage project.
# Old exports are pruned to keep storage costs near zero.
#
# Usage:
#   scripts/replicate-prod-to-stage.sh                 # content (Firestore + Storage)
#   MODE=full scripts/replicate-prod-to-stage.sh       # also copies Auth users/passwords
#
# Required env (with sensible defaults for this repo):
#   PROD_PROJECT      default: landing-admin-9452e
#   STAGE_PROJECT     default: landings-stage
#   PROD_BUCKET       default: <PROD_PROJECT>.firebasestorage.app
#   STAGE_BUCKET      default: <STAGE_PROJECT>.firebasestorage.app
#   TRANSFER_BUCKET   default: gs://<STAGE_PROJECT>-data-sync
#   EXPORT_RETENTION  default: 3   (how many recent Firestore exports to keep)
#
# Auth requires gcloud (ADC) authenticated with access to both projects.
set -euo pipefail

MODE="${MODE:-content}"
PROD_PROJECT="${PROD_PROJECT:-landing-admin-9452e}"
STAGE_PROJECT="${STAGE_PROJECT:-landings-stage}"
PROD_BUCKET="${PROD_BUCKET:-${PROD_PROJECT}.firebasestorage.app}"
STAGE_BUCKET="${STAGE_BUCKET:-${STAGE_PROJECT}.firebasestorage.app}"
TRANSFER_BUCKET="${TRANSFER_BUCKET:-gs://${STAGE_PROJECT}-data-sync}"
EXPORT_RETENTION="${EXPORT_RETENTION:-3}"

log() { printf '\n==> %s\n' "$*"; }

if [[ "${STAGE_PROJECT}" == "${PROD_PROJECT}" ]]; then
  echo "Refusing to run: STAGE_PROJECT equals PROD_PROJECT (${PROD_PROJECT})." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1) Firestore: export from prod, import into stage (via transfer bucket)
# ---------------------------------------------------------------------------
TS="$(date -u +%Y%m%d-%H%M%S)"
EXPORT_PATH="${TRANSFER_BUCKET}/firestore-prod-${TS}"

log "Ensuring transfer bucket ${TRANSFER_BUCKET}"
if ! gcloud storage buckets describe "${TRANSFER_BUCKET}" --project "${STAGE_PROJECT}" >/dev/null 2>&1; then
  gcloud storage buckets create "${TRANSFER_BUCKET}" \
    --project="${STAGE_PROJECT}" --location=us-central1 --uniform-bucket-level-access
fi

log "Exporting Firestore from ${PROD_PROJECT}"
gcloud firestore export "${EXPORT_PATH}" --project="${PROD_PROJECT}"

log "Importing Firestore into ${STAGE_PROJECT}"
gcloud firestore import "${EXPORT_PATH}" --project="${STAGE_PROJECT}"

log "Pruning old Firestore exports (keep ${EXPORT_RETENTION})"
mapfile -t OLD_EXPORTS < <(
  gcloud storage ls "${TRANSFER_BUCKET}/" 2>/dev/null \
    | grep -E '/firestore-prod-[0-9]{8}-[0-9]{6}/$' \
    | sort \
    | head -n -"${EXPORT_RETENTION}" || true
)
for path in "${OLD_EXPORTS[@]:-}"; do
  [[ -z "${path}" ]] && continue
  echo "  deleting ${path}"
  gcloud storage rm -r "${path}" >/dev/null 2>&1 || true
done

# ---------------------------------------------------------------------------
# 2) Storage: mirror prod default bucket into stage
# ---------------------------------------------------------------------------
log "Mirroring Storage gs://${PROD_BUCKET} -> gs://${STAGE_BUCKET}"
gcloud storage rsync -r --delete-unmatched-destination-objects \
  "gs://${PROD_BUCKET}" "gs://${STAGE_BUCKET}"

# ---------------------------------------------------------------------------
# 3) Auth (MODE=full only): copy users + passwords prod -> stage
# ---------------------------------------------------------------------------
if [[ "${MODE}" == "full" ]]; then
  log "Copying Auth users (MODE=full)"
  WORK="$(mktemp -d)"
  trap 'rm -rf "${WORK}"' EXIT

  npx --yes firebase auth:export "${WORK}/users.json" --format=json --project "${PROD_PROJECT}"

  # Prod password hash parameters (SCRYPT) are required to import password users.
  ACCESS_TOKEN="$(gcloud auth print-access-token)"
  curl -sS -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "X-Goog-User-Project: ${PROD_PROJECT}" \
    "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROD_PROJECT}/config" \
    > "${WORK}/auth-config.json"

  eval "$(node -e '
    const c = require(process.argv[1]);
    const h = (c.signIn && c.signIn.hashConfig) || {};
    const q = (v) => `"${String(v || "").replace(/"/g, "\\\"")}"`;
    process.stdout.write(
      `HASH_ALGO=${q(h.algorithm)}\n` +
      `HASH_KEY=${q(h.signerKey)}\n` +
      `SALT_SEPARATOR=${q(h.saltSeparator)}\n` +
      `ROUNDS=${q(h.rounds)}\n` +
      `MEM_COST=${q(h.memoryCost)}\n`
    );
  ' "${WORK}/auth-config.json")"

  npx --yes firebase auth:import "${WORK}/users.json" \
    --project "${STAGE_PROJECT}" \
    --hash-algo="${HASH_ALGO}" \
    --hash-key="${HASH_KEY}" \
    --salt-separator="${SALT_SEPARATOR}" \
    --rounds="${ROUNDS}" \
    --mem-cost="${MEM_COST}"
else
  log "Skipping Auth (MODE=content). Set MODE=full to copy users/passwords."
fi

log "Replication complete (${MODE}): ${PROD_PROJECT} -> ${STAGE_PROJECT}"
