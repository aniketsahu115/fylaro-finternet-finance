# Wallet Functionality Test Guide

## Pre-requisites
1. Install MetaMask browser extension from https://metamask.io/download/
2. Create or import a wallet in MetaMask
3. Add Binance Smart Chain network to MetaMask

## Adding BSC to MetaMask
1. Open MetaMask
2. Click on the network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add Network"
4. Fill in the details:
   - **Network Name:** Binance Smart Chain
   - **New RPC URL:** https://bsc-dataseed.binance.org/
   - **Chain ID:** 56
   - **Currency Symbol:** BNB
   - **Block Explorer URL:** https://bscscan.com

## Testing Steps
1. Open http://localhost:8081/ in your browser
2. You should see the Fylaro landing page with a "Connect Wallet" button in the top-right navbar
3. Click the "🔧 Wallet Debug" button in the bottom-right to open debug information (only visible in development)
4. Click "Connect Wallet" button in the navbar
5. A modal should open showing available wallet options
6. Click on "MetaMask" (should show with a 🦊 icon and "Recommended" badge)
7. MetaMask should prompt you to connect your wallet
8. Accept the connection in MetaMask
9. The button should change to show your wallet address (e.g., "0x1234...5678")
10. If you're not on BSC, you should see a "Switch to BSC" button - click it
11. MetaMask will prompt you to switch networks - accept it
12. The status should show "BSC Connected" with a green badge

## Expected Behavior
- ✅ Wallet connection modal opens when clicking "Connect Wallet"
- ✅ Multiple wallet options are shown
- ✅ MetaMask connection works
- ✅ Network switching to BSC works
- ✅ Wallet address is displayed in navbar
- ✅ Debug info shows correct connection status
- ✅ "Wrong Network" warning appears when not on BSC
- ✅ Disconnect functionality works

## Troubleshooting
If something doesn't work:
1. Check the browser console for errors (F12 → Console tab)
2. Check the wallet debug info for connection status
3. Ensure MetaMask is unlocked and has BSC network added
4. Try refreshing the page
5. Try disconnecting and reconnecting the wallet

## Alternative Wallets
You can also test with:
- **Trust Wallet** (via WalletConnect)
- **Coinbase Wallet**
- **Any WalletConnect-compatible mobile wallet**

## Development Notes
- The debugger component only shows in development mode
- Network switching prompts are handled automatically
- All wallet interactions are logged to the console for debugging
