#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yml}"
RUN_FOOD_SEED="${RUN_FOOD_SEED:-1}"

docker compose -f "$COMPOSE_FILE" run --rm --no-deps \
  -e RUN_MIGRATIONS=1 \
  -e RUN_FOOD_SEED="$RUN_FOOD_SEED" \
  app true
