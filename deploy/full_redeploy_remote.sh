#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <archive-path>" >&2
  exit 1
fi

read -r SUDO_PASSWORD

ARCHIVE_PATH="$1"
LIVE_DIR="/home/aladin554/invoice_connectededucation_docker"
STAMP="$(date +%Y%m%d_%H%M%S)"
TEMP_DIR="/home/aladin554/invoice_connectededucation_sync_${STAMP}"

rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$TEMP_DIR"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude='.env' "$TEMP_DIR"/ "$LIVE_DIR"/
else
  find "$LIVE_DIR" -mindepth 1 -maxdepth 1 ! -name '.env' -exec rm -rf {} +
  cp -a "$TEMP_DIR"/. "$LIVE_DIR"/
fi

rm -rf "$TEMP_DIR"

cd "$LIVE_DIR"
printf '%s\n' "$SUDO_PASSWORD" | sudo -S docker compose up -d --build --remove-orphans
printf '%s\n' "$SUDO_PASSWORD" | sudo -S docker compose ps
curl -I --max-time 20 https://invoice.connectededucation.com
