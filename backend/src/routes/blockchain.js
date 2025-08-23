const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const BlockchainIntegrationService = require('../services/blockchainIntegrationService');
const authMiddleware = require('../middleware/auth');
const permissionsMiddleware = require('../middleware/permissions');

// Initialize blockchain service
const blockchainService = new BlockchainIntegrationService();

/**
 * @route POST /api/blockchain/invoices
 * @desc Tokenize an invoice
 * @access Private - Issuer role required
 */
router.post(
  '/invoices',
  authMiddleware,
  permissionsMiddleware(['issuer']),
  [
    body('totalValue').isNumeric().withMessage('Total value must be a number'),
    body('ipfsHash').notEmpty().withMessage('IPFS hash is required'),
    body('dueDate').isNumeric().withMessage('Due date must be a timestamp'),
    body('debtor').notEmpty().withMessage('Debtor address is required'),
    body('industry').notEmpty().withMessage('Industry is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { totalValue, ipfsHash, dueDate, debtor, industry } = req.body;
      const issuer = req.user.address;

      const result = await blockchainService.tokenizeInvoice(
        issuer,
        totalValue,
        ipfsHash,
        dueDate,
        debtor,
        industry
      );

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(201).json({
        message: 'Invoice tokenized successfully',
        invoiceId: result.invoiceId,
        txHash: result.txHash
      });
    } catch (error) {
      console.error('Error tokenizing invoice:', error);
      return res.status(500).json({ error: 'Failed to tokenize invoice' });
    }
  }
);

/**
 * @route POST /api/blockchain/invoices/:id/verify
 * @desc Verify an invoice
 * @access Private - Verifier role required
 */
router.post(
  '/invoices/:id/verify',
  authMiddleware,
  permissionsMiddleware(['verifier']),
  [
    param('id').isNumeric().withMessage('Invoice ID must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoiceId = req.params.id;
      const verifier = req.user.address;

      const result = await blockchainService.verifyInvoice(invoiceId, verifier);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        message: 'Invoice verified successfully',
        txHash: result.txHash
      });
    } catch (error) {
      console.error('Error verifying invoice:', error);
      return res.status(500).json({ error: 'Failed to verify invoice' });
    }
  }
);

/**
 * @route POST /api/blockchain/invoices/:id/finance
 * @desc Finance an invoice
 * @access Private - Investor role required
 */
router.post(
  '/invoices/:id/finance',
  authMiddleware,
  permissionsMiddleware(['investor']),
  [
    param('id').isNumeric().withMessage('Invoice ID must be a number'),
    body('amount').isNumeric().withMessage('Amount must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoiceId = req.params.id;
      const amount = req.body.amount;
      const investor = req.user.address;

      const result = await blockchainService.financeInvoice(invoiceId, amount, investor);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        message: 'Invoice financed successfully',
        txHash: result.txHash
      });
    } catch (error) {
      console.error('Error financing invoice:', error);
      return res.status(500).json({ error: 'Failed to finance invoice' });
    }
  }
);

/**
 * @route POST /api/blockchain/invoices/:id/payment-tracking
 * @desc Set up payment tracking for an invoice
 * @access Private - Admin role required
 */
router.post(
  '/invoices/:id/payment-tracking',
  authMiddleware,
  permissionsMiddleware(['admin']),
  [
    param('id').isNumeric().withMessage('Invoice ID must be a number'),
    body('expectedAmount').isNumeric().withMessage('Expected amount must be a number'),
    body('dueDate').isNumeric().withMessage('Due date must be a timestamp'),
    body('gracePeriod').isNumeric().withMessage('Grace period must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoiceId = req.params.id;
      const { expectedAmount, dueDate, gracePeriod } = req.body;

      const result = await blockchainService.setupPaymentTracking(
        invoiceId,
        expectedAmount,
        dueDate,
        gracePeriod
      );

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        message: 'Payment tracking set up successfully',
        txHash: result.txHash
      });
    } catch (error) {
      console.error('Error setting up payment tracking:', error);
      return res.status(500).json({ error: 'Failed to set up payment tracking' });
    }
  }
);

/**
 * @route POST /api/blockchain/invoices/:id/payments
 * @desc Record payment for an invoice
 * @access Private - Admin role required
 */
router.post(
  '/invoices/:id/payments',
  authMiddleware,
  permissionsMiddleware(['admin']),
  [
    param('id').isNumeric().withMessage('Invoice ID must be a number'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('paymentMethod').isNumeric().withMessage('Payment method must be a number'),
    body('externalRef').notEmpty().withMessage('External reference is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoiceId = req.params.id;
      const { amount, paymentMethod, externalRef } = req.body;

      const result = await blockchainService.recordPayment(
        invoiceId,
        amount,
        paymentMethod,
        externalRef
      );

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        message: 'Payment recorded successfully',
        paymentId: result.paymentId,
        txHash: result.txHash
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      return res.status(500).json({ error: 'Failed to record payment' });
    }
  }
);

/**
 * @route POST /api/blockchain/invoices/:id/risk-assessment
 * @desc Assess invoice risk
 * @access Private - Admin role required
 */
router.post(
  '/invoices/:id/risk-assessment',
  authMiddleware,
  permissionsMiddleware(['admin']),
  [
    param('id').isNumeric().withMessage('Invoice ID must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoiceId = req.params.id;

      const result = await blockchainService.assessInvoiceRisk(invoiceId);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        message: 'Invoice risk assessed successfully',
        assessmentId: result.assessmentId,
        txHash: result.txHash
      });
    } catch (error) {
      console.error('Error assessing invoice risk:', error);
      return res.status(500).json({ error: 'Failed to assess invoice risk' });
    }
  }
);

/**
 * @route POST /api/blockchain/liquidity-pool/deposit
 * @desc Deposit to liquidity pool
 * @access Private - Any authenticated user
 */
router.post(
  '/liquidity-pool/deposit',
  authMiddleware,
  [
    body('amount').isNumeric().withMessage('Amount must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const amount = req.body.amount;
      const user = req.user.address;

      const result = await blockchainService.depositToLiquidityPool(user, amount);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        message: 'Deposited to liquidity pool successfully',
        lpTokens: result.lpTokens,
        txHash: result.txHash
      });
    } catch (error) {
      console.error('Error depositing to liquidity pool:', error);
      return res.status(500).json({ error: 'Failed to deposit to liquidity pool' });
    }
  }
);

/**
 * @route POST /api/blockchain/liquidity-pool/withdraw
 * @desc Withdraw from liquidity pool
 * @access Private - Any authenticated user
 */
router.post(
  '/liquidity-pool/withdraw',
  authMiddleware,
  [
    body('lpTokenAmount').isNumeric().withMessage('LP token amount must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const lpTokenAmount = req.body.lpTokenAmount;
      const user = req.user.address;

      const result = await blockchainService.withdrawFromLiquidityPool(user, lpTokenAmount);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        message: 'Withdrawn from liquidity pool successfully',
        withdrawnAmount: result.withdrawnAmount,
        txHash: result.txHash
      });
    } catch (error) {
      console.error('Error withdrawing from liquidity pool:', error);
      return res.status(500).json({ error: 'Failed to withdraw from liquidity pool' });
    }
  }
);

/**
 * @route POST /api/blockchain/invoices/:id/transfer
 * @desc Transfer invoice to another chain
 * @access Private - Invoice owner only
 */
router.post(
  '/invoices/:id/transfer',
  authMiddleware,
  [
    param('id').isNumeric().withMessage('Invoice ID must be a number'),
    body('destinationChain').isNumeric().withMessage('Destination chain must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoiceId = req.params.id;
      const destinationChain = req.body.destinationChain;
      const owner = req.user.address;

      // Check if user is invoice owner
      const invoiceInfo = await blockchainService.getInvoiceInfo(invoiceId);
      if (!invoiceInfo.success) {
        return res.status(500).json({ error: invoiceInfo.error });
      }

      if (invoiceInfo.invoice.issuer.toLowerCase() !== owner.toLowerCase()) {
        return res.status(403).json({ error: 'Not invoice owner' });
      }

      const result = await blockchainService.transferInvoiceToChain(
        invoiceId,
        destinationChain,
        owner
      );

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        message: 'Invoice transferred successfully',
        transferId: result.transferId,
        txHash: result.txHash
      });
    } catch (error) {
      console.error('Error transferring invoice:', error);
      return res.status(500).json({ error: 'Failed to transfer invoice' });
    }
  }
);

/**
 * @route GET /api/blockchain/invoices/:id
 * @desc Get invoice information
 * @access Private - Any authenticated user
 */
router.get(
  '/invoices/:id',
  authMiddleware,
  [
    param('id').isNumeric().withMessage('Invoice ID must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoiceId = req.params.id;

      const result = await blockchainService.getInvoiceInfo(invoiceId);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        invoice: result.invoice
      });
    } catch (error) {
      console.error('Error getting invoice information:', error);
      return res.status(500).json({ error: 'Failed to get invoice information' });
    }
  }
);

/**
 * @route GET /api/blockchain/invoices/:id/payment-schedule
 * @desc Get payment schedule
 * @access Private - Any authenticated user
 */
router.get(
  '/invoices/:id/payment-schedule',
  authMiddleware,
  [
    param('id').isNumeric().withMessage('Invoice ID must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoiceId = req.params.id;

      const result = await blockchainService.getPaymentSchedule(invoiceId);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        schedule: result.schedule
      });
    } catch (error) {
      console.error('Error getting payment schedule:', error);
      return res.status(500).json({ error: 'Failed to get payment schedule' });
    }
  }
);

/**
 * @route GET /api/blockchain/invoices/:id/risk-assessment
 * @desc Get risk assessment
 * @access Private - Any authenticated user
 */
router.get(
  '/invoices/:id/risk-assessment',
  authMiddleware,
  [
    param('id').isNumeric().withMessage('Invoice ID must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoiceId = req.params.id;

      const result = await blockchainService.getRiskAssessment(invoiceId);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        assessment: result.assessment
      });
    } catch (error) {
      console.error('Error getting risk assessment:', error);
      return res.status(500).json({ error: 'Failed to get risk assessment' });
    }
  }
);

/**
 * @route GET /api/blockchain/users/:address
 * @desc Get user status
 * @access Private - Admin role or self
 */
router.get(
  '/users/:address',
  authMiddleware,
  [
    param('address').notEmpty().withMessage('User address is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userAddress = req.params.address;
      
      // Check if user is admin or self
      if (req.user.role !== 'admin' && req.user.address.toLowerCase() !== userAddress.toLowerCase()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const result = await blockchainService.getUserStatus(userAddress);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        user: result.status
      });
    } catch (error) {
      console.error('Error getting user status:', error);
      return res.status(500).json({ error: 'Failed to get user status' });
    }
  }
);

module.exports = router;
