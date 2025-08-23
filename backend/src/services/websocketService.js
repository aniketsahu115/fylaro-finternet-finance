const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.connectedUsers = new Map();
    this.roomSubscriptions = new Map();
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId}`);
      this.connectedUsers.set(socket.userId, socket);

      // Join user-specific room
      socket.join(`user_${socket.userId}`);

      // Handle room subscriptions
      socket.on('subscribe_to_invoice', (invoiceId) => {
        socket.join(`invoice_${invoiceId}`);
        this.addRoomSubscription(socket.userId, `invoice_${invoiceId}`);
      });

      socket.on('subscribe_to_trading', (tradingPair) => {
        socket.join(`trading_${tradingPair}`);
        this.addRoomSubscription(socket.userId, `trading_${tradingPair}`);
      });

      socket.on('subscribe_to_payments', () => {
        socket.join(`payments_${socket.userId}`);
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);
        this.removeUserSubscriptions(socket.userId);
      });

      // Send welcome message with connection status
      socket.emit('connection_established', {
        userId: socket.userId,
        timestamp: Date.now(),
        subscribedRooms: this.getUserSubscriptions(socket.userId)
      });
    });
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  }

  addRoomSubscription(userId, room) {
    if (!this.roomSubscriptions.has(userId)) {
      this.roomSubscriptions.set(userId, new Set());
    }
    this.roomSubscriptions.get(userId).add(room);
  }

  removeUserSubscriptions(userId) {
    this.roomSubscriptions.delete(userId);
  }

  getUserSubscriptions(userId) {
    return Array.from(this.roomSubscriptions.get(userId) || []);
  }

  // Invoice-related real-time events
  notifyInvoiceStatusUpdate(invoiceId, status, data) {
    this.io.to(`invoice_${invoiceId}`).emit('invoice_status_update', {
      invoiceId,
      status,
      data,
      timestamp: Date.now()
    });
  }

  notifyInvoiceVerified(invoiceId, verificationData) {
    this.io.to(`invoice_${invoiceId}`).emit('invoice_verified', {
      invoiceId,
      verificationData,
      timestamp: Date.now()
    });
  }

  notifyInvoiceTokenized(invoiceId, tokenData) {
    this.io.to(`invoice_${invoiceId}`).emit('invoice_tokenized', {
      invoiceId,
      tokenId: tokenData.tokenId,
      contractAddress: tokenData.contractAddress,
      timestamp: Date.now()
    });
  }

  // Trading-related real-time events
  notifyOrderBookUpdate(tradingPair, orderBook) {
    this.io.to(`trading_${tradingPair}`).emit('orderbook_update', {
      tradingPair,
      orderBook,
      timestamp: Date.now()
    });
  }

  notifyTradeExecuted(tradingPair, tradeData) {
    this.io.to(`trading_${tradingPair}`).emit('trade_executed', {
      tradingPair,
      tradeData,
      timestamp: Date.now()
    });

    // Notify specific users involved in the trade
    this.notifyUser(tradeData.buyerId, 'trade_executed', {
      type: 'buy',
      tradeData,
      timestamp: Date.now()
    });

    this.notifyUser(tradeData.sellerId, 'trade_executed', {
      type: 'sell',
      tradeData,
      timestamp: Date.now()
    });
  }

  notifyPriceUpdate(tradingPair, priceData) {
    this.io.to(`trading_${tradingPair}`).emit('price_update', {
      tradingPair,
      price: priceData.price,
      change: priceData.change,
      volume: priceData.volume,
      timestamp: Date.now()
    });
  }

  // Payment-related real-time events
  notifyPaymentReceived(userId, paymentData) {
    this.notifyUser(userId, 'payment_received', {
      paymentData,
      timestamp: Date.now()
    });
  }

  notifyPaymentDue(userId, invoiceData) {
    this.notifyUser(userId, 'payment_due', {
      invoiceData,
      dueDate: invoiceData.dueDate,
      timestamp: Date.now()
    });
  }

  notifyPaymentOverdue(userId, invoiceData) {
    this.notifyUser(userId, 'payment_overdue', {
      invoiceData,
      overdueAmount: invoiceData.amount,
      daysPastDue: invoiceData.daysPastDue,
      timestamp: Date.now()
    });
  }

  // Credit scoring real-time events
  notifyCreditScoreUpdate(userId, newScore, reasons) {
    this.notifyUser(userId, 'credit_score_update', {
      newScore,
      previousScore: reasons.previousScore,
      reasons,
      timestamp: Date.now()
    });
  }

  // Portfolio and investment updates
  notifyPortfolioUpdate(userId, portfolioData) {
    this.notifyUser(userId, 'portfolio_update', {
      totalValue: portfolioData.totalValue,
      dailyChange: portfolioData.dailyChange,
      positions: portfolioData.positions,
      timestamp: Date.now()
    });
  }

  // System notifications
  notifySystemMaintenance(message, scheduledTime) {
    this.io.emit('system_maintenance', {
      message,
      scheduledTime,
      timestamp: Date.now()
    });
  }

  notifySecurityAlert(userId, alertType, details) {
    this.notifyUser(userId, 'security_alert', {
      alertType,
      details,
      severity: 'high',
      timestamp: Date.now()
    });
  }

  // Generic user notification
  notifyUser(userId, eventType, data) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(eventType, data);
    }

    // Also send to user room in case they have multiple connections
    this.io.to(`user_${userId}`).emit(eventType, data);
  }

  // Broadcast to all connected users
  broadcast(eventType, data) {
    this.io.emit(eventType, {
      ...data,
      timestamp: Date.now()
    });
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      connectedUsers: Array.from(this.connectedUsers.keys()),
      totalRooms: this.io.sockets.adapter.rooms.size,
      roomSubscriptions: Object.fromEntries(this.roomSubscriptions)
    };
  }

  // Cleanup disconnected sockets
  cleanupConnections() {
    this.connectedUsers.forEach((socket, userId) => {
      if (!socket.connected) {
        this.connectedUsers.delete(userId);
        this.removeUserSubscriptions(userId);
      }
    });
  }
}

module.exports = WebSocketService;
