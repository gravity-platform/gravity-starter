#!/bin/bash

# =============================================================================
# Gravity Platform - Deployment Script
# =============================================================================
# Usage:
#   ./scripts/deploy.sh          # Full deploy (pull, build, start)
#   ./scripts/deploy.sh update   # Update only (pull images, restart)
#   ./scripts/deploy.sh rebuild  # Rebuild SAB and restart
# =============================================================================

set -e

echo "🚀 Gravity Platform Deployment"
echo ""

# Check .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Copy .env.example to .env and configure it first:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

# Check REDIS_HOST is set correctly for Docker
REDIS_HOST=$(grep "^REDIS_HOST=" .env | cut -d'=' -f2)
if [ "$REDIS_HOST" = "localhost" ] || [ "$REDIS_HOST" = "127.0.0.1" ]; then
    echo "⚠️  Warning: REDIS_HOST is set to '$REDIS_HOST'"
    echo "   For Docker deployment, it should be 'redis' (container name)"
    echo ""
    read -p "   Fix automatically? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i 's/REDIS_HOST=localhost/REDIS_HOST=redis/' .env
        sed -i 's/REDIS_HOST=127.0.0.1/REDIS_HOST=redis/' .env
        echo "   ✅ Fixed REDIS_HOST=redis"
    fi
fi

ACTION=${1:-full}

case $ACTION in
    full)
        echo "📦 Full deployment..."
        echo ""
        
        # Pull latest GHCR images
        echo "1/4 Pulling platform images..."
        docker compose pull
        
        # Build packages (inside Docker - no Node.js needed on host)
        echo ""
        echo "2/4 Building packages..."
        docker compose run --rm builder
        
        # Build SAB
        echo ""
        echo "3/4 Building SAB..."
        docker compose build sab
        
        # Start services
        echo ""
        echo "4/4 Starting services..."
        docker compose up -d
        ;;
        
    update)
        echo "📦 Updating platform images..."
        docker compose pull
        docker compose up -d
        ;;
        
    rebuild)
        echo "📦 Rebuilding SAB..."
        docker compose build sab
        docker compose up -d sab
        ;;
        
    clean)
        echo "🧹 Cleaning and rebuilding from scratch..."
        echo ""
        find . -name 'node_modules' -type d -prune -exec rm -rf {} + 2>/dev/null || true
        find . -name '.turbo' -type d -prune -exec rm -rf {} + 2>/dev/null || true
        find . -name 'dist' -type d -prune -exec rm -rf {} + 2>/dev/null || true
        rm -f package-lock.json
        echo "✅ Cleaned. Now run: ./scripts/deploy.sh"
        ;;
        
    *)
        echo "Usage: ./scripts/deploy.sh [full|update|rebuild|clean]"
        echo ""
        echo "  full    - Full deploy (pull, build packages, build SAB, start)"
        echo "  update  - Pull latest images and restart"
        echo "  rebuild - Rebuild SAB only and restart"
        echo "  clean   - Remove node_modules, .turbo, dist (run before full if issues)"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services:"
docker compose ps --format "table {{.Name}}\t{{.Status}}"
echo ""

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || hostname -I | awk '{print $1}')

echo "Access:"
echo "  Canvas: http://${PUBLIC_IP}:3001"
echo "  SAB:    http://${PUBLIC_IP}:3007"
echo "  API:    http://${PUBLIC_IP}:4100"
