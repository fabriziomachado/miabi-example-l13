# Production image following serversideup/php packaging guidance:
# https://serversideup.net/open-source/docker-php/docs/deployment-and-production/packaging-your-app-for-deployment
#
# Runtime behaviour (SSL, health path, AUTORUN, APP_*) is applied when the
# container starts, not baked into this image.

FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM serversideup/php:8.4-frankenphp

USER root
RUN install-php-extensions intl
USER www-data

WORKDIR /var/www/html

COPY --chown=www-data:www-data composer.json composer.lock ./
RUN composer install \
      --no-dev \
      --no-interaction \
      --no-scripts \
      --prefer-dist \
      --optimize-autoloader

COPY --chown=www-data:www-data . .
RUN composer dump-autoload --optimize --no-dev \
 && mkdir -p \
      storage/app/public \
      storage/framework/cache/data \
      storage/framework/sessions \
      storage/framework/views \
      storage/logs \
      bootstrap/cache \
 && php artisan package:discover --ansi

COPY --from=assets --chown=www-data:www-data /app/public/build ./public/build
