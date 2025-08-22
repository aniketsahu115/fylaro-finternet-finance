const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const { requireBusinessUser } = require('../middleware/permissions');
const creditScoring = require('../services/creditScoring');
const fraudDetection = require('../services/fraudDetection');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

// Upload and tokenize invoice
router.post('/upload', auth, requireBusinessUser, upload.single('invoiceFile'), [
  body('amount').isNumeric().isFloat({ min: 100 }),
  body('dueDate').isISO8601(),
  body('debtorName').trim().isLength({ min: 2 }),
  body('debtorEmail').isEmail().normalizeEmail(),
  body('description').trim().isLength({ min: 10 }),
  body('industry').isIn(['technology', 'healthcare', 'energy', 'retail', 'manufacturing', 'other']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      amount,
      dueDate,
      debtorName,
      debtorEmail,
      description,
      industry,
      invoiceNumber
    } = req.body;

    // Run fraud detection
    const fraudCheck = await fraudDetection.analyzeInvoice({
      amount: parseFloat(amount),
      debtorEmail,
      description,
      userId: req.user.userId,
      file: req.file
    });

    if (fraudCheck.riskScore > 0.8) {
      return res.status(400).json({ 
        error: 'Invoice failed fraud detection',
        riskFactors: fraudCheck.riskFactors 
      });
    }

    // Calculate credit score
    const creditScore = await creditScoring.calculateScore(req.user.userId);

    // Create invoice record
    const invoiceId = await Invoice.create({
      userId: req.user.userId,
      amount: parseFloat(amount),
      dueDate,
      debtorName,
      debtorEmail,
      description,
      industry,
      invoiceNumber,
      creditScore,
      fraudScore: fraudCheck.riskScore,
      status: 'pending_verification',
      filePath: req.file?.path
    });

    res.status(201).json({
      message: 'Invoice uploaded successfully',
      invoiceId,
      creditScore,
      fraudScore: fraudCheck.riskScore,
      estimatedFunding: await calculateEstimatedFunding(parseFloat(amount), creditScore)
    });
  } catch (error) {
    console.error('Invoice upload error:', error);
    res.status(500).json({ error: 'Server error during invoice upload' });
  }
});

// Get user's invoices
router.get('/my-invoices', auth, requireBusinessUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const invoices = await Invoice.findByUserId(req.user.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single invoice details
router.get('/:invoiceId', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check permissions
    if (invoice.userId !== req.user.userId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update invoice status (admin only)
router.patch('/:invoiceId/status', auth, [
  body('status').isIn(['pending_verification', 'verified', 'rejected', 'funded', 'paid']),
  body('notes').optional().trim(),
], async (req, res) => {
  try {
    // This would typically require admin permissions
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;
    
    await Invoice.updateStatus(req.params.invoiceId, status, notes);

    res.json({ message: 'Invoice status updated successfully' });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get invoice analytics
router.get('/analytics/overview', auth, requireBusinessUser, async (req, res) => {
  try {
    const analytics = await Invoice.getAnalytics(req.user.userId);
    res.json(analytics);
  } catch (error) {
    console.error('Invoice analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to calculate estimated funding
async function calculateEstimatedFunding(amount, creditScore) {
  const baseRate = 0.8; // 80% base funding rate
  const creditMultiplier = Math.min(creditScore / 1000, 1);
  const estimatedRate = baseRate * (0.7 + 0.3 * creditMultiplier);
  
  return {
    estimatedAmount: Math.round(amount * estimatedRate),
    estimatedRate: Math.round(estimatedRate * 100),
    expectedTimeframe: creditScore > 700 ? '24-48 hours' : '3-5 days'
  };
}

module.exports = router;