# Environment Variables

## Required Variables

### Frontend (.env)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_WEBSOCKET_URL=ws://localhost:3001

# Blockchain Configuration
VITE_NETWORK=bsc-testnet
VITE_CHAIN_ID=97

# Contract Addresses (BSC Testnet)
VITE_INVOICE_TOKEN_ADDRESS=0x...
VITE_MARKETPLACE_ADDRESS=0x...
VITE_CREDIT_SCORING_ADDRESS=0x...
VITE_LIQUIDITY_POOL_ADDRESS=0x...

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX
```

### Backend (backend/.env)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/fylaro
MONGODB_TEST_URI=mongodb://localhost:27017/fylaro-test

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=24h

# Blockchain
PRIVATE_KEY=your_private_key
RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=fylaro-invoices

# Redis (Optional)
REDIS_URL=redis://localhost:6379
```

## Production Variables

### Frontend (Vercel/Netlify)
- Set in dashboard under Environment Variables
- Use production API URLs
- Use mainnet contract addresses

### Backend (Heroku/AWS)
- Set via CLI or dashboard
- Enable SSL for production
- Use production database URLs

## Security Notes

1. **Never commit .env files**
2. **Use different keys for dev/prod**
3. **Rotate secrets regularly**
4. **Use environment-specific configs**
5. **Enable rate limiting in production**

## Validation

Check required variables:
```bash
npm run check:env
```
