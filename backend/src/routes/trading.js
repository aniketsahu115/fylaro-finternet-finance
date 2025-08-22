const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Get order book for a trading pair
router.get('/orderbook/:tradingPair', async (req, res) => {
  try {
    const { tradingPair } = req.params;
    const { depth = 20 } = req.query;
    
    const orderMatchingEngine = req.app.locals.orderMatchingEngine;
    const orderBook = orderMatchingEngine.getOrderBook(tradingPair, parseInt(depth));
    
    res.json(orderBook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Place a new order
router.post('/orders', auth, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      userId: req.user.id
    };
    
    const orderMatchingEngine = req.app.locals.orderMatchingEngine;
    const result = await orderMatchingEngine.placeOrder(orderData);
    
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel an order
router.delete('/orders/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const orderMatchingEngine = req.app.locals.orderMatchingEngine;
    const cancelledOrder = await orderMatchingEngine.cancelOrder(orderId, userId);
    
    res.json({ message: 'Order cancelled successfully', order: cancelledOrder });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's orders
router.get('/orders', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const orderMatchingEngine = req.app.locals.orderMatchingEngine;
    const orders = orderMatchingEngine.getUserOrders(userId);
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent trades for a trading pair
router.get('/trades/:tradingPair', async (req, res) => {
  try {
    const { tradingPair } = req.params;
    const { limit = 50 } = req.query;
    
    const orderMatchingEngine = req.app.locals.orderMatchingEngine;
    const trades = orderMatchingEngine.getRecentTrades(tradingPair, parseInt(limit));
    
    res.json(trades);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get market statistics
router.get('/markets/stats', async (req, res) => {
  try {
    const orderMatchingEngine = req.app.locals.orderMatchingEngine;
    const marketStats = orderMatchingEngine.getMarketStats();
    
    res.json(marketStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trading pairs
router.get('/pairs', async (req, res) => {
  try {
    const orderMatchingEngine = req.app.locals.orderMatchingEngine;
    const tradingPairs = Array.from(orderMatchingEngine.orderBooks.keys());
    
    res.json({
      pairs: tradingPairs,
      count: tradingPairs.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
