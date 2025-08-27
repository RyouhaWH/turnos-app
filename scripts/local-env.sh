#!/bin/bash

# Local environment setup for SSR testing
# Usage: ./scripts/local-env.sh

echo "🔧 Setting up local environment for SSR..."

# Add SSR variables to .env if they don't exist
if ! grep -q "SSR_ENABLED" .env; then
    echo "" >> .env
    echo "# SSR Configuration" >> .env
    echo "SSR_ENABLED=true" >> .env
    echo "SSR_PORT=13714" >> .env
    echo "INERTIA_SSR_PORT=13714" >> .env
    echo "Added SSR configuration to .env"
else
    echo "SSR configuration already exists in .env"
fi

# Create bootstrap/ssr directory if it doesn't exist
if [ ! -d "bootstrap/ssr" ]; then
    mkdir -p bootstrap/ssr
    echo "Created bootstrap/ssr directory"
fi

# Make scripts executable
chmod +x scripts/dev-ssr.sh
chmod +x scripts/deploy-ssr.sh

echo "✅ Local environment setup completed!"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/dev-ssr.sh (Linux/Mac)"
echo "2. Run: .\scripts\dev-ssr.ps1 (Windows)"
echo "3. Visit: http://localhost:8000/shifts/create-ssr"
