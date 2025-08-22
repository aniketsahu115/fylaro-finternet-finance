const express = require('express');
const Analytics = require('../models/Analytics');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const analytics = await Analytics.getDashboardMetrics(req.user.userId, {
      timeframe,
      userType: req.user.userType
    });

    res.json(analytics);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get portfolio performance
router.get('/portfolio', auth, async (req, res) => {
  try {
    const { timeframe = '30d', groupBy = 'day' } = req.query;
    
    if (req.user.userType !== 'investor') {
      return res.status(403).json({ error: 'Investor access required' });
    }

    const performance = await Analytics.getPortfolioPerformance(req.user.userId, {
      timeframe,
      groupBy
    });

    res.json(performance);
  } catch (error) {
    console.error('Portfolio analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get invoice performance (business users)
router.get('/invoices', auth, async (req, res) => {
  try {
    const { timeframe = '30d', groupBy = 'day' } = req.query;
    
    if (req.user.userType !== 'business') {
      return res.status(403).json({ error: 'Business access required' });
    }

    const performance = await Analytics.getInvoicePerformance(req.user.userId, {
      timeframe,
      groupBy
    });

    res.json(performance);
  } catch (error) {
    console.error('Invoice analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get market trends
router.get('/market-trends', async (req, res) => {
  try {
    const { timeframe = '30d', category = 'all' } = req.query;
    
    const trends = await Analytics.getMarketTrends({
      timeframe,
      category
    });

    res.json(trends);
  } catch (error) {
    console.error('Market trends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get credit score history
router.get('/credit-score', auth, async (req, res) => {
  try {
    const { timeframe = '12m' } = req.query;
    
    const creditHistory = await Analytics.getCreditScoreHistory(req.user.userId, timeframe);

    res.json(creditHistory);
  } catch (error) {
    console.error('Credit score analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get risk analytics
router.get('/risk', auth, async (req, res) => {
  try {
    const riskAnalytics = await Analytics.getRiskAnalytics(req.user.userId, {
      userType: req.user.userType
    });

    res.json(riskAnalytics);
  } catch (error) {
    console.error('Risk analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get platform-wide analytics (admin only)
router.get('/platform', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { timeframe = '30d' } = req.query;
    
    const platformAnalytics = await Analytics.getPlatformAnalytics(timeframe);

    res.json(platformAnalytics);
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export analytics data
router.get('/export', auth, async (req, res) => {
  try {
    const { format = 'csv', timeframe = '30d', type = 'portfolio' } = req.query;
    
    if (!['csv', 'json', 'xlsx'].includes(format)) {
      return res.status(400).json({ error: 'Invalid export format' });
    }

    const exportData = await Analytics.exportData(req.user.userId, {
      format,
      timeframe,
      type,
      userType: req.user.userType
    });

    res.setHeader('Content-Type', Analytics.getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="fylaro-${type}-${timeframe}.${format}"`);
    
    res.send(exportData);
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;