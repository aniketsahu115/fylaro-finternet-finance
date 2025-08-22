# Wallet Integration Guide

## Overview
The Fylaro Finternet Finance platform now includes full Web3 wallet integration with support for Binance Smart Chain (BSC) and other EVM-compatible networks.

## Features
- ✅ Multi-wallet support (MetaMask, Trust Wallet, WalletConnect, etc.)
- ✅ Binance Smart Chain (BSC) integration
- ✅ Automatic network switching
- ✅ Custom wallet connection modal
- ✅ Real-time connection status
- ✅ Responsive design

## Supported Wallets
1. **MetaMask** (Recommended for BSC)
2. **Trust Wallet** (Official Binance wallet)
3. **WalletConnect** (Mobile wallets via QR code)
4. **Coinbase Wallet**
5. **Rainbow Wallet**
6. **Safe Wallet**

## Supported Networks
- **Binance Smart Chain (BSC)** - Primary network
- **BSC Testnet** - For development
- **Ethereum Mainnet**
- **Polygon**
- **Arbitrum**

## Configuration

### Environment Variables
Create a `.env.local` file with:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_APP_NAME=Fylaro Finternet Finance
VITE_DEFAULT_CHAIN_ID=56
```

### WalletConnect Project ID
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Add it to your `.env.local` file

## Usage

### Connect Wallet
1. Click the "Connect Wallet" button in the navbar
2. Select your preferred wallet from the modal
3. Follow the wallet prompts to connect
4. The system will automatically prompt to switch to BSC if needed

### Network Switching
- If connected to the wrong network, a "Switch to BSC" button will appear
- Click it to automatically switch to Binance Smart Chain
- Users can also manually switch networks in their wallet

### Disconnect Wallet
- Click on your wallet address in the navbar
- Select disconnect option

## Technical Implementation

### Key Files
- `src/lib/web3-config.ts` - Web3 configuration and chain setup
- `src/hooks/useWallet.ts` - Custom wallet hook
- `src/components/features/WalletConnectModal.tsx` - Wallet selection modal
- `src/components/layout/Navbar.tsx` - Navbar with wallet integration

### Dependencies
```json
{
  "wagmi": "^2.x.x",
  "viem": "^2.x.x",
  "@rainbow-me/rainbowkit": "^2.x.x",
  "@tanstack/react-query": "^5.x.x",
  "ethers": "^6.x.x"
}
```

## Testing
1. Start the development server: `npm run dev`
2. Open http://localhost:8081/ in your browser
3. Click "Connect Wallet" 
4. Test with different wallets and networks

## Security Considerations
- Never store private keys in the application
- Always verify contract addresses before interactions
- Use HTTPS in production
- Implement proper error handling for wallet interactions

## Troubleshooting

### Common Issues
1. **Wallet not detected**: Ensure the wallet extension is installed and enabled
2. **Wrong network**: Click "Switch to BSC" or manually switch in wallet
3. **Connection failed**: Check browser console for errors, try refreshing
4. **Modal not opening**: Check for JavaScript errors in console

### Browser Compatibility
- Chrome/Chromium (Recommended)
- Firefox
- Safari (limited wallet support)
- Edge

## Future Enhancements
- [ ] Implement wallet-based authentication
- [ ] Add transaction history tracking
- [ ] Support for hardware wallets (Ledger, Trezor)
- [ ] Multi-signature wallet support
- [ ] ENS domain support
