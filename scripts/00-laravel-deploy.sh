#!/usr/bin/env bash

echo "Installing composer dependencies..."
composer install --no-dev --optimize-autoloader --working-dir=/var/www/html

echo "Installing node dependencies..."
npm install

echo "Building assets..."
npm run build


echo "Caching config..."
php artisan config:cache

echo "Caching routes..."
php artisan route:cache

echo "Running migrations..."
php artisan migrate --force
