#!/usr/bin/env bash
# Wrapper for cron — sources .env.local then runs the sync script.
# Usage: bash scripts/run-sync.sh [--output ./dataset] [--clean-only]
#
# Add to crontab (runs every hour):
#   0 * * * * bash /absolute/path/to/project/scripts/run-sync.sh --clean-only >> /var/log/kws-sync.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

ENV_FILE="$PROJECT_DIR/.env.local"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

cd "$PROJECT_DIR"
exec npx ts-node scripts/sync-dataset.ts "$@"
