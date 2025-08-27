#!/bin/bash

# Development script for SSR testing
# Usage: ./scripts/dev-ssr.sh

set -e

echo "🚀 Starting local SSR development..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "feature/ssr-hybrid-optimization" ]; then
    print_warning "You're not on the SSR branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_status "Installing dependencies..."
npm install

print_status "Building SSR..."
npm run build:ssr

print_status "Starting Laravel development server..."
php artisan serve --host=0.0.0.0 --port=8000 &
LARAVEL_PID=$!

print_status "Starting SSR server..."
node bootstrap/ssr/ssr.mjs &
SSR_PID=$!

print_status "Starting Vite development server..."
npm run dev &
VITE_PID=$!

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down servers..."
    kill $LARAVEL_PID 2>/dev/null || true
    kill $SSR_PID 2>/dev/null || true
    kill $VITE_PID 2>/dev/null || true
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT

print_status "Development servers started!"
echo ""
print_status "🌐 URLs:"
print_status "  Laravel: http://localhost:8000"
print_status "  SSR Server: http://localhost:13714"
print_status "  Vite Dev: http://localhost:5173"
echo ""
print_status "📱 Test URLs:"
print_status "  Original: http://localhost:8000/shifts/create"
print_status "  SSR Version: http://localhost:8000/shifts/create-ssr"
echo ""
print_status "Press Ctrl+C to stop all servers"

# Wait for all background processes
wait
