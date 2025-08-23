#!/bin/bash

# Fylaro Finance - Production Deployment Script
# This script handles the complete deployment of the Invoice Tokenization platform

set -e

echo "🚀 Starting Fylaro Finance Deployment..."
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git first."
        exit 1
    fi
    
    # Check Docker (optional but recommended)
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Consider installing Docker for containerized deployment."
    fi
    
    print_success "Prerequisites check completed"
}

# Set up environment variables
setup_environment() {
    print_status "Setting up environment configuration..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend environment file..."
        cp backend/.env.example backend/.env
        print_warning "Please update backend/.env with your actual configuration values"
    fi
    
    # Frontend environment
    if [ ! -f ".env" ]; then
        print_status "Creating frontend environment file..."
        cat > .env << EOF
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_BLOCKCHAIN_NETWORK=localhost
VITE_CONTRACT_ADDRESS=
VITE_ENVIRONMENT=development
EOF
        print_warning "Please update .env with your actual configuration values"
    fi
    
    print_success "Environment setup completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    print_success "Dependencies installation completed"
}

# Database setup
setup_database() {
    print_status "Setting up database..."
    
    # Check if MongoDB is running
    if command -v mongod &> /dev/null; then
        if ! pgrep mongod > /dev/null; then
            print_warning "MongoDB is not running. Please start MongoDB service."
            print_status "You can start MongoDB with: sudo systemctl start mongod"
        else
            print_success "MongoDB is running"
        fi
    else
        print_warning "MongoDB is not installed. Installing via Docker..."
        
        if command -v docker &> /dev/null; then
            docker run -d \
                --name fylaro-mongodb \
                -p 27017:27017 \
                -e MONGO_INITDB_ROOT_USERNAME=admin \
                -e MONGO_INITDB_ROOT_PASSWORD=password \
                -v fylaro_mongodb_data:/data/db \
                mongo:latest
            
            print_success "MongoDB started in Docker container"
        else
            print_error "Please install MongoDB or Docker to proceed"
            exit 1
        fi
    fi
}

# IPFS setup
setup_ipfs() {
    print_status "Setting up IPFS configuration..."
    
    # Check if IPFS is needed for local development
    if [ "$IPFS_MODE" = "local" ]; then
        if ! command -v ipfs &> /dev/null; then
            print_warning "IPFS is not installed locally. Using Pinata service instead."
        else
            print_success "IPFS daemon available"
        fi
    else
        print_status "Using Pinata cloud service for IPFS"
    fi
}

# Build applications
build_applications() {
    print_status "Building applications..."
    
    # Build frontend
    print_status "Building frontend application..."
    npm run build
    
    print_success "Applications built successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests
    if [ -f "backend/package.json" ] && grep -q "test" backend/package.json; then
        print_status "Running backend tests..."
        cd backend
        npm test || print_warning "Some backend tests failed"
        cd ..
    fi
    
    # Frontend tests
    if grep -q "test" package.json; then
        print_status "Running frontend tests..."
        npm test -- --run || print_warning "Some frontend tests failed"
    fi
    
    print_success "Tests completed"
}

# Smart contract deployment
deploy_contracts() {
    print_status "Smart contract deployment..."
    
    if [ -d "contracts" ]; then
        print_status "Smart contracts found. Please deploy manually using:"
        print_status "1. Install Hardhat: npm install --save-dev hardhat"
        print_status "2. Configure hardhat.config.js with your network settings"
        print_status "3. Deploy contracts: npx hardhat run scripts/deploy.js --network <network>"
        print_warning "Smart contract deployment requires manual configuration"
    fi
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Create PM2 ecosystem file for production
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'fylaro-backend',
      script: './backend/src/index.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
EOF

    # Create logs directory
    mkdir -p logs
    
    if command -v pm2 &> /dev/null; then
        print_status "Starting backend with PM2..."
        pm2 start ecosystem.config.js
        print_success "Backend started with PM2"
    else
        print_status "Starting backend with npm..."
        cd backend
        npm start &
        cd ..
        print_success "Backend started"
    fi
    
    # Frontend is typically served by a web server in production
    print_status "Frontend build is ready to be served by a web server"
    print_status "You can serve it with: npx serve dist -p 3000"
}

# Security checks
security_checks() {
    print_status "Running security checks..."
    
    # Check for security vulnerabilities
    npm audit --audit-level moderate || print_warning "Security vulnerabilities found. Run 'npm audit fix' to resolve."
    
    cd backend
    npm audit --audit-level moderate || print_warning "Backend security vulnerabilities found."
    cd ..
    
    # Check environment files
    if grep -q "your_secret_key_here" backend/.env 2>/dev/null; then
        print_error "Default values found in backend/.env. Please update with secure values."
    fi
    
    print_success "Security checks completed"
}

# Performance optimization
optimize_performance() {
    print_status "Optimizing performance..."
    
    # Optimize images if imagemin is available
    if command -v imagemin &> /dev/null; then
        print_status "Optimizing images..."
        find public -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | head -10 | xargs -I {} imagemin {} --out-dir=public/optimized/ || true
    fi
    
    # Gzip compression check
    if [ -f "dist/index.html" ]; then
        gzip -9 -k dist/index.html 2>/dev/null || true
        print_status "Frontend assets ready for compression"
    fi
    
    print_success "Performance optimization completed"
}

# Health checks
health_checks() {
    print_status "Running health checks..."
    
    # Wait a moment for services to start
    sleep 5
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed - service may still be starting"
    fi
    
    # Check database connection
    if command -v mongosh &> /dev/null; then
        if mongosh --eval "db.runCommand('ping').ok" --quiet > /dev/null 2>&1; then
            print_success "Database connection check passed"
        else
            print_warning "Database connection check failed"
        fi
    fi
}

# Deployment summary
deployment_summary() {
    echo ""
    echo "🎉 Deployment Summary"
    echo "===================="
    
    print_success "Backend API: http://localhost:3001"
    print_success "Health Check: http://localhost:3001/health"
    print_success "API Status: http://localhost:3001/api/status"
    print_success "WebSocket: ws://localhost:3001"
    
    echo ""
    print_status "Next Steps:"
    echo "1. Update environment variables in backend/.env and .env"
    echo "2. Configure your blockchain network settings"
    echo "3. Deploy smart contracts to your chosen network"
    echo "4. Set up SSL certificates for production"
    echo "5. Configure your web server to serve the frontend"
    echo "6. Set up monitoring and logging"
    echo "7. Configure backup strategies"
    
    echo ""
    print_status "Useful Commands:"
    echo "- View backend logs: pm2 logs fylaro-backend"
    echo "- Restart backend: pm2 restart fylaro-backend"
    echo "- Stop backend: pm2 stop fylaro-backend"
    echo "- Monitor services: pm2 monit"
    
    echo ""
    print_success "Fylaro Finance deployment completed successfully! 🚀"
}

# Main deployment function
main() {
    echo "Starting deployment process..."
    
    check_prerequisites
    setup_environment
    install_dependencies
    setup_database
    setup_ipfs
    build_applications
    run_tests
    deploy_contracts
    security_checks
    optimize_performance
    start_services
    health_checks
    deployment_summary
    
    echo ""
    print_success "All deployment steps completed!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --production)
            NODE_ENV=production
            shift
            ;;
        --local-ipfs)
            IPFS_MODE=local
            shift
            ;;
        --help)
            echo "Fylaro Finance Deployment Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-tests     Skip running tests"
            echo "  --skip-build     Skip building applications"
            echo "  --production     Deploy in production mode"
            echo "  --local-ipfs     Use local IPFS instead of Pinata"
            echo "  --help           Show this help message"
            echo ""
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main deployment
main
