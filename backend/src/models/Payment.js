const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  invoiceId: {
    type: String,
    required: true,
    ref: 'Invoice'
  },
  payerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  payerInfo: {
    name: String,
    company: String,
    walletAddress: String
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['crypto', 'bank_transfer', 'credit_card', 'wire_transfer', 'ach']
  },
  transactionHash: {
    type: String,
    sparse: true // For crypto payments
  },
  blockchainNetwork: {
    type: String,
    enum: ['ethereum', 'bsc', 'polygon', 'arbitrum']
  },
  gatewayReference: {
    type: String // For traditional payment gateways
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  overdueDate: {
    type: Date
  },
  fees: {
    gateway: { type: Number, default: 0 },
    platform: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  netAmount: {
    type: Number,
    default: function() {
      return this.amount - (this.fees?.total || 0);
    }
  },
  settlement: {
    isSettled: { type: Boolean, default: false },
    settledDate: Date,
    distributionTxHash: String,
    distributions: [{
      recipientId: mongoose.Schema.Types.ObjectId,
      walletAddress: String,
      sharePercentage: Number,
      amount: Number,
      txHash: String,
      status: { type: String, enum: ['pending', 'completed', 'failed'] }
    }]
  },
  riskAssessment: {
    score: { type: Number, min: 0, max: 100 },
    factors: [{
      factor: String,
      score: Number,
      weight: Number
    }],
    recommendation: String
  },
  metadata: {
    ipfsHash: String,
    documentHash: String,
    verificationStatus: String,
    notes: String
  },
  notifications: [{
    type: { type: String, enum: ['reminder', 'overdue', 'warning', 'settlement'] },
    sentDate: Date,
    channel: { type: String, enum: ['email', 'sms', 'push', 'webhook'] },
    status: { type: String, enum: ['sent', 'delivered', 'failed'] }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
PaymentSchema.index({ invoiceId: 1, status: 1 });
PaymentSchema.index({ payerId: 1, status: 1 });
PaymentSchema.index({ dueDate: 1, status: 1 });
PaymentSchema.index({ status: 1, createdAt: 1 });
PaymentSchema.index({ transactionHash: 1 });

// Virtual for days overdue
PaymentSchema.virtual('daysOverdue').get(function() {
  if (this.status !== 'pending' || !this.dueDate) return 0;
  const today = new Date();
  const diffTime = today - this.dueDate;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Virtual for payment status classification
PaymentSchema.virtual('paymentClassification').get(function() {
  if (this.status === 'completed') return 'paid';
  if (this.daysOverdue > 90) return 'bad_debt';
  if (this.daysOverdue > 30) return 'severely_overdue';
  if (this.daysOverdue > 0) return 'overdue';
  return 'current';
});

// Virtual for recovery probability
PaymentSchema.virtual('recoveryProbability').get(function() {
  const daysOverdue = this.daysOverdue;
  if (daysOverdue === 0) return 100;
  if (daysOverdue <= 30) return 85;
  if (daysOverdue <= 60) return 65;
  if (daysOverdue <= 90) return 35;
  return 15;
});

// Pre-save middleware
PaymentSchema.pre('save', function(next) {
  // Calculate net amount
  this.netAmount = this.amount - (this.fees?.total || 0);
  
  // Set overdue date if payment is overdue
  if (this.status === 'pending' && this.dueDate < new Date() && !this.overdueDate) {
    this.overdueDate = new Date();
  }
  
  // Set paid date when status changes to completed
  if (this.status === 'completed' && !this.paidDate) {
    this.paidDate = new Date();
  }
  
  next();
});

// Static methods
PaymentSchema.statics.getOverduePayments = function(daysOverdue = 1) {
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - daysOverdue);
  
  return this.find({
    status: 'pending',
    dueDate: { $lt: overdueDate }
  }).populate('invoiceId payerId');
};

PaymentSchema.statics.getPaymentStats = function(timeframe = '30d') {
  const startDate = new Date();
  if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);
  else if (timeframe === '90d') startDate.setDate(startDate.getDate() - 90);
  else if (timeframe === '1y') startDate.setFullYear(startDate.getFullYear() - 1);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

PaymentSchema.statics.calculateCollectionRate = function(timeframe = '30d') {
  const startDate = new Date();
  if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        collectedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
          }
        }
      }
    },
    {
      $project: {
        collectionRate: {
          $multiply: [
            { $divide: ['$collectedAmount', '$totalAmount'] },
            100
          ]
        }
      }
    }
  ]);
};

// Instance methods
PaymentSchema.methods.processSettlement = async function() {
  if (this.status !== 'completed' || this.settlement.isSettled) {
    throw new Error('Payment cannot be settled');
  }
  
  // Mark as settled
  this.settlement.isSettled = true;
  this.settlement.settledDate = new Date();
  
  return this.save();
};

PaymentSchema.methods.addNotification = function(type, channel, status = 'sent') {
  this.notifications.push({
    type,
    sentDate: new Date(),
    channel,
    status
  });
  return this.save();
};

module.exports = mongoose.model('Payment', PaymentSchema);
