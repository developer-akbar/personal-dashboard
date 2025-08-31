#!/usr/bin/env bash
set -euo pipefail

# Deploy backend to Google Cloud Run using Artifact Registry and existing Dockerfile
# Prereqs: gcloud CLI, a GCP project, billing enabled, MongoDB Atlas URI

# Config
: "${PROJECT_ID:?Set PROJECT_ID environment variable}"
REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-amazon-wallet-backend}"
REPO="${REPO:-backend-repo}"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:latest"

# Required env vars for the app (read from environment for safety)
: "${MONGODB_URI:?Set MONGODB_URI in your environment}"
MONGODB_DB_NAME="${MONGODB_DB_NAME:-amazon_wallet_monitor}"
: "${JWT_ACCESS_SECRET:?Set JWT_ACCESS_SECRET in your environment}"
: "${JWT_REFRESH_SECRET:?Set JWT_REFRESH_SECRET in your environment}"
: "${CREDENTIALS_ENCRYPTION_KEY:?Set CREDENTIALS_ENCRYPTION_KEY (>=32 chars) in your environment}"
: "${CORS_ORIGIN:?Set CORS_ORIGIN (frontend origin, comma-separated if multiple)}"

echo "Project:     ${PROJECT_ID}"
echo "Region:      ${REGION}"
echo "Service:     ${SERVICE}"
echo "Repository:  ${REPO}"
echo "Image URI:   ${IMAGE_URI}"

echo "==> Enabling required APIs"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project "${PROJECT_ID}"

echo "==> Creating Artifact Registry (if missing)"
if ! gcloud artifacts repositories describe "${REPO}" --location="${REGION}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Amazon wallet backend images" \
    --project "${PROJECT_ID}"
fi

echo "==> Configuring Docker auth for Artifact Registry"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" -q

echo "==> Building and pushing image"
gcloud builds submit backend --tag "${IMAGE_URI}" --project "${PROJECT_ID}"

echo "==> Deploying to Cloud Run"
gcloud run deploy "${SERVICE}" \
  --image="${IMAGE_URI}" \
  --platform=managed \
  --region="${REGION}" \
  --allow-unauthenticated \
  --memory=2Gi --cpu=1 --concurrency=2 \
  --min-instances=1 --max-instances=3 \
  --port=8080 \
  --set-env-vars=NODE_ENV=production \
  --set-env-vars="MONGODB_URI=${MONGODB_URI}" \
  --set-env-vars="MONGODB_DB_NAME=${MONGODB_DB_NAME}" \
  --set-env-vars="JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}" \
  --set-env-vars="JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}" \
  --set-env-vars="CREDENTIALS_ENCRYPTION_KEY=${CREDENTIALS_ENCRYPTION_KEY}" \
  --set-env-vars="CORS_ORIGIN=${CORS_ORIGIN}" \
  --project "${PROJECT_ID}"

URL=$(gcloud run services describe "${SERVICE}" --region "${REGION}" --format='value(status.url)')
echo "\nDeployed: ${URL}"
echo "Health:   ${URL}/api/health"

