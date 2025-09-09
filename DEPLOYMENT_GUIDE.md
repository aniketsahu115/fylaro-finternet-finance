# Fylaro Smart Contract Deployment Guide

This guide will walk you through deploying the Fylaro Finternet Finance smart contracts to various blockchain networks.

## 📋 Prerequisites

Before deploying, make sure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn** package manager
3. **A funded wallet** with native tokens for gas fees
4. **API keys** for block explorers (optional, for verification)

## 🚀 Quick Start

### 1. Environment Setup

First, copy the environment template and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file and add your configuration:

```bash
# Required: Your private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: API keys for contract verification
BSCSCAN_API_KEY=your_bscscan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

⚠️ **Security Warning**: Never commit your `.env` file to version control!

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Contracts

```bash
npm run compile
```

## 🌐 Network Deployment

### Local Development (Recommended for Testing)

1. Start a local Hardhat network:

```bash
npm run hardhat:node
```

2. In a new terminal, deploy to the local network:

```bash
npm run deploy:local
```

This will deploy all contracts and provide you with contract addresses for testing.

### BSC Testnet (Recommended for Testing)

1. Get testnet BNB from the [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)

2. Deploy to BSC Testnet:

```bash
npm run deploy:testnet
```

3. Optionally verify contracts:

```bash
npm run verify:testnet
```

### BSC Mainnet (Production)

⚠️ **Caution**: This deploys to the live BSC network with real money!

1. Ensure your wallet has sufficient BNB for gas fees (approximately 0.1 BNB)

2. Deploy to BSC Mainnet:

```bash
npm run deploy:mainnet
```

3. Verify contracts (recommended):

```bash
npm run verify:mainnet
```

### Other Networks

For Ethereum Sepolia testnet:

```bash
npm run deploy:sepolia
```

For custom networks, use the deployment script directly:

```bash
npx hardhat run scripts/deploy.js --network <network_name>
```

## 🔧 Advanced Deployment

### Using the Deployment Scripts

For more control, use the deployment scripts directly:

**Linux/macOS:**

```bash
./scripts/deploy-contracts.sh --network bscTestnet --verify
```

**Windows PowerShell:**

```powershell
.\scripts\deploy-contracts.ps1 -Network bscTestnet -Verify
```

### Available Networks

| Network      | Description      | Chain ID | Currency |
| ------------ | ---------------- | -------- | -------- |
| `localhost`  | Local Hardhat    | 31337    | ETH      |
| `bscTestnet` | BSC Testnet      | 97       | tBNB     |
| `bsc`        | BSC Mainnet      | 56       | BNB      |
| `sepolia`    | Ethereum Sepolia | 11155111 | ETH      |
| `ethereum`   | Ethereum Mainnet | 1        | ETH      |
| `polygon`    | Polygon Mainnet  | 137      | MATIC    |
| `arbitrum`   | Arbitrum Mainnet | 42161    | ETH      |

## 📄 Contract Addresses

After deployment, contract addresses will be saved in:

1. **Deployment files**: `deployments/<network>-<chainId>.json`
2. **Environment files**: `.env.<network>`

### Important Contracts

The deployment creates these main contracts:

- **FylaroDeployer**: Factory contract that deploys the entire ecosystem
- **InvoiceToken**: ERC721 tokens representing invoices
- **Marketplace**: Trading platform for invoice tokens
- **CreditScoring**: Credit assessment system
- **PaymentTracker**: Payment monitoring and settlement
- **UnifiedLedger**: Cross-chain transaction ledger
- **RiskAssessment**: Risk evaluation engine
- **LiquidityPool**: Liquidity provision for invoice financing
- **FinternentGateway**: Main entry point for all operations

## 🔍 Verification

Contract verification makes your code readable on block explorers like BSCScan.

### Automatic Verification

Use the verify scripts:

```bash
npm run verify:testnet  # For BSC Testnet
npm run verify:mainnet  # For BSC Mainnet
```

### Manual Verification

For individual contracts:

```bash
npx hardhat verify --network bscTestnet <contract_address> <constructor_args>
```

## 💰 Gas Costs

Estimated gas costs for full deployment:

| Network          | Estimated Cost |
| ---------------- | -------------- |
| BSC Mainnet      | ~0.05-0.1 BNB  |
| BSC Testnet      | ~0.05-0.1 tBNB |
| Ethereum Mainnet | ~0.5-1.0 ETH   |
| Polygon          | ~50-100 MATIC  |

## 🧪 Testing Deployment

After deployment, test your contracts:

1. **Local Testing**: Use the deployed local contracts with your frontend
2. **Testnet Testing**: Test with real wallet interactions on testnets
3. **Integration Testing**: Verify all contract interactions work correctly

### Get Test Tokens

For testnets, you can get test USDT from the MockUSDT contract:

```javascript
// In Hardhat console
const mockUSDT = await ethers.getContractAt("MockUSDT", "<mockUSDT_address>");
await mockUSDT.faucet(); // Get 10,000 test USDT
```

## 🔧 Configuration Updates

After deployment, update your application configuration:

### Frontend (.env)

```bash
VITE_INVOICE_TOKEN_ADDRESS=<address>
VITE_MARKETPLACE_ADDRESS=<address>
VITE_FINTERNET_GATEWAY_ADDRESS=<address>
# ... other addresses
```

### Backend (.env)

```bash
INVOICE_TOKEN_ADDRESS=<address>
MARKETPLACE_ADDRESS=<address>
FINTERNET_GATEWAY_ADDRESS=<address>
# ... other addresses
```

## 🆘 Troubleshooting

### Common Issues

1. **"Insufficient funds"**: Ensure your wallet has enough native tokens for gas
2. **"Nonce too high"**: Reset your MetaMask account or wait for pending transactions
3. **"Contract not verified"**: Some networks may not support automatic verification
4. **"Network connection error"**: Check your RPC URL configuration

### Getting Help

- Check the `deployments/` folder for deployment logs
- Use `npx hardhat console --network <network>` to debug
- Review transaction hashes on the block explorer

## 🔒 Security Best Practices

1. **Use a dedicated deployment wallet** - Don't use your main wallet
2. **Test thoroughly on testnets** before mainnet deployment
3. **Verify contracts** to ensure transparency
4. **Monitor deployments** for any issues
5. **Keep private keys secure** - Never share or commit them

## 📊 Next Steps

After successful deployment:

1. **Update your frontend** with the new contract addresses
2. **Update your backend** with the new contract addresses
3. **Test all functionality** with the deployed contracts
4. **Set up monitoring** for contract events and transactions
5. **Create documentation** for your specific deployment

## 🎉 Success!

If you've made it this far, congratulations! Your Fylaro Finternet Finance contracts are now deployed and ready to revolutionize invoice financing! 🚀

For support, check the project documentation or contact the development team.
