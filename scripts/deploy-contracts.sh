#!/bin/bash

# Fylaro Smart Contract Deployment Script
# This script helps deploy contracts to different networks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_status "Please copy .env.example to .env and fill in your configuration"
    print_status "cp .env.example .env"
    exit 1
fi

# Check if private key is set
if grep -q "your_private_key_here" .env; then
    print_error "Please update your PRIVATE_KEY in .env file"
    exit 1
fi

print_status "🚀 Fylaro Smart Contract Deployment"
print_status "===================================="

# Parse command line arguments
NETWORK=""
VERIFY="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --network)
            NETWORK="$2"
            shift 2
            ;;
        --verify)
            VERIFY="true"
            shift
            ;;
        --help)
            echo "Usage: $0 --network <network> [--verify]"
            echo ""
            echo "Networks:"
            echo "  localhost    Local Hardhat network"
            echo "  bscTestnet   BSC Testnet"
            echo "  bsc          BSC Mainnet"
            echo "  sepolia      Ethereum Sepolia Testnet"
            echo "  ethereum     Ethereum Mainnet"
            echo "  polygon      Polygon Mainnet"
            echo "  arbitrum     Arbitrum Mainnet"
            echo ""
            echo "Options:"
            echo "  --verify     Verify contracts on block explorer after deployment"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [ -z "$NETWORK" ]; then
    print_error "Please specify a network with --network <network>"
    echo "Use --help for available networks"
    exit 1
fi

# Validate network
case $NETWORK in
    localhost|bscTestnet|bsc|sepolia|ethereum|polygon|arbitrum)
        print_status "Deploying to network: $NETWORK"
        ;;
    *)
        print_error "Invalid network: $NETWORK"
        echo "Use --help for available networks"
        exit 1
        ;;
esac

# Compile contracts
print_status "Compiling contracts..."
npx hardhat compile

if [ $? -ne 0 ]; then
    print_error "Contract compilation failed"
    exit 1
fi

print_success "Contracts compiled successfully"

# Deploy contracts
if [ "$NETWORK" = "localhost" ]; then
    print_status "Deploying to local network..."
    npx hardhat run scripts/deploy-local.js --network localhost
else
    print_status "Deploying to $NETWORK..."
    npx hardhat run scripts/deploy.js --network $NETWORK
fi

if [ $? -ne 0 ]; then
    print_error "Deployment failed"
    exit 1
fi

print_success "Deployment completed successfully!"

# Verify contracts if requested
if [ "$VERIFY" = "true" ] && [ "$NETWORK" != "localhost" ]; then
    print_status "Verifying contracts..."
    sleep 10 # Wait for blocks to be mined
    npx hardhat run scripts/verify.js --network $NETWORK
    
    if [ $? -eq 0 ]; then
        print_success "Contract verification completed"
    else
        print_warning "Contract verification failed (this is normal for some networks)"
    fi
fi

print_success "🎉 All done!"
print_status "📋 Check the deployments/ folder for contract addresses"
print_status "📝 Update your frontend and backend .env files with the new addresses"
