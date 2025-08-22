# Troubleshooting "Hardhat Local" Connection Error

## Problem
When attempting to connect a wallet (MetaMask, etc.), you see the error: "We can't connect to Hardhat Local"

## Root Causes
1. **MetaMask is connected to a local development network**
2. **Hardhat network is still configured in MetaMask from previous development**
3. **Web3 configuration includes local/development chains**
4. **Wrong network is selected in the wallet**

## Solutions

### Solution 1: Check MetaMask Network
1. Open MetaMask
2. Click on the network dropdown (top of MetaMask)
3. If you see "Hardhat Local" or "Localhost 8545" selected, switch to "Binance Smart Chain" or "Ethereum Mainnet"
4. If BSC is not available, add it manually

### Solution 2: Add Binance Smart Chain to MetaMask
1. Open MetaMask
2. Click network dropdown
3. Click "Add Network" or "Custom RPC"
4. Enter these details:
   - **Network Name:** Binance Smart Chain
   - **RPC URL:** https://bsc-dataseed.binance.org/
   - **Chain ID:** 56
   - **Currency Symbol:** BNB
   - **Block Explorer:** https://bscscan.com

### Solution 3: Remove Hardhat Network
1. Open MetaMask
2. Go to Settings → Networks
3. Find "Hardhat Local" or "Localhost 8545"
4. Delete this network
5. Restart MetaMask

### Solution 4: Clear MetaMask Data (Last Resort)
1. Open MetaMask
2. Go to Settings → Advanced
3. Click "Reset Account" (this clears transaction history but keeps your wallet)
4. Re-import your accounts if needed

### Solution 5: Check Browser Console
1. Open browser console (F12)
2. Look for any errors related to:
   - Chain ID mismatches
   - RPC connection errors
   - Wallet connector issues
3. Share these errors for further debugging

## Verification Steps
After fixing:
1. Open the application at http://localhost:8081/
2. Click "Connect Wallet"
3. Select MetaMask
4. Should see BSC (Chain ID: 56) in the debug info
5. No "Hardhat Local" errors should appear

## Prevention
- Always switch to mainnet/testnet before using dApps
- Remove unused local networks from MetaMask
- Check network before connecting to any Web3 application

## Debug Information
Use the "🔧 Wallet Debug" button in the application to see:
- Current chain ID
- Available connectors
- Connection status
- Browser wallet detection

Chain IDs:
- Binance Smart Chain: 56
- BSC Testnet: 97
- Ethereum Mainnet: 1
- Hardhat Local: 31337 (should not appear)

If you still see Chain ID 31337, the wallet is connected to Hardhat Local network.
