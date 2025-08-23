// Backend Integration Service for Fylaro Finternet Finance
const ethers = require('ethers');
const axios = require('axios');
const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import ABI files (assuming they are compiled and available)
const InvoiceTokenABI = require('../artifacts/contracts/InvoiceToken.sol/InvoiceToken.json').abi;
const MarketplaceABI = require('../artifacts/contracts/Marketplace.sol/Marketplace.json').abi;
const CreditScoringABI = require('../artifacts/contracts/CreditScoring.sol/CreditScoring.json').abi;
const PaymentTrackerABI = require('../artifacts/contracts/PaymentTracker.sol/PaymentTracker.json').abi;
const UnifiedLedgerABI = require('../artifacts/contracts/UnifiedLedger.sol/UnifiedLedger.json').abi;
const RiskAssessmentABI = require('../artifacts/contracts/RiskAssessment.sol/RiskAssessment.json').abi;
const LiquidityPoolABI = require('../artifacts/contracts/LiquidityPool.sol/LiquidityPool.json').abi;
const FinternentGatewayABI = require('../artifacts/contracts/FinternentGateway.sol/FinternentGateway.json').abi;

// Configure logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'blockchain-integration' },
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

/**
 * Blockchain Integration Service Class
 * Handles integration between backend API and smart contracts
 */
class BlockchainIntegrationService {
  constructor() {
    // Initialize provider and wallet
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    // Contract addresses
    this.contractAddresses = {
      invoiceToken: process.env.INVOICE_TOKEN_ADDRESS,
      marketplace: process.env.MARKETPLACE_ADDRESS,
      creditScoring: process.env.CREDIT_SCORING_ADDRESS,
      paymentTracker: process.env.PAYMENT_TRACKER_ADDRESS,
      unifiedLedger: process.env.UNIFIED_LEDGER_ADDRESS,
      riskAssessment: process.env.RISK_ASSESSMENT_ADDRESS,
      liquidityPool: process.env.LIQUIDITY_POOL_ADDRESS,
      finternetGateway: process.env.FINTERNET_GATEWAY_ADDRESS
    };
    
    // Initialize contract instances
    this.initializeContracts();
    
    // Event listeners
    this.setupEventListeners();
    
    logger.info('Blockchain Integration Service initialized');
  }
  
  /**
   * Initialize contract instances
   */
  initializeContracts() {
    try {
      // Check if all contract addresses are available
      for (const [name, address] of Object.entries(this.contractAddresses)) {
        if (!address) {
          throw new Error(`Contract address for ${name} is not defined`);
        }
      }
      
      // Initialize contract instances
      this.invoiceToken = new ethers.Contract(
        this.contractAddresses.invoiceToken,
        InvoiceTokenABI,
        this.wallet
      );
      
      this.marketplace = new ethers.Contract(
        this.contractAddresses.marketplace,
        MarketplaceABI,
        this.wallet
      );
      
      this.creditScoring = new ethers.Contract(
        this.contractAddresses.creditScoring,
        CreditScoringABI,
        this.wallet
      );
      
      this.paymentTracker = new ethers.Contract(
        this.contractAddresses.paymentTracker,
        PaymentTrackerABI,
        this.wallet
      );
      
      this.unifiedLedger = new ethers.Contract(
        this.contractAddresses.unifiedLedger,
        UnifiedLedgerABI,
        this.wallet
      );
      
      this.riskAssessment = new ethers.Contract(
        this.contractAddresses.riskAssessment,
        RiskAssessmentABI,
        this.wallet
      );
      
      this.liquidityPool = new ethers.Contract(
        this.contractAddresses.liquidityPool,
        LiquidityPoolABI,
        this.wallet
      );
      
      this.finternetGateway = new ethers.Contract(
        this.contractAddresses.finternetGateway,
        FinternentGatewayABI,
        this.wallet
      );
      
      logger.info('Contract instances initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize contract instances', { error });
      throw error;
    }
  }
  
  /**
   * Setup blockchain event listeners
   */
  setupEventListeners() {
    try {
      // InvoiceToken events
      this.invoiceToken.on('InvoiceTokenized', async (invoiceId, issuer, totalValue, event) => {
        logger.info('Invoice tokenized', { invoiceId: invoiceId.toString(), issuer, totalValue: totalValue.toString() });
        await this.syncInvoiceToDatabase(invoiceId);
      });
      
      this.invoiceToken.on('InvoiceVerified', async (invoiceId, verifier, event) => {
        logger.info('Invoice verified', { invoiceId: invoiceId.toString(), verifier });
        await this.updateInvoiceStatus(invoiceId, 'VERIFIED');
      });
      
      // PaymentTracker events
      this.paymentTracker.on('PaymentReceived', async (invoiceId, paymentId, amount, payer, event) => {
        logger.info('Payment received', { 
          invoiceId: invoiceId.toString(), 
          paymentId: paymentId.toString(), 
          amount: amount.toString(), 
          payer 
        });
        await this.recordPaymentInDatabase(invoiceId, paymentId, amount, payer);
      });
      
      this.paymentTracker.on('PaymentStatusUpdated', async (invoiceId, newStatus, event) => {
        logger.info('Payment status updated', { invoiceId: invoiceId.toString(), status: newStatus });
        await this.updatePaymentStatus(invoiceId, newStatus);
      });
      
      // Marketplace events
      this.marketplace.on('InvoiceListingCreated', async (listingId, invoiceId, seller, price, event) => {
        logger.info('Invoice listing created', { 
          listingId: listingId.toString(), 
          invoiceId: invoiceId.toString(), 
          seller, 
          price: price.toString() 
        });
        await this.createMarketListing(listingId, invoiceId, seller, price);
      });
      
      this.marketplace.on('InvoiceSold', async (listingId, invoiceId, seller, buyer, price, event) => {
        logger.info('Invoice sold', { 
          listingId: listingId.toString(), 
          invoiceId: invoiceId.toString(), 
          seller, 
          buyer, 
          price: price.toString() 
        });
        await this.updateMarketListing(listingId, 'SOLD', buyer);
      });
      
      // Risk Assessment events
      this.riskAssessment.on('RiskAssessmentCreated', async (assessmentId, invoiceId, riskScore, event) => {
        logger.info('Risk assessment created', { 
          assessmentId: assessmentId.toString(), 
          invoiceId: invoiceId.toString(), 
          riskScore 
        });
        await this.syncRiskAssessment(assessmentId, invoiceId);
      });
      
      logger.info('Event listeners set up successfully');
    } catch (error) {
      logger.error('Failed to set up event listeners', { error });
    }
  }
  
  /**
   * Tokenize invoice
   * @param {string} issuer - The issuer address
   * @param {number} totalValue - The total value of the invoice
   * @param {string} ipfsHash - The IPFS hash of the invoice document
   * @param {number} dueDate - The due date of the invoice
   * @param {string} debtor - The debtor address
   * @param {string} industry - The industry of the invoice
   * @returns {Promise<object>} - Transaction receipt and invoice ID
   */
  async tokenizeInvoice(issuer, totalValue, ipfsHash, dueDate, debtor, industry) {
    try {
      logger.info('Tokenizing invoice', { issuer, totalValue, ipfsHash, dueDate, debtor, industry });
      
      // Convert totalValue to BigNumber
      const valueInWei = ethers.utils.parseUnits(totalValue.toString(), 'ether');
      
      // Process invoice through the gateway
      const tx = await this.finternetGateway.processInvoice(
        ipfsHash,
        valueInWei,
        dueDate,
        debtor,
        industry,
        { gasLimit: 1000000 }
      );
      
      const receipt = await tx.wait();
      
      // Find the InvoiceProcessed event to get the invoice ID
      const event = receipt.events.find(e => e.event === 'InvoiceProcessed');
      const invoiceId = event.args.invoiceId.toString();
      
      logger.info('Invoice tokenized successfully', { txHash: receipt.transactionHash, invoiceId });
      
      return {
        success: true,
        invoiceId,
        txHash: receipt.transactionHash,
        receipt
      };
    } catch (error) {
      logger.error('Failed to tokenize invoice', { error });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Verify invoice
   * @param {string} invoiceId - The invoice ID
   * @param {string} verifier - The verifier address
   * @returns {Promise<object>} - Transaction receipt
   */
  async verifyInvoice(invoiceId, verifier) {
    try {
      logger.info('Verifying invoice', { invoiceId, verifier });
      
      // Verify invoice through the gateway
      const tx = await this.finternetGateway.verifyInvoice(
        invoiceId,
        { from: verifier, gasLimit: 500000 }
      );
      
      const receipt = await tx.wait();
      
      logger.info('Invoice verified successfully', { txHash: receipt.transactionHash });
      
      return {
        success: true,
        txHash: receipt.transactionHash,
        receipt
      };
    } catch (error) {
      logger.error('Failed to verify invoice', { error, invoiceId });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Finance invoice
   * @param {string} invoiceId - The invoice ID
   * @param {number} amount - The amount to finance
   * @param {string} investor - The investor address
   * @returns {Promise<object>} - Transaction receipt
   */
  async financeInvoice(invoiceId, amount, investor) {
    try {
      logger.info('Financing invoice', { invoiceId, amount, investor });
      
      // Convert amount to BigNumber
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 'ether');
      
      // Finance invoice through the gateway
      const tx = await this.finternetGateway.financeInvoice(
        invoiceId,
        amountInWei,
        { from: investor, gasLimit: 1000000 }
      );
      
      const receipt = await tx.wait();
      
      logger.info('Invoice financed successfully', { txHash: receipt.transactionHash });
      
      return {
        success: true,
        txHash: receipt.transactionHash,
        receipt
      };
    } catch (error) {
      logger.error('Failed to finance invoice', { error, invoiceId });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Set up payment tracking for an invoice
   * @param {string} invoiceId - The invoice ID
   * @param {number} expectedAmount - The expected payment amount
   * @param {number} dueDate - The due date for the payment
   * @param {number} gracePeriod - The grace period in days
   * @returns {Promise<object>} - Transaction receipt
   */
  async setupPaymentTracking(invoiceId, expectedAmount, dueDate, gracePeriod) {
    try {
      logger.info('Setting up payment tracking', { invoiceId, expectedAmount, dueDate, gracePeriod });
      
      // Convert expectedAmount to BigNumber
      const amountInWei = ethers.utils.parseUnits(expectedAmount.toString(), 'ether');
      
      // Set up payment tracking through the gateway
      const tx = await this.finternetGateway.setupPaymentTracking(
        invoiceId,
        amountInWei,
        dueDate,
        gracePeriod,
        { gasLimit: 500000 }
      );
      
      const receipt = await tx.wait();
      
      logger.info('Payment tracking set up successfully', { txHash: receipt.transactionHash });
      
      return {
        success: true,
        txHash: receipt.transactionHash,
        receipt
      };
    } catch (error) {
      logger.error('Failed to set up payment tracking', { error, invoiceId });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Record payment for an invoice
   * @param {string} invoiceId - The invoice ID
   * @param {number} amount - The payment amount
   * @param {number} paymentMethod - The payment method (0: Crypto, 1: BankTransfer, 2: ACH, etc.)
   * @param {string} externalRef - External reference for the payment
   * @returns {Promise<object>} - Transaction receipt and payment ID
   */
  async recordPayment(invoiceId, amount, paymentMethod, externalRef) {
    try {
      logger.info('Recording payment', { invoiceId, amount, paymentMethod, externalRef });
      
      // Convert amount to BigNumber
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 'ether');
      
      // Record payment through the gateway
      const tx = await this.finternetGateway.recordPayment(
        invoiceId,
        amountInWei,
        paymentMethod,
        externalRef,
        { gasLimit: 500000 }
      );
      
      const receipt = await tx.wait();
      
      // Find the payment ID from events
      const event = receipt.events.find(e => e.event === 'PaymentReceived');
      const paymentId = event ? event.args.paymentId.toString() : null;
      
      logger.info('Payment recorded successfully', { txHash: receipt.transactionHash, paymentId });
      
      return {
        success: true,
        paymentId,
        txHash: receipt.transactionHash,
        receipt
      };
    } catch (error) {
      logger.error('Failed to record payment', { error, invoiceId });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Assess invoice risk
   * @param {string} invoiceId - The invoice ID
   * @returns {Promise<object>} - Transaction receipt and assessment ID
   */
  async assessInvoiceRisk(invoiceId) {
    try {
      logger.info('Assessing invoice risk', { invoiceId });
      
      // Assess invoice risk through the gateway
      const tx = await this.finternetGateway.assessInvoiceRisk(
        invoiceId,
        { gasLimit: 1000000 }
      );
      
      const receipt = await tx.wait();
      
      // Find the assessment ID from events
      const event = receipt.events.find(e => e.event === 'RiskAssessmentCreated');
      const assessmentId = event ? event.args.assessmentId.toString() : null;
      
      logger.info('Invoice risk assessed successfully', { txHash: receipt.transactionHash, assessmentId });
      
      return {
        success: true,
        assessmentId,
        txHash: receipt.transactionHash,
        receipt
      };
    } catch (error) {
      logger.error('Failed to assess invoice risk', { error, invoiceId });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Deposit to liquidity pool
   * @param {string} user - The user address
   * @param {number} amount - The amount to deposit
   * @returns {Promise<object>} - Transaction receipt and LP tokens
   */
  async depositToLiquidityPool(user, amount) {
    try {
      logger.info('Depositing to liquidity pool', { user, amount });
      
      // Convert amount to BigNumber
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 'ether');
      
      // Deposit to liquidity pool through the gateway
      const tx = await this.finternetGateway.depositToLiquidityPool(
        amountInWei,
        { from: user, gasLimit: 500000 }
      );
      
      const receipt = await tx.wait();
      
      // Find the LP tokens from events
      const event = receipt.events.find(e => e.event === 'Deposit');
      const lpTokens = event ? event.args.lpTokens.toString() : null;
      
      logger.info('Deposited to liquidity pool successfully', { txHash: receipt.transactionHash, lpTokens });
      
      return {
        success: true,
        lpTokens,
        txHash: receipt.transactionHash,
        receipt
      };
    } catch (error) {
      logger.error('Failed to deposit to liquidity pool', { error, user });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Withdraw from liquidity pool
   * @param {string} user - The user address
   * @param {number} lpTokenAmount - The amount of LP tokens to burn
   * @returns {Promise<object>} - Transaction receipt and withdrawn amount
   */
  async withdrawFromLiquidityPool(user, lpTokenAmount) {
    try {
      logger.info('Withdrawing from liquidity pool', { user, lpTokenAmount });
      
      // Convert LP token amount to BigNumber
      const lpTokensInWei = ethers.utils.parseUnits(lpTokenAmount.toString(), 'ether');
      
      // Withdraw from liquidity pool through the gateway
      const tx = await this.finternetGateway.withdrawFromLiquidityPool(
        lpTokensInWei,
        { from: user, gasLimit: 500000 }
      );
      
      const receipt = await tx.wait();
      
      // Find the withdrawn amount from events
      const event = receipt.events.find(e => e.event === 'Withdrawal');
      const withdrawnAmount = event ? event.args.amount.toString() : null;
      
      logger.info('Withdrawn from liquidity pool successfully', { txHash: receipt.transactionHash, withdrawnAmount });
      
      return {
        success: true,
        withdrawnAmount,
        txHash: receipt.transactionHash,
        receipt
      };
    } catch (error) {
      logger.error('Failed to withdraw from liquidity pool', { error, user });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Transfer invoice to another chain
   * @param {string} invoiceId - The invoice ID
   * @param {number} destinationChain - The destination chain ID
   * @param {string} owner - The invoice owner
   * @returns {Promise<object>} - Transaction receipt and transfer ID
   */
  async transferInvoiceToChain(invoiceId, destinationChain, owner) {
    try {
      logger.info('Transferring invoice to another chain', { invoiceId, destinationChain, owner });
      
      // Transfer invoice through the gateway
      const tx = await this.finternetGateway.transferInvoiceToChain(
        invoiceId,
        destinationChain,
        { from: owner, gasLimit: 1000000, value: ethers.utils.parseEther('0.01') }
      );
      
      const receipt = await tx.wait();
      
      // Find the transfer ID from events
      const event = receipt.events.find(e => e.event === 'CrossChainOperationInitiated');
      const transferId = event ? event.args.operationId.toString() : null;
      
      logger.info('Invoice transferred successfully', { txHash: receipt.transactionHash, transferId });
      
      return {
        success: true,
        transferId,
        txHash: receipt.transactionHash,
        receipt
      };
    } catch (error) {
      logger.error('Failed to transfer invoice', { error, invoiceId });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get invoice information
   * @param {string} invoiceId - The invoice ID
   * @returns {Promise<object>} - Invoice information
   */
  async getInvoiceInfo(invoiceId) {
    try {
      logger.info('Getting invoice information', { invoiceId });
      
      // Get invoice info through the gateway
      const info = await this.finternetGateway.getInvoiceInfo(invoiceId);
      
      const invoiceInfo = {
        invoiceId,
        issuer: info.issuer,
        totalValue: ethers.utils.formatEther(info.totalValue),
        isVerified: info.isVerified,
        dueDate: new Date(info.dueDate * 1000).toISOString(),
        debtor: info.debtor,
        industry: info.industry
      };
      
      logger.info('Got invoice information successfully', { invoiceId });
      
      return {
        success: true,
        invoice: invoiceInfo
      };
    } catch (error) {
      logger.error('Failed to get invoice information', { error, invoiceId });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get payment schedule
   * @param {string} invoiceId - The invoice ID
   * @returns {Promise<object>} - Payment schedule
   */
  async getPaymentSchedule(invoiceId) {
    try {
      logger.info('Getting payment schedule', { invoiceId });
      
      // Get payment schedule through the gateway
      const schedule = await this.finternetGateway.getPaymentSchedule(invoiceId);
      
      const paymentSchedule = {
        invoiceId,
        expectedAmount: ethers.utils.formatEther(schedule.expectedAmount),
        dueDate: new Date(schedule.dueDate * 1000).toISOString(),
        gracePeriod: schedule.gracePeriod.toString(),
        debtor: schedule.debtor,
        status: this.getPaymentStatusString(schedule.status),
        settled: schedule.settled
      };
      
      logger.info('Got payment schedule successfully', { invoiceId });
      
      return {
        success: true,
        schedule: paymentSchedule
      };
    } catch (error) {
      logger.error('Failed to get payment schedule', { error, invoiceId });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get risk assessment
   * @param {string} invoiceId - The invoice ID
   * @returns {Promise<object>} - Risk assessment
   */
  async getRiskAssessment(invoiceId) {
    try {
      logger.info('Getting risk assessment', { invoiceId });
      
      // Get risk assessment through the gateway
      const assessment = await this.finternetGateway.getRiskAssessment(invoiceId);
      
      const riskAssessment = {
        invoiceId,
        riskScore: assessment.riskScore,
        defaultProbability: assessment.defaultProbability,
        recoveryRate: assessment.recoveryRate,
        recommendedInterestRate: (assessment.recommendedInterestRate / 100).toString() + '%',
        isApproved: assessment.isApproved,
        riskCategory: assessment.riskCategory
      };
      
      logger.info('Got risk assessment successfully', { invoiceId });
      
      return {
        success: true,
        assessment: riskAssessment
      };
    } catch (error) {
      logger.error('Failed to get risk assessment', { error, invoiceId });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get user status
   * @param {string} userAddress - The user address
   * @returns {Promise<object>} - User status
   */
  async getUserStatus(userAddress) {
    try {
      logger.info('Getting user status', { userAddress });
      
      // Get user status through the gateway
      const status = await this.finternetGateway.getUserStatus(userAddress);
      
      const userStatus = {
        address: userAddress,
        role: status.role,
        isVerified: status.isVerified,
        isActive: status.isActive,
        registeredAt: new Date(status.registeredAt * 1000).toISOString(),
        lastActiveAt: new Date(status.lastActiveAt * 1000).toISOString()
      };
      
      logger.info('Got user status successfully', { userAddress });
      
      return {
        success: true,
        status: userStatus
      };
    } catch (error) {
      logger.error('Failed to get user status', { error, userAddress });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Sync invoice to database
   * @param {string} invoiceId - The invoice ID
   * @returns {Promise<void>}
   */
  async syncInvoiceToDatabase(invoiceId) {
    try {
      logger.info('Syncing invoice to database', { invoiceId });
      
      // Get invoice info
      const invoiceInfo = await this.getInvoiceInfo(invoiceId);
      
      if (!invoiceInfo.success) {
        throw new Error(`Failed to get invoice info: ${invoiceInfo.error}`);
      }
      
      // Send to API to sync with database
      await axios.post(`${process.env.API_URL}/invoices/sync`, {
        invoice: invoiceInfo.invoice
      });
      
      logger.info('Invoice synced to database successfully', { invoiceId });
    } catch (error) {
      logger.error('Failed to sync invoice to database', { error, invoiceId });
    }
  }
  
  /**
   * Update invoice status
   * @param {string} invoiceId - The invoice ID
   * @param {string} status - The new status
   * @returns {Promise<void>}
   */
  async updateInvoiceStatus(invoiceId, status) {
    try {
      logger.info('Updating invoice status', { invoiceId, status });
      
      // Send to API to update status
      await axios.put(`${process.env.API_URL}/invoices/${invoiceId}/status`, {
        status
      });
      
      logger.info('Invoice status updated successfully', { invoiceId, status });
    } catch (error) {
      logger.error('Failed to update invoice status', { error, invoiceId, status });
    }
  }
  
  /**
   * Record payment in database
   * @param {string} invoiceId - The invoice ID
   * @param {string} paymentId - The payment ID
   * @param {string} amount - The payment amount
   * @param {string} payer - The payer address
   * @returns {Promise<void>}
   */
  async recordPaymentInDatabase(invoiceId, paymentId, amount, payer) {
    try {
      logger.info('Recording payment in database', { invoiceId, paymentId, amount: amount.toString(), payer });
      
      // Format amount from wei to ether
      const amountInEther = ethers.utils.formatEther(amount);
      
      // Send to API to record payment
      await axios.post(`${process.env.API_URL}/payments`, {
        invoiceId,
        paymentId,
        amount: amountInEther,
        payer,
        timestamp: new Date().toISOString()
      });
      
      logger.info('Payment recorded in database successfully', { invoiceId, paymentId });
    } catch (error) {
      logger.error('Failed to record payment in database', { error, invoiceId, paymentId });
    }
  }
  
  /**
   * Update payment status
   * @param {string} invoiceId - The invoice ID
   * @param {number} status - The payment status
   * @returns {Promise<void>}
   */
  async updatePaymentStatus(invoiceId, status) {
    try {
      logger.info('Updating payment status', { invoiceId, status });
      
      // Convert status number to string
      const statusString = this.getPaymentStatusString(status);
      
      // Send to API to update payment status
      await axios.put(`${process.env.API_URL}/invoices/${invoiceId}/payment-status`, {
        status: statusString
      });
      
      logger.info('Payment status updated successfully', { invoiceId, status: statusString });
    } catch (error) {
      logger.error('Failed to update payment status', { error, invoiceId, status });
    }
  }
  
  /**
   * Create market listing in database
   * @param {string} listingId - The listing ID
   * @param {string} invoiceId - The invoice ID
   * @param {string} seller - The seller address
   * @param {string} price - The listing price
   * @returns {Promise<void>}
   */
  async createMarketListing(listingId, invoiceId, seller, price) {
    try {
      logger.info('Creating market listing in database', { listingId, invoiceId, seller, price: price.toString() });
      
      // Format price from wei to ether
      const priceInEther = ethers.utils.formatEther(price);
      
      // Send to API to create market listing
      await axios.post(`${process.env.API_URL}/marketplace/listings`, {
        listingId,
        invoiceId,
        seller,
        price: priceInEther,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      });
      
      logger.info('Market listing created in database successfully', { listingId, invoiceId });
    } catch (error) {
      logger.error('Failed to create market listing in database', { error, listingId, invoiceId });
    }
  }
  
  /**
   * Update market listing in database
   * @param {string} listingId - The listing ID
   * @param {string} status - The new status
   * @param {string} buyer - The buyer address
   * @returns {Promise<void>}
   */
  async updateMarketListing(listingId, status, buyer) {
    try {
      logger.info('Updating market listing in database', { listingId, status, buyer });
      
      // Send to API to update market listing
      await axios.put(`${process.env.API_URL}/marketplace/listings/${listingId}`, {
        status,
        buyer,
        updatedAt: new Date().toISOString()
      });
      
      logger.info('Market listing updated in database successfully', { listingId, status });
    } catch (error) {
      logger.error('Failed to update market listing in database', { error, listingId, status });
    }
  }
  
  /**
   * Sync risk assessment to database
   * @param {string} assessmentId - The assessment ID
   * @param {string} invoiceId - The invoice ID
   * @returns {Promise<void>}
   */
  async syncRiskAssessment(assessmentId, invoiceId) {
    try {
      logger.info('Syncing risk assessment to database', { assessmentId, invoiceId });
      
      // Get risk assessment
      const assessmentInfo = await this.getRiskAssessment(invoiceId);
      
      if (!assessmentInfo.success) {
        throw new Error(`Failed to get risk assessment: ${assessmentInfo.error}`);
      }
      
      // Send to API to sync with database
      await axios.post(`${process.env.API_URL}/risk-assessments`, {
        assessmentId,
        invoiceId,
        ...assessmentInfo.assessment,
        createdAt: new Date().toISOString()
      });
      
      logger.info('Risk assessment synced to database successfully', { assessmentId, invoiceId });
    } catch (error) {
      logger.error('Failed to sync risk assessment to database', { error, assessmentId, invoiceId });
    }
  }
  
  /**
   * Convert payment status number to string
   * @param {number} status - The payment status number
   * @returns {string} - The payment status string
   */
  getPaymentStatusString(status) {
    const statusMap = {
      0: 'SCHEDULED',
      1: 'PARTIALLY_PAID',
      2: 'PAID',
      3: 'OVERDUE',
      4: 'IN_GRACE_PERIOD',
      5: 'DEFAULT',
      6: 'RECOVERED'
    };
    
    return statusMap[status] || 'UNKNOWN';
  }
}

module.exports = BlockchainIntegrationService;
