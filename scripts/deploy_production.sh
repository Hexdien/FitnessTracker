#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?Defina DEPLOY_HOST, ex: user@192.168.0.10}"
: "${DEPLOY_PATH:?Defina DEPLOY_PATH, ex: /opt/fitness-tracker}"

BRANCH="${DEPLOY_BRANCH:-main}"
COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-compose.prod.yml}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-http://127.0.0.1:${APP_HOST_PORT:-8000}/health}"

ssh "$DEPLOY_HOST" bash -s -- "$DEPLOY_PATH" "$BRANCH" "$COMPOSE_FILE" "$HEALTH_URL" <<'REMOTE'
set -euo pipefail

DEPLOY_PATH="$1"
BRANCH="$2"
COMPOSE_FILE="$3"
HEALTH_URL="$4"

cd "$DEPLOY_PATH"

echo "Fetching latest code..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "Building image before replacing the running container..."
docker compose -f "$COMPOSE_FILE" build app

echo "Applying migrations in a one-off container..."
docker compose -f "$COMPOSE_FILE" run --rm --no-deps \
  -e RUN_MIGRATIONS=1 \
  -e RUN_FOOD_SEED="${RUN_FOOD_SEED:-0}" \
  app true

echo "Starting updated service..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps app

echo "Checking health..."
for attempt in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "Deploy finished and service is healthy."
    exit 0
  fi
  echo "Waiting for healthcheck ($attempt/30)..."
  sleep 2
done

echo "Deploy finished, but healthcheck failed: $HEALTH_URL" >&2
docker compose -f "$COMPOSE_FILE" ps app >&2
docker compose -f "$COMPOSE_FILE" logs --tail=80 app >&2
exit 1
REMOTE
