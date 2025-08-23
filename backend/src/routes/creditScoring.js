const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Calculate credit score for a user
router.post('/calculate', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceData } = req.body;

    const creditScoring = req.app.locals.creditScoring;
    const websocketService = req.app.locals.websocketService;

    const scoreBreakdown = await creditScoring.calculateCreditScore(userId, invoiceData);

    // Notify user of score calculation
    websocketService.notifyUser(userId, 'credit_score_calculated', {
      score: scoreBreakdown.finalScore,
      previousScore: req.body.previousScore || null,
      calculatedAt: new Date().toISOString()
    });

    res.json({
      message: 'Credit score calculated successfully',
      scoreBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's current credit score
router.get('/score', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current score from database (implement based on your DB)
    const currentScore = {
      score: 750, // Default or from database
      lastUpdated: new Date(),
      riskLevel: 'Low',
      trend: 'stable'
    };

    res.json(currentScore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get credit score history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '1year', limit = 50 } = req.query;

    // Get score history from database (implement based on your DB)
    const scoreHistory = [
      // Sample data structure
      {
        score: 750,
        date: new Date(),
        reason: 'Initial calculation',
        components: {
          paymentHistory: 85,
          creditUtilization: 75,
          lengthOfHistory: 60,
          typesOfCredit: 70,
          newCredit: 80
        }
      }
    ];

    res.json({
      history: scoreHistory,
      period,
      totalEntries: scoreHistory.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed score analysis
router.get('/analysis', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const creditScoring = req.app.locals.creditScoring;
    
    // Get detailed analysis without invoice-specific data
    const analysis = await creditScoring.calculateCreditScore(userId, null);

    res.json({
      analysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update credit score based on new payment
router.post('/update-payment', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentData } = req.body;

    if (!paymentData || !paymentData.amount || !paymentData.dueDate) {
      return res.status(400).json({ error: 'Invalid payment data' });
    }

    const creditScoring = req.app.locals.creditScoring;
    const websocketService = req.app.locals.websocketService;

    // Calculate impact of new payment on credit score
    const currentScore = await creditScoring.calculateCreditScore(userId);
    
    // Simulate score update based on payment performance
    const paymentImpact = calculatePaymentImpact(paymentData);
    const newScore = Math.min(850, Math.max(300, currentScore.finalScore + paymentImpact));

    // Store updated score in database (implement based on your DB)
    const scoreUpdate = {
      userId,
      previousScore: currentScore.finalScore,
      newScore,
      paymentId: paymentData.paymentId,
      impact: paymentImpact,
      updatedAt: new Date()
    };

    // Notify user of score update
    websocketService.notifyCreditScoreUpdate(userId, newScore, {
      previousScore: currentScore.finalScore,
      paymentImpact,
      paymentAmount: paymentData.amount,
      onTime: paymentData.daysLate <= 0
    });

    res.json({
      message: 'Credit score updated successfully',
      scoreUpdate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get credit improvement recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const creditScoring = req.app.locals.creditScoring;
    const analysis = await creditScoring.calculateCreditScore(userId);

    res.json({
      currentScore: analysis.finalScore,
      riskLevel: analysis.riskLevel,
      recommendations: analysis.recommendations,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate score impact of potential actions
router.post('/simulate', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { actions } = req.body;

    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ error: 'Actions array required' });
    }

    const creditScoring = req.app.locals.creditScoring;
    const currentScore = await creditScoring.calculateCreditScore(userId);

    // Simulate impact of each action
    const simulations = actions.map(action => {
      const impact = simulateActionImpact(action, currentScore);
      return {
        action: action.type,
        description: action.description,
        estimatedImpact: impact,
        newEstimatedScore: Math.min(850, Math.max(300, currentScore.finalScore + impact)),
        timeframe: action.timeframe || 'Unknown'
      };
    });

    res.json({
      currentScore: currentScore.finalScore,
      simulations,
      disclaimer: 'These are estimates and actual results may vary'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function calculatePaymentImpact(paymentData) {
  const { daysLate, amount } = paymentData;
  
  let impact = 0;
  
  if (daysLate <= 0) {
    // On-time payment - positive impact
    impact = Math.min(5, amount / 10000); // Max 5 points, scaled by amount
  } else if (daysLate <= 30) {
    // Slightly late - small negative impact
    impact = -2;
  } else if (daysLate <= 60) {
    // Moderately late - medium negative impact
    impact = -5;
  } else {
    // Very late - large negative impact
    impact = -15;
  }
  
  return impact;
}

function simulateActionImpact(action, currentScore) {
  switch (action.type) {
    case 'reduce_utilization':
      return action.reductionPercent * 2; // 2 points per percent reduction
    
    case 'pay_on_time':
      return 5; // 5 points for consistent on-time payments
    
    case 'diversify_credit':
      return 10; // 10 points for adding new credit type
    
    case 'reduce_inquiries':
      return 3; // 3 points for not applying for new credit
    
    default:
      return 0;
  }
}

module.exports = router;
