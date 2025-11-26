# Troubleshooting Guide

## Common Issues

### Build Errors

#### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Check TypeScript version
npm list typescript

# Update dependencies
npm update
```

### Development Server Issues

#### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

#### Hot Reload Not Working
- Check file watchers limit (Linux)
- Disable antivirus file monitoring
- Clear Vite cache: `rm -rf node_modules/.vite`

### Wallet Connection Issues

#### MetaMask Not Detected
1. Check browser extension is installed
2. Refresh page
3. Check console for errors
4. Try incognito mode

#### Wrong Network
```typescript
// Switch to BSC Testnet
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x61' }], // 97 in hex
})
```

#### Transaction Failing
- Check wallet has BNB for gas
- Verify contract addresses
- Check slippage settings
- Review transaction in BSCScan

### Backend Issues

#### Database Connection Failed
```bash
# Check MongoDB is running
mongod --version
mongosh

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/fylaro
```

#### API Not Responding
```bash
# Check backend is running
curl http://localhost:3001/health

# Check logs
cd backend
npm run dev
```

### Smart Contract Issues

#### Deployment Failed
```bash
# Check network configuration
npx hardhat run scripts/deploy.js --network bsc-testnet

# Verify private key and RPC
# Check account has testnet BNB
```

#### Contract Interaction Failed
- Verify contract is deployed
- Check ABI is up to date
- Confirm wallet is connected
- Check gas limits

### Performance Issues

#### Slow Loading
- Enable production build: `npm run build`
- Check network tab for slow requests
- Implement lazy loading
- Use React DevTools Profiler

#### Memory Leaks
- Check for unsubscribed event listeners
- Clear intervals/timeouts
- Unmount cleanup in useEffect

## Debug Tools

### Browser DevTools
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true')

// Check wallet connection
console.log(window.ethereum)
```

### React DevTools
- Install React DevTools extension
- Check component props/state
- Use Profiler for performance

### Network Inspector
- Monitor API calls
- Check WebSocket connections
- Verify response times

## Getting Help

### Before Creating an Issue

1. Search existing issues
2. Check documentation
3. Review error messages
4. Test in different environment

### Creating an Issue

Include:
- Error message
- Steps to reproduce
- Environment details
- Screenshots
- Console logs

### Community Support

- GitHub Discussions
- Discord Server
- Stack Overflow tag: `fylaro`

## Emergency Contacts

For critical security issues:
security@fylaro.finance
