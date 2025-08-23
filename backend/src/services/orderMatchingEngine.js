class OrderMatchingEngine {
  constructor(websocketService) {
    this.websocketService = websocketService;
    this.orderBooks = new Map(); // Map<tradingPair, OrderBook>
    this.pendingOrders = new Map(); // Map<orderId, Order>
    this.tradeHistory = [];
    this.priceHistory = new Map(); // Map<tradingPair, PriceData[]>
    
    this.initializeOrderBooks();
  }

  initializeOrderBooks() {
    // Initialize order books for different trading pairs
    const tradingPairs = [
      'INV-USDC', 'INV-ETH', 'INV-BTC', 
      'HEALTHCARE-USDC', 'TECH-USDC', 'ENERGY-USDC'
    ];

    tradingPairs.forEach(pair => {
      this.orderBooks.set(pair, {
        bids: [], // Buy orders (sorted by price DESC)
        asks: [], // Sell orders (sorted by price ASC)
        lastPrice: 0,
        volume24h: 0,
        priceChange24h: 0
      });
    });
  }

  /**
   * Place a new order in the order book
   */
  async placeOrder(orderData) {
    try {
      const order = this.createOrder(orderData);
      
      // Validate order
      const validation = this.validateOrder(order);
      if (!validation.valid) {
        throw new Error(validation.reason);
      }

      // Add to pending orders
      this.pendingOrders.set(order.id, order);

      // Try to match the order
      const matches = await this.matchOrder(order);

      // If not fully filled, add to order book
      if (order.remainingQuantity > 0) {
        this.addToOrderBook(order);
      }

      // Notify about order placement
      this.websocketService.notifyUser(order.userId, 'order_placed', {
        orderId: order.id,
        status: order.status,
        matches: matches.length
      });

      // Broadcast order book update
      this.broadcastOrderBookUpdate(order.tradingPair);

      return {
        orderId: order.id,
        status: order.status,
        matches,
        remainingQuantity: order.remainingQuantity
      };
    } catch (error) {
      throw new Error(`Order placement failed: ${error.message}`);
    }
  }

  createOrder(orderData) {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: orderId,
      userId: orderData.userId,
      tradingPair: orderData.tradingPair,
      type: orderData.type, // 'market', 'limit', 'stop-limit'
      side: orderData.side, // 'buy', 'sell'
      quantity: parseFloat(orderData.quantity),
      remainingQuantity: parseFloat(orderData.quantity),
      price: orderData.price ? parseFloat(orderData.price) : null,
      stopPrice: orderData.stopPrice ? parseFloat(orderData.stopPrice) : null,
      timeInForce: orderData.timeInForce || 'GTC', // 'GTC', 'IOC', 'FOK'
      status: 'pending',
      timestamp: Date.now(),
      expiresAt: this.calculateExpiration(orderData.timeInForce),
      fees: this.calculateFees(orderData),
      metadata: orderData.metadata || {}
    };
  }

  validateOrder(order) {
    // Basic validation
    if (!order.tradingPair || !this.orderBooks.has(order.tradingPair)) {
      return { valid: false, reason: 'Invalid trading pair' };
    }

    if (!['buy', 'sell'].includes(order.side)) {
      return { valid: false, reason: 'Invalid order side' };
    }

    if (!['market', 'limit', 'stop-limit'].includes(order.type)) {
      return { valid: false, reason: 'Invalid order type' };
    }

    if (order.quantity <= 0) {
      return { valid: false, reason: 'Invalid quantity' };
    }

    if (order.type === 'limit' && (!order.price || order.price <= 0)) {
      return { valid: false, reason: 'Limit orders require a valid price' };
    }

    // Check user balance (implement based on your system)
    const hasBalance = this.checkUserBalance(order);
    if (!hasBalance.valid) {
      return { valid: false, reason: hasBalance.reason };
    }

    return { valid: true };
  }

  async matchOrder(order) {
    const matches = [];
    const orderBook = this.orderBooks.get(order.tradingPair);
    
    if (order.type === 'market') {
      // Market order - match against best available prices
      const oppositeOrders = order.side === 'buy' ? orderBook.asks : orderBook.bids;
      
      for (const bookOrder of oppositeOrders) {
        if (order.remainingQuantity <= 0) break;
        
        const match = this.executeMatch(order, bookOrder);
        if (match) {
          matches.push(match);
        }
      }
    } else if (order.type === 'limit') {
      // Limit order - match if price conditions are met
      const oppositeOrders = order.side === 'buy' ? orderBook.asks : orderBook.bids;
      
      for (const bookOrder of oppositeOrders) {
        if (order.remainingQuantity <= 0) break;
        
        const canMatch = order.side === 'buy' 
          ? order.price >= bookOrder.price 
          : order.price <= bookOrder.price;
          
        if (canMatch) {
          const match = this.executeMatch(order, bookOrder);
          if (match) {
            matches.push(match);
          }
        } else {
          break; // No more matches possible due to price
        }
      }
    }

    return matches;
  }

  executeMatch(takerOrder, makerOrder) {
    const matchQuantity = Math.min(takerOrder.remainingQuantity, makerOrder.remainingQuantity);
    const matchPrice = makerOrder.price; // Maker gets price preference
    
    if (matchQuantity <= 0) return null;

    // Create trade record
    const trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tradingPair: takerOrder.tradingPair,
      buyOrderId: takerOrder.side === 'buy' ? takerOrder.id : makerOrder.id,
      sellOrderId: takerOrder.side === 'sell' ? takerOrder.id : makerOrder.id,
      buyerId: takerOrder.side === 'buy' ? takerOrder.userId : makerOrder.userId,
      sellerId: takerOrder.side === 'sell' ? takerOrder.userId : makerOrder.userId,
      quantity: matchQuantity,
      price: matchPrice,
      value: matchQuantity * matchPrice,
      takerFee: this.calculateTradingFee(matchQuantity * matchPrice, 'taker'),
      makerFee: this.calculateTradingFee(matchQuantity * matchPrice, 'maker'),
      timestamp: Date.now()
    };

    // Update order quantities
    takerOrder.remainingQuantity -= matchQuantity;
    makerOrder.remainingQuantity -= matchQuantity;

    // Update order statuses
    if (takerOrder.remainingQuantity === 0) {
      takerOrder.status = 'filled';
      this.pendingOrders.delete(takerOrder.id);
    } else {
      takerOrder.status = 'partially_filled';
    }

    if (makerOrder.remainingQuantity === 0) {
      makerOrder.status = 'filled';
      this.removeFromOrderBook(makerOrder);
      this.pendingOrders.delete(makerOrder.id);
    } else {
      makerOrder.status = 'partially_filled';
    }

    // Record the trade
    this.tradeHistory.push(trade);
    this.updatePriceHistory(takerOrder.tradingPair, matchPrice, matchQuantity);

    // Execute settlement
    this.executeTrade(trade);

    // Notify users
    this.notifyTradeExecution(trade);

    return trade;
  }

  addToOrderBook(order) {
    const orderBook = this.orderBooks.get(order.tradingPair);
    
    if (order.side === 'buy') {
      // Add to bids (sorted by price DESC)
      orderBook.bids.push(order);
      orderBook.bids.sort((a, b) => b.price - a.price);
    } else {
      // Add to asks (sorted by price ASC)  
      orderBook.asks.push(order);
      orderBook.asks.sort((a, b) => a.price - b.price);
    }

    // Limit order book depth to prevent memory issues
    orderBook.bids = orderBook.bids.slice(0, 100);
    orderBook.asks = orderBook.asks.slice(0, 100);
  }

  removeFromOrderBook(order) {
    const orderBook = this.orderBooks.get(order.tradingPair);
    
    if (order.side === 'buy') {
      orderBook.bids = orderBook.bids.filter(o => o.id !== order.id);
    } else {
      orderBook.asks = orderBook.asks.filter(o => o.id !== order.id);
    }
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderId, userId) {
    const order = this.pendingOrders.get(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized to cancel this order');
    }

    // Remove from order book
    this.removeFromOrderBook(order);
    
    // Update status
    order.status = 'cancelled';
    this.pendingOrders.delete(orderId);

    // Notify user
    this.websocketService.notifyUser(userId, 'order_cancelled', {
      orderId: order.id,
      remainingQuantity: order.remainingQuantity
    });

    // Broadcast order book update
    this.broadcastOrderBookUpdate(order.tradingPair);

    return order;
  }

  /**
   * Get current order book for a trading pair
   */
  getOrderBook(tradingPair, depth = 20) {
    const orderBook = this.orderBooks.get(tradingPair);
    
    if (!orderBook) {
      throw new Error('Trading pair not found');
    }

    return {
      tradingPair,
      bids: orderBook.bids.slice(0, depth).map(order => ({
        price: order.price,
        quantity: order.remainingQuantity,
        total: order.price * order.remainingQuantity
      })),
      asks: orderBook.asks.slice(0, depth).map(order => ({
        price: order.price,
        quantity: order.remainingQuantity,
        total: order.price * order.remainingQuantity
      })),
      lastPrice: orderBook.lastPrice,
      volume24h: orderBook.volume24h,
      priceChange24h: orderBook.priceChange24h,
      timestamp: Date.now()
    };
  }

  /**
   * Get recent trades for a trading pair
   */
  getRecentTrades(tradingPair, limit = 50) {
    return this.tradeHistory
      .filter(trade => trade.tradingPair === tradingPair)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get user's active orders
   */
  getUserOrders(userId) {
    return Array.from(this.pendingOrders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Calculate trading fees
   */
  calculateTradingFee(value, type) {
    const feeRates = {
      maker: 0.001, // 0.1%
      taker: 0.002  // 0.2%
    };
    
    return value * feeRates[type];
  }

  calculateFees(orderData) {
    const estimatedValue = orderData.quantity * (orderData.price || 0);
    return {
      estimatedTradingFee: this.calculateTradingFee(estimatedValue, 'taker'),
      gasFee: 0.01, // Estimated gas fee
      totalFees: this.calculateTradingFee(estimatedValue, 'taker') + 0.01
    };
  }

  calculateExpiration(timeInForce) {
    const now = Date.now();
    switch (timeInForce) {
      case 'IOC': // Immediate or Cancel
        return now + 1000; // 1 second
      case 'FOK': // Fill or Kill
        return now + 1000; // 1 second
      case 'GTC': // Good Till Cancelled
        return now + (30 * 24 * 60 * 60 * 1000); // 30 days
      default:
        return now + (24 * 60 * 60 * 1000); // 24 hours
    }
  }

  checkUserBalance(order) {
    // Implement balance checking logic
    // This would integrate with your wallet/balance system
    return { valid: true };
  }

  updatePriceHistory(tradingPair, price, volume) {
    if (!this.priceHistory.has(tradingPair)) {
      this.priceHistory.set(tradingPair, []);
    }
    
    const history = this.priceHistory.get(tradingPair);
    history.push({
      price,
      volume,
      timestamp: Date.now()
    });
    
    // Keep only recent history (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.priceHistory.set(
      tradingPair, 
      history.filter(h => h.timestamp > oneDayAgo)
    );

    // Update order book statistics
    const orderBook = this.orderBooks.get(tradingPair);
    orderBook.lastPrice = price;
    orderBook.volume24h = history.reduce((sum, h) => sum + h.volume, 0);
    
    // Calculate 24h price change
    const oldestPrice = history.length > 0 ? history[0].price : price;
    orderBook.priceChange24h = ((price - oldestPrice) / oldestPrice) * 100;
  }

  executeTrade(trade) {
    // Implement actual settlement logic
    // This would integrate with your blockchain settlement system
    console.log(`Executing trade: ${trade.id}`);
    
    // Update user balances
    // Transfer tokens/assets
    // Record transaction on blockchain
  }

  notifyTradeExecution(trade) {
    // Notify both parties
    this.websocketService.notifyTradeExecuted(trade.tradingPair, trade);
    
    // Update price feeds
    this.websocketService.notifyPriceUpdate(trade.tradingPair, {
      price: trade.price,
      change: this.orderBooks.get(trade.tradingPair).priceChange24h,
      volume: this.orderBooks.get(trade.tradingPair).volume24h
    });
  }

  broadcastOrderBookUpdate(tradingPair) {
    const orderBook = this.getOrderBook(tradingPair);
    this.websocketService.notifyOrderBookUpdate(tradingPair, orderBook);
  }

  /**
   * Clean up expired orders
   */
  cleanupExpiredOrders() {
    const now = Date.now();
    const expiredOrders = [];
    
    for (const [orderId, order] of this.pendingOrders) {
      if (order.expiresAt < now) {
        expiredOrders.push(order);
      }
    }
    
    expiredOrders.forEach(order => {
      this.removeFromOrderBook(order);
      this.pendingOrders.delete(order.id);
      order.status = 'expired';
      
      this.websocketService.notifyUser(order.userId, 'order_expired', {
        orderId: order.id,
        remainingQuantity: order.remainingQuantity
      });
    });
    
    return expiredOrders.length;
  }

  /**
   * Get market statistics
   */
  getMarketStats() {
    const stats = {};
    
    for (const [tradingPair, orderBook] of this.orderBooks) {
      const recentTrades = this.getRecentTrades(tradingPair, 100);
      
      stats[tradingPair] = {
        lastPrice: orderBook.lastPrice,
        volume24h: orderBook.volume24h,
        priceChange24h: orderBook.priceChange24h,
        high24h: Math.max(...recentTrades.map(t => t.price), orderBook.lastPrice),
        low24h: Math.min(...recentTrades.map(t => t.price), orderBook.lastPrice),
        bidPrice: orderBook.bids[0]?.price || 0,
        askPrice: orderBook.asks[0]?.price || 0,
        spread: orderBook.asks[0] && orderBook.bids[0] 
          ? orderBook.asks[0].price - orderBook.bids[0].price 
          : 0
      };
    }
    
    return stats;
  }

  // Start cleanup interval
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupExpiredOrders();
    }, 60000); // Check every minute
  }
}

module.exports = OrderMatchingEngine;
