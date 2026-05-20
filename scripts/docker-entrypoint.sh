#!/usr/bin/env sh
set -eu

if [ "${WAIT_FOR_DB:-1}" = "1" ]; then
  python scripts/wait_for_db.py
fi

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  alembic upgrade head
fi

if [ "${RUN_FOOD_SEED:-0}" = "1" ]; then
  python scripts/seed_foods.py
fi

exec "$@"
