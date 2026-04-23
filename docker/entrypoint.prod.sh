#!/usr/bin/env sh
set -eu

cd /var/www/html

# Enforce upload limits at container startup so production never falls back
# to the PHP defaults.
PHP_INI_DIR_PATH="${PHP_INI_DIR:-/usr/local/etc/php}"
PHP_UPLOAD_LIMITS_FILE="${PHP_INI_DIR_PATH}/conf.d/zz-uploads.ini"
mkdir -p "$(dirname "$PHP_UPLOAD_LIMITS_FILE")"
printf '%s\n' \
  'upload_max_filesize = 10M' \
  'post_max_size = 12M' \
  'max_file_uploads = 10' \
  > "$PHP_UPLOAD_LIMITS_FILE"

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true

# Drop stale cache artifacts that can reference dev-only providers.
rm -f \
  bootstrap/cache/packages.php \
  bootstrap/cache/services.php \
  bootstrap/cache/config.php \
  bootstrap/cache/routes-*.php \
  bootstrap/cache/events.php

if [ "${WAIT_FOR_DB:-true}" = "true" ]; then
  max_attempts="${DB_WAIT_ATTEMPTS:-60}"
  sleep_seconds="${DB_WAIT_SLEEP_SECONDS:-2}"
  attempt=1

  while [ "$attempt" -le "$max_attempts" ]; do
    if php -r "new PDO('mysql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));"; then
      break
    fi

    echo "Waiting for MySQL (${attempt}/${max_attempts})..."
    attempt=$((attempt + 1))
    sleep "$sleep_seconds"
  done

  if [ "$attempt" -gt "$max_attempts" ]; then
    echo "MySQL is not reachable after ${max_attempts} attempts."
    exit 1
  fi
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force --no-interaction
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  php artisan db:seed --force --no-interaction
fi

if [ ! -L public/storage ]; then
  rm -rf public/storage
  php artisan storage:link || true
fi

php artisan package:discover --ansi
php artisan config:cache
php artisan view:cache

exec "$@"
