#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=============================================="
echo "  Mini Campaign Manager - Infrastructure Setup"
echo "=============================================="

# Check prerequisites
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo ""
echo "[1/4] Checking prerequisites..."
if ! command_exists docker; then
    echo "Error: Docker is not installed."
    exit 1
fi

# Detect package manager
if command_exists yarn; then
    PKG_MGR="yarn"
elif command_exists npm; then
    PKG_MGR="npm"
else
    echo "Error: Neither Yarn nor NPM is installed."
    exit 1
fi

# Detect docker-compose command
if command_exists docker-compose; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "Error: Neither docker-compose nor 'docker compose' is available."
    exit 1
fi

echo "  ✓ Docker found"
echo "  ✓ $PKG_MGR found"
echo "  ✓ $DOCKER_COMPOSE found"

# Start Docker PostgreSQL
echo ""
echo "[2/4] Starting infrastructure with Docker..."
if ! docker ps | grep -q mini-campaign-manager-db 2>/dev/null; then
    $DOCKER_COMPOSE up -d
    echo "  ✓ PostgreSQL started"
else
    echo "  ✓ PostgreSQL already running"
fi

# Setup environment
echo ""
echo "[3/4] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  ✓ Created .env from .env.example"
else
    echo "  ✓ .env already exists"
fi

# Install dependencies and seed
echo ""
echo "[4/4] Installing dependencies and seeding..."
if [ ! -d "node_modules" ]; then
    $PKG_MGR install
    echo "  ✓ Dependencies installed"
else
    echo "  ✓ Dependencies already present"
fi

# Seed database
echo "Seeding database..."
if [ "$PKG_MGR" = "yarn" ]; then
    yarn workspace @mini-campaign-manager/backend seed
else
    npm run seed --workspace=@mini-campaign-manager/backend
fi
echo "  ✓ Database seeded"

echo ""
echo "=============================================="
echo "  Setup Complete! 🚀"
echo "=============================================="
echo ""
echo "To start the development servers, run:"
echo "  $PKG_MGR run dev"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo "=============================================="