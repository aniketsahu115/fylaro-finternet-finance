const mongoose = require('mongoose');

const CreditScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true
  },
  currentScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1000,
    default: 500
  },
  scoreHistory: [{
    score: Number,
    timestamp: { type: Date, default: Date.now },
    reason: String,
    factors: [{
      name: String,
      value: Number,
      weight: Number,
      impact: Number
    }]
  }],
  riskCategory: {
    type: String,
    enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
    default: 'medium'
  },
  businessProfile: {
    industry: {
      type: String,
      required: true
    },
    businessAge: {
      months: { type: Number, min: 0 },
      category: { type: String, enum: ['startup', 'established', 'mature'] }
    },
    businessSize: {
      employees: Number,
      revenue: Number,
      category: { type: String, enum: ['micro', 'small', 'medium', 'large'] }
    },
    registrationInfo: {
      country: String,
      registrationNumber: String,
      taxId: String,
      isVerified: { type: Boolean, default: false }
    }
  },
  paymentHistory: {
    totalInvoices: { type: Number, default: 0 },
    paidOnTime: { type: Number, default: 0 },
    paidLate: { type: Number, default: 0 },
    defaulted: { type: Number, default: 0 },
    avgPaymentDelay: { type: Number, default: 0 }, // in days
    totalVolume: { type: Number, default: 0 },
    avgInvoiceValue: { type: Number, default: 0 },
    largestInvoice: { type: Number, default: 0 },
    paymentMethods: [{
      method: String,
      frequency: Number,
      reliability: Number
    }]
  },
  financialMetrics: {
    cashFlow: {
      monthly: Number,
      trend: { type: String, enum: ['improving', 'stable', 'declining'] },
      volatility: Number
    },
    debtToRevenue: Number,
    profitMargin: Number,
    liquidityRatio: Number,
    creditUtilization: Number,
    bankingRelationship: {
      yearsWithBank: Number,
      accountTypes: [String],
      overdrafts: { count: Number, amount: Number }
    }
  },
  scoringFactors: {
    paymentReliability: {
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 35 },
      details: {
        onTimePaymentRate: Number,
        avgDelayDays: Number,
        recentTrend: String
      }
    },
    businessStability: {
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 25 },
      details: {
        businessAge: Number,
        industryStability: Number,
        registrationStatus: String
      }
    },
    financialHealth: {
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 20 },
      details: {
        cashFlowStability: Number,
        debtRatio: Number,
        profitability: Number
      }
    },
    transactionVolume: {
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 15 },
      details: {
        totalVolume: Number,
        frequencyScore: Number,
        growthTrend: String
      }
    },
    externalFactors: {
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 5 },
      details: {
        industryRisk: Number,
        economicIndicators: Number,
        geopoliticalRisk: Number
      }
    }
  },
  recommendations: [{
    type: { type: String, enum: ['improvement', 'risk_mitigation', 'opportunity'] },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    title: String,
    description: String,
    actionItems: [String],
    estimatedImpact: Number, // potential score improvement
    timeframe: String,
    isCompleted: { type: Boolean, default: false },
    completedAt: Date
  }],
  alerts: [{
    type: { type: String, enum: ['score_drop', 'risk_increase', 'payment_delay', 'industry_alert'] },
    severity: { type: String, enum: ['info', 'warning', 'critical'] },
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed
  }],
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  nextReview: {
    type: Date,
    default: function() {
      const next = new Date();
      next.setDate(next.getDate() + 30);
      return next;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
CreditScoreSchema.index({ userId: 1 });
CreditScoreSchema.index({ currentScore: 1, riskCategory: 1 });
CreditScoreSchema.index({ lastCalculated: 1 });
CreditScoreSchema.index({ nextReview: 1 });
CreditScoreSchema.index({ 'businessProfile.industry': 1 });

// Virtual for score grade
CreditScoreSchema.virtual('scoreGrade').get(function() {
  const score = this.currentScore;
  if (score >= 900) return 'AAA';
  if (score >= 850) return 'AA';
  if (score >= 800) return 'A';
  if (score >= 750) return 'BBB';
  if (score >= 700) return 'BB';
  if (score >= 650) return 'B';
  if (score >= 600) return 'CCC';
  if (score >= 550) return 'CC';
  return 'C';
});

// Virtual for payment reliability percentage
CreditScoreSchema.virtual('paymentReliabilityRate').get(function() {
  const total = this.paymentHistory.totalInvoices;
  if (total === 0) return 0;
  return Math.round((this.paymentHistory.paidOnTime / total) * 100);
});

// Virtual for score trend
CreditScoreSchema.virtual('scoreTrend').get(function() {
  if (this.scoreHistory.length < 2) return 'stable';
  
  const recent = this.scoreHistory.slice(-3);
  const current = recent[recent.length - 1].score;
  const previous = recent[0].score;
  
  const change = current - previous;
  if (change > 20) return 'improving';
  if (change < -20) return 'declining';
  return 'stable';
});

// Pre-save middleware
CreditScoreSchema.pre('save', function(next) {
  // Update risk category based on score
  if (this.currentScore >= 800) this.riskCategory = 'very_low';
  else if (this.currentScore >= 700) this.riskCategory = 'low';
  else if (this.currentScore >= 600) this.riskCategory = 'medium';
  else if (this.currentScore >= 500) this.riskCategory = 'high';
  else this.riskCategory = 'very_high';
  
  // Set next review date
  const next_review = new Date();
  next_review.setDate(next_review.getDate() + 30);
  this.nextReview = next_review;
  
  next();
});

// Static methods
CreditScoreSchema.statics.findDueForReview = function() {
  return this.find({
    nextReview: { $lte: new Date() },
    isActive: true
  }).populate('userId', 'name email company');
};

CreditScoreSchema.statics.getScoreDistribution = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$riskCategory',
        count: { $sum: 1 },
        avgScore: { $avg: '$currentScore' },
        minScore: { $min: '$currentScore' },
        maxScore: { $max: '$currentScore' }
      }
    }
  ]);
};

CreditScoreSchema.statics.getIndustryBenchmarks = function(industry) {
  return this.aggregate([
    { 
      $match: { 
        'businessProfile.industry': industry,
        isActive: true 
      } 
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$currentScore' },
        medianScore: { $median: '$currentScore' },
        stdDev: { $stdDevPop: '$currentScore' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Instance methods
CreditScoreSchema.methods.updateScore = function(newScore, reason, factors) {
  // Add to history
  this.scoreHistory.push({
    score: this.currentScore, // save current before updating
    reason,
    factors,
    timestamp: new Date()
  });
  
  // Update current score
  this.currentScore = Math.max(0, Math.min(1000, newScore));
  this.lastCalculated = new Date();
  
  // Generate alert if significant change
  const scoreChange = newScore - this.currentScore;
  if (Math.abs(scoreChange) > 50) {
    this.alerts.push({
      type: 'score_drop',
      severity: scoreChange < 0 ? 'warning' : 'info',
      message: `Credit score ${scoreChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(scoreChange)} points`,
      metadata: { previousScore: this.currentScore, newScore, change: scoreChange }
    });
  }
  
  return this.save();
};

CreditScoreSchema.methods.addPaymentRecord = function(amount, daysLate = 0, wasDefaulted = false) {
  this.paymentHistory.totalInvoices += 1;
  this.paymentHistory.totalVolume += amount;
  
  if (wasDefaulted) {
    this.paymentHistory.defaulted += 1;
  } else if (daysLate > 0) {
    this.paymentHistory.paidLate += 1;
    this.paymentHistory.avgPaymentDelay = 
      ((this.paymentHistory.avgPaymentDelay * (this.paymentHistory.totalInvoices - 1)) + daysLate) / 
      this.paymentHistory.totalInvoices;
  } else {
    this.paymentHistory.paidOnTime += 1;
  }
  
  this.paymentHistory.avgInvoiceValue = this.paymentHistory.totalVolume / this.paymentHistory.totalInvoices;
  this.paymentHistory.largestInvoice = Math.max(this.paymentHistory.largestInvoice, amount);
  
  return this.save();
};

CreditScoreSchema.methods.addRecommendation = function(type, priority, title, description, actionItems, estimatedImpact) {
  this.recommendations.push({
    type,
    priority,
    title,
    description,
    actionItems,
    estimatedImpact,
    timeframe: this.getRecommendationTimeframe(priority)
  });
  
  return this.save();
};

CreditScoreSchema.methods.getRecommendationTimeframe = function(priority) {
  switch (priority) {
    case 'critical': return '1-2 weeks';
    case 'high': return '1 month';
    case medium: return '2-3 months';
    default: return '3-6 months';
  }
};

CreditScoreSchema.methods.markAlertRead = function(alertId) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.isRead = true;
    return this.save();
  }
  throw new Error('Alert not found');
};

module.exports = mongoose.model('CreditScore', CreditScoreSchema);
