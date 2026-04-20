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

if ! command_exists yarn; then
    echo "Error: Yarn is not installed. This project requires Yarn workspaces."
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
echo "  ✓ Yarn found"
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
# Check if concurrently is missing even if node_modules exists
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/concurrently" ]; then
    yarn install
    echo "  ✓ Dependencies installed"
else
    echo "  ✓ Dependencies already present"
fi

# Seed database
echo "Seeding database..."
yarn workspace @mini-campaign-manager/backend seed
echo "  ✓ Database seeded"

echo ""
echo "=============================================="
echo "  Setup Complete! 🚀"
echo "=============================================="
echo ""
echo "To start the development servers, run:"
echo "  yarn run dev"
echo ""
echo "Demo Credentials:"
echo "  - Email:    demo@example.com"
echo "  - Password: password123"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo "=============================================="