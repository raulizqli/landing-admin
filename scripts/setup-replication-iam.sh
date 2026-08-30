#!/usr/bin/env bash
# One-time IAM setup for prod -> stage replication (Firestore + Storage).
#
# Run as a human with Owner (or equivalent) on BOTH Firebase/GCP projects.
# Creates the service account in Stage (if missing) and grants cross-project roles.
#
# After running, create a JSON key for the SA and store it in GitHub as GCP_REPLICATION_SA:
#   gcloud iam service-accounts keys create prod-to-stage-sync-key.json \
#     --iam-account="${REPLICATION_SA}" --project="${STAGE_PROJECT}"
#
# Usage:
#   scripts/setup-replication-iam.sh
#   PROD_PROJECT=landing-admin-9452e STAGE_PROJECT=landings-stage scripts/setup-replication-iam.sh
set -euo pipefail

PROD_PROJECT="${PROD_PROJECT:-landing-admin-9452e}"
STAGE_PROJECT="${STAGE_PROJECT:-landings-stage}"
PROD_BUCKET="${PROD_BUCKET:-${PROD_PROJECT}.firebasestorage.app}"
STAGE_BUCKET="${STAGE_BUCKET:-${STAGE_PROJECT}.firebasestorage.app}"
TRANSFER_BUCKET="${TRANSFER_BUCKET:-${STAGE_PROJECT}-data-sync}"
REPLICATION_SA="prod-to-stage-sync@${STAGE_PROJECT}.iam.gserviceaccount.com"
MEMBER="serviceAccount:${REPLICATION_SA}"

log() { printf '==> %s\n' "$*"; }

if [[ "${STAGE_PROJECT}" == "${PROD_PROJECT}" ]]; then
  echo "Refusing to run: STAGE_PROJECT equals PROD_PROJECT (${PROD_PROJECT})." >&2
  exit 1
fi

log "Ensuring service account ${REPLICATION_SA}"
if ! gcloud iam service-accounts describe "${REPLICATION_SA}" --project="${STAGE_PROJECT}" >/dev/null 2>&1; then
  gcloud iam service-accounts create prod-to-stage-sync \
    --project="${STAGE_PROJECT}" \
    --display-name="Prod to Stage replication (GitHub Actions)"
fi

log "Firestore export (prod project ${PROD_PROJECT})"
gcloud projects add-iam-policy-binding "${PROD_PROJECT}" \
  --member="${MEMBER}" \
  --role="roles/datastore.importExportAdmin" \
  --condition=None

log "Firestore import + transfer bucket (stage project ${STAGE_PROJECT})"
gcloud projects add-iam-policy-binding "${STAGE_PROJECT}" \
  --member="${MEMBER}" \
  --role="roles/datastore.importExportAdmin" \
  --condition=None

gcloud projects add-iam-policy-binding "${STAGE_PROJECT}" \
  --member="${MEMBER}" \
  --role="roles/storage.admin" \
  --condition=None

log "Prod Storage read (bucket gs://${PROD_BUCKET})"
gcloud storage buckets add-iam-policy-binding "gs://${PROD_BUCKET}" \
  --member="${MEMBER}" \
  --role="roles/storage.legacyBucketReader"

log "Stage Storage write (bucket gs://${STAGE_BUCKET})"
gcloud storage buckets add-iam-policy-binding "gs://${STAGE_BUCKET}" \
  --member="${MEMBER}" \
  --role="roles/storage.legacyBucketWriter"

log "Transfer bucket (gs://${TRANSFER_BUCKET}) — create if missing, then grant object admin"
if ! gcloud storage buckets describe "gs://${TRANSFER_BUCKET}" --project="${STAGE_PROJECT}" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://${TRANSFER_BUCKET}" \
    --project="${STAGE_PROJECT}" --location=us-central1 --uniform-bucket-level-access
fi
gcloud storage buckets add-iam-policy-binding "gs://${TRANSFER_BUCKET}" \
  --member="${MEMBER}" \
  --role="roles/storage.objectAdmin"

cat <<EOF

Done. Verify bucket access (uses your current gcloud credentials, not the SA):

  gcloud storage buckets describe gs://${PROD_BUCKET} --project=${PROD_PROJECT}
  gcloud storage buckets describe gs://${STAGE_BUCKET} --project=${STAGE_PROJECT}

Create a key for GitHub Actions (store the JSON as secret GCP_REPLICATION_SA):

  gcloud iam service-accounts keys create prod-to-stage-sync-key.json \\
    --iam-account=${REPLICATION_SA} --project=${STAGE_PROJECT}

EOF
