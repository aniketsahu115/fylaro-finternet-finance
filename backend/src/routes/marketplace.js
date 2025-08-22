const express = require('express');
const { body, validationResult } = require('express-validator');
const Marketplace = require('../models/Marketplace');
const auth = require('../middleware/auth');

const router = express.Router();

// Get marketplace listings
router.get('/listings', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      industry, 
      riskLevel, 
      minAmount, 
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      industry,
      riskLevel,
      minAmount: minAmount ? parseFloat(minAmount) : null,
      maxAmount: maxAmount ? parseFloat(maxAmount) : null
    };

    const listings = await Marketplace.getListings({
      page: parseInt(page),
      limit: parseInt(limit),
      filters,
      sortBy,
      sortOrder
    });

    res.json(listings);
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single listing details
router.get('/listings/:listingId', async (req, res) => {
  try {
    const listing = await Marketplace.getListingById(req.params.listingId);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Place bid on listing
router.post('/listings/:listingId/bid', auth, [
  body('amount').isNumeric().isFloat({ min: 1 }),
  body('message').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, message } = req.body;
    const { listingId } = req.params;

    // Check if listing exists and is active
    const listing = await Marketplace.getListingById(listingId);
    if (!listing || !listing.isActive) {
      return res.status(400).json({ error: 'Listing not available' });
    }

    // Check if user is not the owner
    if (listing.sellerId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot bid on your own listing' });
    }

    // Check if bid amount is valid
    const currentHighestBid = await Marketplace.getHighestBid(listingId);
    const minimumBid = currentHighestBid ? currentHighestBid.amount + 1 : listing.minBid || 1;
    
    if (amount < minimumBid) {
      return res.status(400).json({ 
        error: `Bid must be at least $${minimumBid}`,
        minimumBid 
      });
    }

    const bidId = await Marketplace.placeBid({
      listingId,
      bidderId: req.user.userId,
      amount: parseFloat(amount),
      message
    });

    res.status(201).json({
      message: 'Bid placed successfully',
      bidId,
      amount: parseFloat(amount)
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept bid (seller only)
router.post('/listings/:listingId/accept-bid/:bidId', auth, async (req, res) => {
  try {
    const { listingId, bidId } = req.params;

    // Verify seller owns the listing
    const listing = await Marketplace.getListingById(listingId);
    if (!listing || listing.sellerId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Accept the bid
    const transaction = await Marketplace.acceptBid(listingId, bidId);

    res.json({
      message: 'Bid accepted successfully',
      transactionId: transaction.id,
      amount: transaction.amount
    });
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Buy listing at fixed price
router.post('/listings/:listingId/buy', auth, [
  body('paymentMethod').isIn(['wallet', 'bank_transfer', 'credit_card']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { listingId } = req.params;
    const { paymentMethod } = req.body;

    // Check listing availability
    const listing = await Marketplace.getListingById(listingId);
    if (!listing || !listing.isActive) {
      return res.status(400).json({ error: 'Listing not available' });
    }

    if (listing.sellerId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot buy your own listing' });
    }

    // Process purchase
    const transaction = await Marketplace.processDirectPurchase({
      listingId,
      buyerId: req.user.userId,
      amount: listing.price,
      paymentMethod
    });

    res.json({
      message: 'Purchase successful',
      transactionId: transaction.id,
      amount: transaction.amount
    });
  } catch (error) {
    console.error('Buy listing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bids
router.get('/my-bids', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const bids = await Marketplace.getUserBids(req.user.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    res.json(bids);
  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get marketplace analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const analytics = await Marketplace.getAnalytics(timeframe);
    
    res.json(analytics);
  } catch (error) {
    console.error('Marketplace analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user-specific analytics
router.get('/analytics/user', auth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const analytics = await Marketplace.getUserAnalytics(req.user.userId, timeframe);
    
    res.json(analytics);
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel listing (seller only)
router.delete('/listings/:listingId', auth, async (req, res) => {
  try {
    const { listingId } = req.params;

    // Verify ownership
    const listing = await Marketplace.getListingById(listingId);
    if (!listing || listing.sellerId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Marketplace.cancelListing(listingId);

    res.json({ message: 'Listing cancelled successfully' });
  } catch (error) {
    console.error('Cancel listing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;