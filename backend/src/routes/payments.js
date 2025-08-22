const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get payment status for invoice
router.get('/status/:invoiceId', auth, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const payment = await Payment.getByInvoiceId(invoiceId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check if user has access to this payment
    if (payment.payerId !== req.user.userId && 
        payment.payeeId !== req.user.userId && 
        req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initiate payment
router.post('/initiate', auth, [
  body('invoiceId').isNumeric(),
  body('amount').isNumeric().isFloat({ min: 1 }),
  body('paymentMethod').isIn(['bank_transfer', 'crypto_wallet', 'credit_card']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { invoiceId, amount, paymentMethod } = req.body;

    // Verify invoice exists and amount matches
    const invoice = await Payment.getInvoiceDetails(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (Math.abs(parseFloat(amount) - invoice.amount) > 0.01) {
      return res.status(400).json({ error: 'Payment amount does not match invoice amount' });
    }

    // Create payment record
    const paymentId = await Payment.create({
      invoiceId,
      payerId: req.user.userId,
      payeeId: invoice.sellerId,
      amount: parseFloat(amount),
      paymentMethod,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Payment initiated',
      paymentId,
      amount: parseFloat(amount),
      expectedSettlement: Payment.calculateSettlementTime(paymentMethod)
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update payment status (webhook for payment processors)
router.post('/webhook/status', [
  body('paymentId').exists(),
  body('status').isIn(['pending', 'processing', 'completed', 'failed', 'refunded']),
  body('transactionHash').optional(),
  body('processorReference').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentId, status, transactionHash, processorReference } = req.body;

    // Verify webhook signature in production
    // const signature = req.headers['x-webhook-signature'];
    // if (!verifyWebhookSignature(signature, req.body)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    await Payment.updateStatus(paymentId, {
      status,
      transactionHash,
      processorReference,
      updatedAt: new Date()
    });

    // Handle status-specific logic
    if (status === 'completed') {
      await Payment.processSuccessfulPayment(paymentId);
    } else if (status === 'failed') {
      await Payment.processFailedPayment(paymentId);
    }

    res.json({ message: 'Payment status updated' });
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's payment history
router.get('/history', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type = 'all',
      startDate,
      endDate
    } = req.query;

    const filters = {
      status,
      type, // 'sent', 'received', 'all'
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };

    const payments = await Payment.getUserHistory(req.user.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      filters
    });

    res.json(payments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get payment analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const analytics = await Payment.getAnalytics(req.user.userId, timeframe);
    
    res.json(analytics);
  } catch (error) {
    console.error('Payment analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Request payment refund
router.post('/:paymentId/refund', auth, [
  body('reason').trim().isLength({ min: 10, max: 500 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentId } = req.params;
    const { reason } = req.body;

    // Verify payment exists and user has access
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.payerId !== req.user.userId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if refund is possible
    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Payment not eligible for refund' });
    }

    const refundId = await Payment.requestRefund(paymentId, {
      requesterId: req.user.userId,
      reason,
      amount: payment.amount
    });

    res.json({
      message: 'Refund request submitted',
      refundId,
      expectedProcessingTime: '3-5 business days'
    });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Batch payment processing (admin)
router.post('/batch/process', auth, [
  body('paymentIds').isArray({ min: 1, max: 100 }),
  body('action').isIn(['approve', 'reject', 'retry']),
], async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIds, action } = req.body;

    const results = await Payment.batchProcess(paymentIds, action, req.user.userId);

    res.json({
      message: `Batch ${action} completed`,
      processed: results.successful.length,
      failed: results.failed.length,
      results
    });
  } catch (error) {
    console.error('Batch payment processing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending payments requiring attention
router.get('/pending', auth, async (req, res) => {
  try {
    const { priority = 'all' } = req.query;
    
    const pendingPayments = await Payment.getPendingPayments({
      userId: req.user.userId,
      userType: req.user.userType,
      priority
    });

    res.json(pendingPayments);
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;