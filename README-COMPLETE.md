# 🚀 Fylaro Finance - Invoice Tokenization Platform

> **Complete Invoice Tokenization Platform with Real-time Trading, Advanced Credit Scoring, and Finternet Integration**

[![Production Ready](https://img.shields.io/badge/Production-Ready-green)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)]()
[![React](https://img.shields.io/badge/React-18-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)]()

## 🌟 Overview

Fylaro Finance is a comprehensive **invoice tokenization platform** that enables businesses to convert their invoices into tradeable digital assets. The platform features advanced credit scoring, real-time trading, automated payment tracking, and seamless Finternet integration.

### ✨ Key Features

- 🏭 **Invoice Tokenization** - Convert invoices to ERC-1155 tokens for fractional ownership
- 📊 **Advanced Credit Scoring** - ML-powered risk assessment with real-time updates
- 💹 **Secondary Trading** - Real-time order matching engine with automated settlement
- 🔐 **IPFS Document Storage** - Encrypted, decentralized document management
- 🌐 **Finternet Integration** - Multi-chain compatibility and global accessibility
- ⚡ **Real-time Updates** - WebSocket-powered live notifications and trading
- 🛡️ **Enterprise Security** - Military-grade encryption and comprehensive audit logging

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd fylaro-finternet-finance

# Quick development start
npm run start:dev
```

### Option 2: Manual Setup

```bash
# Install dependencies
npm run setup

# Start backend
npm run backend:dev

# Start frontend (in new terminal)
npm run dev
```

---

## 📋 Prerequisites

- **Node.js 18+** and **npm**
- **MongoDB** (local or Docker)
- **Git** for version control
- **Docker** (optional, for containerized services)

### Optional Requirements

- **IPFS node** (for local IPFS, otherwise uses Pinata)
- **Ethereum wallet** (MetaMask) for blockchain features
- **SSL certificates** for production deployment

---

## 🔧 Installation Guide

### 1. Environment Setup

Create environment files from examples:

```bash
# Frontend environment
cp .env.example .env

# Backend environment
cp backend/.env.example backend/.env
```

### 2. Configure Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_BLOCKCHAIN_NETWORK=ethereum
VITE_ENVIRONMENT=development
```

**Backend (backend/.env):**
```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/fylaro-finance

# Security
JWT_SECRET=your-super-secure-jwt-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key

# IPFS & Storage
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_API_KEY=your-pinata-secret-key
PINATA_JWT=your-pinata-jwt-token

# Blockchain
ETHEREUM_RPC_URL=your-ethereum-rpc-url
PRIVATE_KEY=your-wallet-private-key
CONTRACT_ADDRESS=deployed-contract-address

# External APIs
CREDIT_BUREAU_API_KEY=your-credit-bureau-api-key
PAYMENT_GATEWAY_API_KEY=your-payment-gateway-key
```

### 3. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongod
```

**Option B: Docker MongoDB**
```bash
docker run -d \
  --name fylaro-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest
```

---

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Start both frontend and backend
npm run start:dev

# Or start individually
npm run backend:dev  # Backend on :3001
npm run dev         # Frontend on :5173
```

### Production Deployment

```bash
# Full production deployment
npm run deploy:prod

# Or step by step
npm run build
npm run deploy
```

---

## 🏗️ Architecture Overview

### Backend Services

```
backend/
├── src/
│   ├── models/           # Database models (MongoDB)
│   │   ├── User.js
│   │   ├── Invoice.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── Document.js
│   │   └── CreditScore.js
│   ├── services/         # Business logic services
│   │   ├── ipfsService.js
│   │   ├── websocketService.js
│   │   ├── advancedCreditScoring.js
│   │   └── orderMatchingEngine.js
│   ├── routes/           # API endpoints
│   │   ├── auth.js
│   │   ├── invoices.js
│   │   ├── trading.js
│   │   ├── documents.js
│   │   └── creditScoring.js
│   └── middleware/       # Express middleware
│       ├── auth.js
│       └── permissions.js
```

### Frontend Architecture

```
src/
├── components/
│   ├── features/         # Feature-specific components
│   ├── layout/          # Layout components
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
│   └── useWebSocket.ts  # WebSocket functionality
├── services/            # API and service integrations
│   └── webSocketService.ts
├── pages/               # Page components
└── lib/                 # Utilities and configurations
```

### Smart Contracts

```
contracts/
├── InvoiceToken.sol     # ERC-1155 for fractional ownership
├── Marketplace.sol      # Trading and settlement
└── Settlement.sol       # Automated payment distribution
```

---

## 🔌 API Documentation

### Core Endpoints

**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

**Invoice Management**
- `POST /api/invoices/upload` - Upload and tokenize invoice
- `GET /api/invoices` - List user invoices
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id/verify` - Verify invoice

**Trading**
- `POST /api/trading/orders` - Place trading order
- `GET /api/trading/orderbook/:pair` - Get order book
- `GET /api/trading/history` - Get trade history
- `DELETE /api/trading/orders/:id` - Cancel order

**Documents (IPFS)**
- `POST /api/documents/upload` - Upload document to IPFS
- `GET /api/documents/:id` - Retrieve document
- `POST /api/documents/:id/share` - Create shareable link

**Credit Scoring**
- `GET /api/credit/score` - Get user credit score
- `POST /api/credit/update` - Update credit data
- `GET /api/credit/recommendations` - Get improvement suggestions

**WebSocket Events**
- `invoice_status_update` - Invoice verification updates
- `trade_executed` - Real-time trade notifications
- `order_book_update` - Live order book changes
- `payment_received` - Payment confirmations
- `credit_score_update` - Credit score changes

---

## 🌐 WebSocket Integration

### Frontend Usage

```typescript
import { useWebSocket, useOrderBook, useTrades } from './hooks/useWebSocket';

// Basic WebSocket connection
const { isConnected, sendMessage } = useWebSocket({
  userId: 'user123',
  tradingPairs: ['INV-USD']
});

// Real-time order book
const { orderBook, isLoading } = useOrderBook('INV-USD');

// Live trade updates
const { trades, newTrade } = useTrades('INV-USD');
```

### WebSocket Events

```javascript
// Subscribe to trading pair
webSocketService.subscribeTo('INV-USD');

// Listen for updates
webSocketService.on('order_book_update', (data) => {
  console.log('Order book updated:', data);
});

// Send custom message
webSocketService.send('place_order', {
  tradingPair: 'INV-USD',
  side: 'buy',
  quantity: 100,
  price: 0.95
});
```

---

## 🔐 Security Features

### Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Role-based permissions** (admin, user, verifier)
- **Multi-factor authentication** support
- **Session management** with automatic logout

### Data Protection
- **AES-256-GCM encryption** for sensitive data
- **HTTPS/WSS enforcement** in production
- **Input validation** and sanitization
- **SQL injection prevention**

### Smart Contract Security
- **Access control** with role-based permissions
- **Reentrancy protection** on all external calls
- **Input validation** and bounds checking
- **Emergency pause** functionality

### Network Security
- **Rate limiting** on all endpoints
- **CORS configuration** for cross-origin requests
- **Content Security Policy** headers
- **Comprehensive audit logging**

---

## 📊 Monitoring & Analytics

### Health Monitoring

```bash
# Check application health
curl http://localhost:3001/health

# Get detailed status
curl http://localhost:3001/api/status

# Backend-specific health check
npm run health
```

### Performance Metrics

The platform provides comprehensive monitoring:

- **Real-time connection statistics**
- **Order matching performance metrics**
- **Credit scoring analytics**
- **Document storage statistics**
- **Trading volume and performance**

---

## 🚢 Deployment

### Development Deployment

```bash
# Quick development setup
./dev-start.sh

# Or use npm scripts
npm run start:dev
```

### Production Deployment

```bash
# Full production deployment
./deploy.sh --production

# With custom options
./deploy.sh --production --skip-tests
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Frontend tests
npm run test:ui

# Backend tests
cd backend && npm test

# Test coverage
npm run test:coverage
```

---

## 📚 Additional Resources

### Useful Scripts

```bash
# Clean all dependencies and builds
npm run clean

# Restart backend service
npm run restart

# View backend logs
npm run logs

# Check backend health
npm run health
```

---

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check if port is in use
lsof -i :3001

# Check MongoDB connection
npm run health
```

**WebSocket connection fails:**
```bash
# Check firewall settings
# Ensure CORS is configured correctly
# Verify environment variables
```

**IPFS upload fails:**
```bash
# Check Pinata API keys
# Verify network connectivity
# Check file size limits
```

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

**🚀 Ready to tokenize the future of invoice financing!**
