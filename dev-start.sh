#!/bin/bash

# Fylaro Finance - Development Startup Script
# Quick start for development environment

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[DEV]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "🚀 Starting Fylaro Finance Development Environment"
echo "================================================="

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Create basic .env files if they don't exist
if [ ! -f ".env" ]; then
    print_status "Creating frontend .env file..."
    cat > .env << EOF
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_BLOCKCHAIN_NETWORK=localhost
VITE_ENVIRONMENT=development
EOF
fi

if [ ! -f "backend/.env" ]; then
    print_status "Creating backend .env file..."
    cp backend/.env.example backend/.env
    print_warning "Please update backend/.env with your configuration"
fi

# Function to start backend
start_backend() {
    print_status "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    echo $BACKEND_PID > .backend.pid
    print_success "Backend started on http://localhost:3001"
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend development server..."
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > .frontend.pid
    print_success "Frontend started on http://localhost:5173"
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down development servers..."
    
    if [ -f .backend.pid ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm .backend.pid
    fi
    
    if [ -f .frontend.pid ]; then
        kill $(cat .frontend.pid) 2>/dev/null || true
        rm .frontend.pid
    fi
    
    print_success "Development servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start services
start_backend
sleep 3
start_frontend

print_success "Development environment is ready!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 Health Check: http://localhost:3001/health"
echo "🔌 WebSocket: ws://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
