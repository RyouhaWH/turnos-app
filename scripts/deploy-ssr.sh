#!/bin/bash

# Deploy SSR Script - Safe deployment without breaking main app
# Usage: ./scripts/deploy-ssr.sh

set -e

echo "🚀 Starting SSR deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SSR_BRANCH="feature/ssr-hybrid-optimization"
MAIN_BRANCH="main"
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on the right branch
if [ "$(git branch --show-current)" != "$SSR_BRANCH" ]; then
    print_error "You must be on the $SSR_BRANCH branch to deploy SSR"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

print_status "Creating backup of current state..."
git checkout -b "$BACKUP_BRANCH"
git checkout "$SSR_BRANCH"

print_status "Installing dependencies..."
composer install --no-dev --optimize-autoloader
npm ci

print_status "Building assets..."
npm run build

print_status "Building SSR..."
npm run build:ssr

print_status "Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

print_status "Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

print_status "Restarting services..."
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx

print_status "Starting SSR server..."
# Kill existing SSR process if running
pkill -f "node bootstrap/ssr/ssr.mjs" || true

# Start SSR server in background
nohup node bootstrap/ssr/ssr.mjs > /var/log/ssr.log 2>&1 &
SSR_PID=$!

# Wait a moment and check if SSR server started
sleep 3
if kill -0 $SSR_PID 2>/dev/null; then
    print_status "SSR server started successfully (PID: $SSR_PID)"
else
    print_error "Failed to start SSR server"
    exit 1
fi

print_status "Testing SSR endpoint..."
if curl -s http://localhost:13714 > /dev/null; then
    print_status "SSR server is responding correctly"
else
    print_warning "SSR server might not be responding. Check logs at /var/log/ssr.log"
fi

print_status "Creating systemd service for SSR..."
cat > /etc/systemd/system/turnos-ssr.service << EOF
[Unit]
Description=Turnos App SSR Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/turnos-app
ExecStart=/usr/bin/node bootstrap/ssr/ssr.mjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=INERTIA_SSR_PORT=13714

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable turnos-ssr.service

print_status "SSR deployment completed successfully!"
print_status "Backup branch created: $BACKUP_BRANCH"
print_status "SSR server running on port 13714"
print_status "Service created: turnos-ssr.service"
print_status "Logs available at: /var/log/ssr.log"

echo ""
print_status "To test SSR, visit: https://yourdomain.com/shifts/create-ssr"
print_status "To rollback: git checkout $BACKUP_BRANCH"
print_status "To stop SSR: sudo systemctl stop turnos-ssr.service"
