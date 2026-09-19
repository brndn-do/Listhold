#!/usr/bin/env bash
# Build with Cloud Build, push to Artifact Registry, deploy to Cloud Run.
set -euo pipefail

PROJECT="${PROJECT:?set PROJECT=your-gcp-project}"
REGION="${REGION:-us-central1}"
REPO="${REPO:-spikes}"
SERVICE="${SERVICE:-coldstart-probe}"
VARIANT="${VARIANT:-jit}"           # jit | chiseled | r2r
CPU="${CPU:-1}"
MEMORY="${MEMORY:-512Mi}"
BOOST="${BOOST:-yes}"               # Cloud Run startup CPU boost

IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/${SERVICE}:${VARIANT}"

gcloud artifacts repositories describe "$REPO" --location "$REGION" --project "$PROJECT" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$REPO" --repository-format=docker \
    --location "$REGION" --project "$PROJECT"

case "$VARIANT" in
  chiseled) BUILD_ARGS=(--build-arg RUNTIME_IMAGE=mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled) ;;
  r2r)      BUILD_ARGS=(--build-arg RUNTIME_IMAGE=mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled
                        --build-arg PUBLISH_ARGS="-r linux-x64 --self-contained false -p:PublishReadyToRun=true") ;;
  *)        BUILD_ARGS=() ;;
esac

# Build locally then push (Cloud Build also works: gcloud builds submit --tag "$IMAGE")
docker build "${BUILD_ARGS[@]}" -t "$IMAGE" .
docker push "$IMAGE"

BOOST_FLAG="--no-cpu-boost"
[ "$BOOST" = "yes" ] && BOOST_FLAG="--cpu-boost"

gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" --project "$PROJECT" \
  --allow-unauthenticated \
  --min-instances=0 --max-instances=1 \
  --cpu="$CPU" --memory="$MEMORY" \
  $BOOST_FLAG \
  --set-env-vars "DB_MODE=npgsql,WARM_EF=${WARM_EF:-0}"

gcloud run services describe "$SERVICE" --region "$REGION" --project "$PROJECT" \
  --format='value(status.url)'
