#!/usr/bin/env bash
set -euo pipefail

FILE="/etc/nginx/sites-enabled/invoice.connectededucation.com"

if ! grep -q 'client_max_body_size 35m;' "$FILE"; then
  sed -i '/server_name invoice.connectededucation.com;/a\    client_max_body_size 35m;' "$FILE"
fi

nginx -t
systemctl reload nginx
grep -n 'client_max_body_size' "$FILE"
