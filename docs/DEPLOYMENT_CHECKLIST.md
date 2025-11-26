# Fylaro Finance - Deployment Checklist

## Pre-Deployment

### Code Quality
- [ ] All tests passing
- [ ] No ESLint errors
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] CHANGELOG updated

### Security
- [ ] Dependencies updated
- [ ] Security audit completed
- [ ] API keys rotated
- [ ] SSL certificates valid
- [ ] CORS configured properly

### Performance
- [ ] Bundle size optimized
- [ ] Images compressed
- [ ] Lighthouse score > 90
- [ ] Load time < 3s
- [ ] Code splitting implemented

### Environment
- [ ] Environment variables set
- [ ] Database backed up
- [ ] DNS configured
- [ ] CDN configured
- [ ] Monitoring enabled

## Deployment Steps

### Frontend

1. **Build Production**
   ```bash
   npm run build
   npm run preview # Test production build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Verify Deployment**
   - Check all routes load
   - Test wallet connection
   - Verify API connectivity

### Backend

1. **Database Migration**
   ```bash
   npm run migrate:prod
   ```

2. **Deploy Server**
   ```bash
   git push heroku main
   ```

3. **Health Check**
   ```bash
   curl https://api.fylaro.finance/health
   ```

### Smart Contracts

1. **Deploy Contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network bsc-mainnet
   ```

2. **Verify on BSCScan**
   ```bash
   npx hardhat verify --network bsc-mainnet <CONTRACT_ADDRESS>
   ```

3. **Update Frontend Config**
   - Update contract addresses
   - Update ABIs if changed

## Post-Deployment

### Verification
- [ ] Homepage loads correctly
- [ ] All features functional
- [ ] Wallet connection works
- [ ] API endpoints responding
- [ ] WebSocket connected
- [ ] Analytics tracking

### Monitoring
- [ ] Error tracking active
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation
- [ ] Alert notifications

### Documentation
- [ ] Update README with new URLs
- [ ] Update API documentation
- [ ] Create release notes
- [ ] Announce to community

## Rollback Plan

If deployment fails:

1. **Revert Frontend**
   ```bash
   vercel rollback
   ```

2. **Revert Backend**
   ```bash
   git revert HEAD
   git push heroku main
   ```

3. **Database Rollback**
   ```bash
   npm run migrate:rollback
   ```

## Emergency Contacts

- **DevOps Lead**: devops@fylaro.finance
- **Security Team**: security@fylaro.finance
- **On-Call Engineer**: +1-XXX-XXX-XXXX

## Sign-Off

- [ ] Tech Lead Approved
- [ ] Security Reviewed
- [ ] QA Tested
- [ ] Product Owner Approved
- [ ] Deployment Complete

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________
