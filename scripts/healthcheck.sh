#!/usr/bin/env bash
set -euo pipefail

HEALTH_URL="${1:-http://127.0.0.1:8000/health}"

curl -fsS "$HEALTH_URL"
printf '\n'
