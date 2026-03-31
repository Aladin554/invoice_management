#!/usr/bin/env sh
set -eu

cd /var/www/html

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true

# Drop stale cache artifacts copied from the host so the container can boot
# against its own installed dependencies and environment.
rm -f \
  bootstrap/cache/packages.php \
  bootstrap/cache/services.php \
  bootstrap/cache/config.php \
  bootstrap/cache/routes-*.php \
  bootstrap/cache/events.php

php artisan package:discover --ansi

if [ ! -e public/storage ]; then
  php artisan storage:link || true
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force --no-interaction
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  php artisan db:seed --force --no-interaction
fi

exec "$@"
