const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const KYC = require('../models/KYC');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for document uploads
const upload = multer({
  dest: 'uploads/kyc/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype.startsWith('image/') ||
        file.mimetype.includes('document')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, image, and document files are allowed'));
    }
  }
});

// Submit KYC application
router.post('/submit', auth, upload.fields([
  { name: 'governmentId', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'businessRegistration', maxCount: 1 },
  { name: 'financialStatements', maxCount: 3 }
]), [
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('dateOfBirth').isISO8601(),
  body('nationality').trim().isLength({ min: 2 }),
  body('address.street').trim().isLength({ min: 5 }),
  body('address.city').trim().isLength({ min: 2 }),
  body('address.country').trim().isLength({ min: 2 }),
  body('address.postalCode').trim().isLength({ min: 3 }),
  body('phoneNumber').trim().isLength({ min: 10 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      address,
      phoneNumber,
      businessName,
      businessType,
      businessRegistrationNumber,
      expectedMonthlyVolume
    } = req.body;

    // Check if user already has a KYC application
    const existingKYC = await KYC.findByUserId(req.user.userId);
    if (existingKYC && existingKYC.status === 'approved') {
      return res.status(400).json({ error: 'KYC already approved' });
    }

    // Prepare document paths
    const documents = {};
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        documents[key] = req.files[key][0].path;
      });
    }

    const kycId = await KYC.create({
      userId: req.user.userId,
      personalInfo: {
        firstName,
        lastName,
        dateOfBirth,
        nationality,
        address: JSON.parse(address),
        phoneNumber
      },
      businessInfo: req.user.userType === 'business' ? {
        businessName,
        businessType,
        businessRegistrationNumber,
        expectedMonthlyVolume: parseFloat(expectedMonthlyVolume)
      } : null,
      documents,
      status: 'pending',
      submittedAt: new Date()
    });

    res.status(201).json({
      message: 'KYC application submitted successfully',
      kycId,
      estimatedProcessingTime: '2-5 business days'
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({ error: 'Server error during KYC submission' });
  }
});

// Get KYC status
router.get('/status', auth, async (req, res) => {
  try {
    const kyc = await KYC.findByUserId(req.user.userId);
    
    if (!kyc) {
      return res.json({
        status: 'not_started',
        message: 'No KYC application found'
      });
    }

    res.json({
      status: kyc.status,
      submittedAt: kyc.submittedAt,
      reviewedAt: kyc.reviewedAt,
      rejectionReason: kyc.rejectionReason,
      expiresAt: kyc.expiresAt,
      completionPercentage: KYC.calculateCompletionPercentage(kyc)
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update KYC application
router.put('/update', auth, upload.fields([
  { name: 'governmentId', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'businessRegistration', maxCount: 1 },
  { name: 'financialStatements', maxCount: 3 }
]), async (req, res) => {
  try {
    const kyc = await KYC.findByUserId(req.user.userId);
    
    if (!kyc) {
      return res.status(404).json({ error: 'No KYC application found' });
    }

    if (kyc.status === 'approved') {
      return res.status(400).json({ error: 'Cannot update approved KYC' });
    }

    // Update documents if provided
    const updatedDocuments = { ...kyc.documents };
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        updatedDocuments[key] = req.files[key][0].path;
      });
    }

    await KYC.update(kyc.id, {
      ...req.body,
      documents: updatedDocuments,
      status: 'pending',
      updatedAt: new Date()
    });

    res.json({ message: 'KYC application updated successfully' });
  } catch (error) {
    console.error('KYC update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Review KYC applications
router.get('/admin/pending', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 20, priority = 'all' } = req.query;

    const applications = await KYC.getPendingApplications({
      page: parseInt(page),
      limit: parseInt(limit),
      priority
    });

    res.json(applications);
  } catch (error) {
    console.error('Get pending KYC error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Approve/Reject KYC
router.post('/admin/:kycId/review', auth, [
  body('decision').isIn(['approve', 'reject']),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('rejectionReason').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { kycId } = req.params;
    const { decision, notes, rejectionReason } = req.body;

    if (decision === 'reject' && !rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason required' });
    }

    await KYC.updateStatus(kycId, {
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewerId: req.user.userId,
      reviewedAt: new Date(),
      notes,
      rejectionReason: decision === 'reject' ? rejectionReason : null,
      expiresAt: decision === 'approve' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null // 1 year
    });

    // Update user verification status
    if (decision === 'approve') {
      await KYC.updateUserVerificationStatus(kycId, true);
    }

    res.json({
      message: `KYC application ${decision}d successfully`,
      decision
    });
  } catch (error) {
    console.error('KYC review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get KYC analytics
router.get('/admin/analytics', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { timeframe = '30d' } = req.query;

    const analytics = await KYC.getAnalytics(timeframe);

    res.json(analytics);
  } catch (error) {
    console.error('KYC analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;