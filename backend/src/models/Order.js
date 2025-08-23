const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  tradingPair: {
    type: String,
    required: true,
    index: true
  },
  invoiceId: {
    type: String,
    required: true,
    ref: 'Invoice'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  orderType: {
    type: String,
    required: true,
    enum: ['market', 'limit', 'stop-limit']
  },
  side: {
    type: String,
    required: true,
    enum: ['buy', 'sell']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: function() {
      return this.orderType !== 'market';
    },
    min: 0
  },
  stopPrice: {
    type: Number,
    required: function() {
      return this.orderType === 'stop-limit';
    },
    min: 0
  },
  filledQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingQuantity: {
    type: Number,
    default: function() {
      return this.quantity;
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'partial', 'filled', 'cancelled', 'rejected'],
    default: 'pending'
  },
  timeInForce: {
    type: String,
    required: true,
    enum: ['GTC', 'IOC', 'FOK', 'DAY'],
    default: 'GTC'
  },
  averagePrice: {
    type: Number,
    default: 0
  },
  fees: {
    maker: { type: Number, default: 0 },
    taker: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  trades: [{
    tradeId: String,
    price: Number,
    quantity: Number,
    timestamp: Date,
    counterpartyId: mongoose.Schema.Types.ObjectId
  }],
  expiryTime: {
    type: Date,
    default: function() {
      if (this.timeInForce === 'DAY') {
        const expiry = new Date();
        expiry.setHours(23, 59, 59, 999);
        return expiry;
      }
      return null;
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
OrderSchema.index({ tradingPair: 1, side: 1, price: 1 });
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ status: 1, expiryTime: 1 });
OrderSchema.index({ createdAt: 1 });

// Virtual for order completion percentage
OrderSchema.virtual('fillPercentage').get(function() {
  return this.quantity > 0 ? (this.filledQuantity / this.quantity) * 100 : 0;
});

// Virtual for remaining value
OrderSchema.virtual('remainingValue').get(function() {
  return this.remainingQuantity * (this.price || 0);
});

// Pre-save middleware
OrderSchema.pre('save', function(next) {
  this.remainingQuantity = this.quantity - this.filledQuantity;
  
  if (this.filledQuantity >= this.quantity) {
    this.status = 'filled';
  } else if (this.filledQuantity > 0) {
    this.status = 'partial';
  }
  
  next();
});

// Static methods
OrderSchema.statics.getOrderBook = function(tradingPair, limit = 20) {
  return Promise.all([
    this.find({
      tradingPair,
      side: 'buy',
      status: { $in: ['pending', 'partial'] }
    }).sort({ price: -1 }).limit(limit),
    this.find({
      tradingPair,
      side: 'sell',
      status: { $in: ['pending', 'partial'] }
    }).sort({ price: 1 }).limit(limit)
  ]).then(([bids, asks]) => ({ bids, asks }));
};

OrderSchema.statics.findMatchingOrders = function(order) {
  const oppositeOperator = order.side === 'buy' ? '$lte' : '$gte';
  const oppositeSide = order.side === 'buy' ? 'sell' : 'buy';
  
  return this.find({
    tradingPair: order.tradingPair,
    side: oppositeSide,
    status: { $in: ['pending', 'partial'] },
    price: { [oppositeOperator]: order.price },
    userId: { $ne: order.userId }
  }).sort({ 
    price: order.side === 'buy' ? 1 : -1,
    createdAt: 1 
  });
};

module.exports = mongoose.model('Order', OrderSchema);
