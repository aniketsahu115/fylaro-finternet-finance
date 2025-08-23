const mongoose = require('mongoose');
const Invoice = require('./Invoice');
const Marketplace = require('./Marketplace');
const User = require('./User');
const Order = require('./Order');
const Payment = require('./Payment');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  timeframe: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'daily'
  },
  
  periodStart: {
    type: Date,
    required: true,
    index: true
  },
  
  periodEnd: {
    type: Date,
    required: true
  },
  
  metrics: {
    invoices: {
      total: {
        type: Number,
        default: 0
      },
      totalAmount: {
        type: Number,
        default: 0
      },
      tokenized: {
        type: Number,
        default: 0
      },
      tokenizedAmount: {
        type: Number,
        default: 0
      },
      sold: {
        type: Number,
        default: 0
      },
      soldAmount: {
        type: Number,
        default: 0
      },
      funded: {
        type: Number,
        default: 0
      },
      fundedAmount: {
        type: Number,
        default: 0
      },
      pending: {
        type: Number,
        default: 0
      },
      pendingAmount: {
        type: Number,
        default: 0
      },
      expired: {
        type: Number,
        default: 0
      },
      expiredAmount: {
        type: Number,
        default: 0
      }
    },
    
    investments: {
      total: {
        type: Number,
        default: 0
      },
      totalAmount: {
        type: Number,
        default: 0
      },
      active: {
        type: Number,
        default: 0
      },
      activeAmount: {
        type: Number,
        default: 0
      },
      completed: {
        type: Number,
        default: 0
      },
      completedAmount: {
        type: Number,
        default: 0
      },
      defaulted: {
        type: Number,
        default: 0
      },
      defaultedAmount: {
        type: Number,
        default: 0
      },
      avgInvestmentSize: {
        type: Number,
        default: 0
      },
      returnOnInvestment: {
        type: Number,
        default: 0
      },
      annualizedReturn: {
        type: Number,
        default: 0
      }
    },
    
    portfolio: {
      totalValue: {
        type: Number,
        default: 0
      },
      totalInvested: {
        type: Number,
        default: 0
      },
      totalReturns: {
        type: Number,
        default: 0
      },
      currentReturn: {
        type: Number,
        default: 0
      },
      returnPercentage: {
        type: Number,
        default: 0
      },
      diversification: {
        industries: {
          type: Map,
          of: Number,
          default: {}
        },
        riskLevels: {
          type: Map,
          of: Number,
          default: {}
        },
        maturities: {
          type: Map,
          of: Number,
          default: {}
        }
      }
    },
    
    cashflow: {
      inflows: {
        type: Number,
        default: 0
      },
      outflows: {
        type: Number,
        default: 0
      },
      netCashflow: {
        type: Number,
        default: 0
      },
      projectedInflows: {
        type: Number,
        default: 0
      },
      projectedOutflows: {
        type: Number,
        default: 0
      },
      projectedNet: {
        type: Number,
        default: 0
      }
    },
    
    activity: {
      logins: {
        type: Number,
        default: 0
      },
      pageViews: {
        type: Number,
        default: 0
      },
      listingViews: {
        type: Number,
        default: 0
      },
      searches: {
        type: Number,
        default: 0
      },
      downloads: {
        type: Number,
        default: 0
      },
      uploads: {
        type: Number,
        default: 0
      }
    }
  },
  
  historicalPerformance: [{
    date: Date,
    portfolioValue: Number,
    returns: Number,
    roi: Number
  }]
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ userId: 1, timeframe: 1, periodStart: 1 }, { unique: true });

// Static methods
analyticsSchema.statics.getDashboardMetrics = async function(userId, options = {}) {
  const { timeframe = '30d', userType } = options;
  
  // Convert timeframe to date range
  const endDate = new Date();
  let startDate = new Date();
  
  switch (timeframe) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'ytd':
      startDate = new Date(endDate.getFullYear(), 0, 1); // Jan 1 of current year
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }
  
  const isInvestor = userType === 'investor';
  const isIssuer = userType === 'issuer' || userType === 'business';
  
  // Get aggregated data
  const aggregations = await Promise.all([
    // For investors
    isInvestor ? Order.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: null,
        totalInvested: { $sum: '$amount' },
        totalReturns: { $sum: '$expectedReturn' },
        avgInvestmentSize: { $avg: '$amount' },
        totalInvestments: { $sum: 1 },
        activeInvestments: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        completedInvestments: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
      }}
    ]) : Promise.resolve([]),
    
    // For issuers
    isIssuer ? Invoice.aggregate([
      { $match: { issuerId: mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        tokenizedInvoices: { $sum: { $cond: [{ $eq: ['$status', 'tokenized'] }, 1, 0] } },
        tokenizedAmount: { $sum: { $cond: [{ $eq: ['$status', 'tokenized'] }, '$amount', 0] } },
        fundedInvoices: { $sum: { $cond: [{ $eq: ['$status', 'funded'] }, 1, 0] } },
        fundedAmount: { $sum: { $cond: [{ $eq: ['$status', 'funded'] }, '$amount', 0] } }
      }}
    ]) : Promise.resolve([]),
    
    // Marketplace data
    Marketplace.aggregate([
      { $match: { 
        $or: [
          { sellerId: mongoose.Types.ObjectId(userId) },
          { 'investors.userId': mongoose.Types.ObjectId(userId) }
        ],
        createdAt: { $gte: startDate, $lte: endDate }
      }},
      { $group: {
        _id: null,
        activeListings: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        fundedListings: { $sum: { $cond: [{ $eq: ['$status', 'funded'] }, 1, 0] } },
        totalListingsValue: { $sum: '$discountedAmount' },
        avgDiscount: { $avg: '$discountPercentage' },
        avgReturn: { $avg: '$annualizedReturn' }
      }}
    ]),
    
    // Payments data
    Payment.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        inflows: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
        outflows: { $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] } }
      }}
    ])
  ]);
  
  // Process historical performance data
  const historicalData = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), timeframe: 'daily', periodStart: { $gte: startDate, $lte: endDate } } },
    { $sort: { periodStart: 1 } },
    { $project: {
      date: '$periodStart',
      portfolioValue: '$metrics.portfolio.totalValue',
      returns: '$metrics.portfolio.totalReturns',
      roi: '$metrics.portfolio.returnPercentage'
    }}
  ]);
  
  // Combine results
  const investorData = aggregations[0][0] || {};
  const issuerData = aggregations[1][0] || {};
  const marketplaceData = aggregations[2][0] || {};
  const paymentsData = aggregations[3][0] || {};
  
  return {
    timeframe,
    startDate,
    endDate,
    metrics: {
      portfolio: {
        totalValue: investorData.totalInvested || 0,
        totalReturns: investorData.totalReturns || 0,
        returnPercentage: investorData.totalInvested ? 
          ((investorData.totalReturns / investorData.totalInvested) * 100).toFixed(2) : 0,
        totalInvestments: investorData.totalInvestments || 0,
        activeInvestments: investorData.activeInvestments || 0,
        completedInvestments: investorData.completedInvestments || 0,
        avgInvestmentSize: investorData.avgInvestmentSize || 0
      },
      
      invoices: {
        total: issuerData.totalInvoices || 0,
        totalAmount: issuerData.totalAmount || 0,
        tokenized: issuerData.tokenizedInvoices || 0,
        tokenizedAmount: issuerData.tokenizedAmount || 0,
        funded: issuerData.fundedInvoices || 0,
        fundedAmount: issuerData.fundedAmount || 0
      },
      
      marketplace: {
        activeListings: marketplaceData.activeListings || 0,
        fundedListings: marketplaceData.fundedListings || 0,
        totalValue: marketplaceData.totalListingsValue || 0,
        avgDiscount: marketplaceData.avgDiscount || 0,
        avgReturn: marketplaceData.avgReturn || 0
      },
      
      cashflow: {
        inflows: paymentsData.inflows || 0,
        outflows: paymentsData.outflows || 0,
        netCashflow: (paymentsData.inflows || 0) - (paymentsData.outflows || 0),
        totalPayments: paymentsData.totalPayments || 0
      }
    },
    historicalPerformance: historicalData
  };
};

analyticsSchema.statics.recordUserActivity = async function(userId, activity) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const analytics = await this.findOne({
    userId,
    timeframe: 'daily',
    periodStart: today
  });
  
  if (!analytics) {
    return this.create({
      userId,
      timeframe: 'daily',
      periodStart: today,
      periodEnd: tomorrow,
      metrics: {
        activity: {
          [activity]: 1
        }
      }
    });
  }
  
  // Increment the specific activity
  const updatePath = `metrics.activity.${activity}`;
  const update = { $inc: {} };
  update.$inc[updatePath] = 1;
  
  return this.updateOne(
    { _id: analytics._id },
    update
  );
};

analyticsSchema.statics.refreshUserAnalytics = async function(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  // Calculate different timeframes
  const timeframes = [
    { name: 'daily', days: 1 },
    { name: 'weekly', days: 7 },
    { name: 'monthly', days: 30 },
    { name: 'quarterly', days: 90 },
    { name: 'yearly', days: 365 }
  ];
  
  const now = new Date();
  
  const results = await Promise.all(timeframes.map(async (timeframe) => {
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - timeframe.days);
    
    // Get relevant data for this timeframe
    const [invoices, investments, payments] = await Promise.all([
      Invoice.find({ 
        issuerId: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      
      Order.find({
        userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      
      Payment.find({
        userId,
        createdAt: { $gte: startDate, $lte: endDate }
      })
    ]);
    
    // Calculate metrics
    const metrics = this.calculateMetrics(invoices, investments, payments, user.userType);
    
    // Update or create analytics record
    return this.findOneAndUpdate(
      {
        userId,
        timeframe: timeframe.name,
        periodStart: startDate
      },
      {
        userId,
        timeframe: timeframe.name,
        periodStart: startDate,
        periodEnd: endDate,
        metrics,
        updatedAt: now
      },
      { upsert: true, new: true }
    );
  }));
  
  return results;
};

analyticsSchema.statics.calculateMetrics = function(invoices, investments, payments, userType) {
  // Initialize metrics structure
  const metrics = {
    invoices: {
      total: 0,
      totalAmount: 0,
      tokenized: 0,
      tokenizedAmount: 0,
      sold: 0,
      soldAmount: 0,
      funded: 0,
      fundedAmount: 0,
      pending: 0,
      pendingAmount: 0,
      expired: 0,
      expiredAmount: 0
    },
    
    investments: {
      total: 0,
      totalAmount: 0,
      active: 0,
      activeAmount: 0,
      completed: 0,
      completedAmount: 0,
      defaulted: 0,
      defaultedAmount: 0,
      avgInvestmentSize: 0,
      returnOnInvestment: 0,
      annualizedReturn: 0
    },
    
    portfolio: {
      totalValue: 0,
      totalInvested: 0,
      totalReturns: 0,
      currentReturn: 0,
      returnPercentage: 0,
      diversification: {
        industries: {},
        riskLevels: {},
        maturities: {}
      }
    },
    
    cashflow: {
      inflows: 0,
      outflows: 0,
      netCashflow: 0,
      projectedInflows: 0,
      projectedOutflows: 0,
      projectedNet: 0
    },
    
    activity: {
      logins: 0,
      pageViews: 0,
      listingViews: 0,
      searches: 0,
      downloads: 0,
      uploads: 0
    }
  };
  
  // Process invoices data (for issuers)
  if (userType === 'issuer' || userType === 'business') {
    metrics.invoices.total = invoices.length;
    
    invoices.forEach(invoice => {
      metrics.invoices.totalAmount += invoice.amount;
      
      switch (invoice.status) {
        case 'tokenized':
          metrics.invoices.tokenized++;
          metrics.invoices.tokenizedAmount += invoice.amount;
          break;
        case 'sold':
          metrics.invoices.sold++;
          metrics.invoices.soldAmount += invoice.amount;
          break;
        case 'funded':
          metrics.invoices.funded++;
          metrics.invoices.fundedAmount += invoice.amount;
          break;
        case 'pending':
          metrics.invoices.pending++;
          metrics.invoices.pendingAmount += invoice.amount;
          break;
        case 'expired':
          metrics.invoices.expired++;
          metrics.invoices.expiredAmount += invoice.amount;
          break;
      }
    });
  }
  
  // Process investments data (for investors)
  if (userType === 'investor') {
    metrics.investments.total = investments.length;
    
    let totalReturns = 0;
    let totalInvested = 0;
    
    investments.forEach(investment => {
      metrics.investments.totalAmount += investment.amount;
      totalInvested += investment.amount;
      totalReturns += investment.expectedReturn || 0;
      
      switch (investment.status) {
        case 'active':
          metrics.investments.active++;
          metrics.investments.activeAmount += investment.amount;
          break;
        case 'completed':
          metrics.investments.completed++;
          metrics.investments.completedAmount += investment.amount;
          break;
        case 'defaulted':
          metrics.investments.defaulted++;
          metrics.investments.defaultedAmount += investment.amount;
          break;
      }
      
      // Update diversification metrics
      if (investment.industry) {
        metrics.portfolio.diversification.industries[investment.industry] = 
          (metrics.portfolio.diversification.industries[investment.industry] || 0) + investment.amount;
      }
      
      if (investment.riskLevel) {
        metrics.portfolio.diversification.riskLevels[investment.riskLevel] = 
          (metrics.portfolio.diversification.riskLevels[investment.riskLevel] || 0) + investment.amount;
      }
      
      // Categorize by maturity
      const daysToMaturity = investment.dueDate ? 
        Math.ceil((new Date(investment.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
      
      let maturityCategory;
      if (daysToMaturity <= 30) maturityCategory = '0-30';
      else if (daysToMaturity <= 90) maturityCategory = '31-90';
      else if (daysToMaturity <= 180) maturityCategory = '91-180';
      else maturityCategory = '180+';
      
      metrics.portfolio.diversification.maturities[maturityCategory] = 
        (metrics.portfolio.diversification.maturities[maturityCategory] || 0) + investment.amount;
    });
    
    // Calculate portfolio metrics
    metrics.investments.avgInvestmentSize = investments.length ? totalInvested / investments.length : 0;
    metrics.portfolio.totalValue = totalInvested;
    metrics.portfolio.totalInvested = totalInvested;
    metrics.portfolio.totalReturns = totalReturns;
    metrics.portfolio.currentReturn = totalReturns;
    metrics.portfolio.returnPercentage = totalInvested ? (totalReturns / totalInvested) * 100 : 0;
    
    // Calculate annualized return (simplified)
    const avgInvestmentDays = 60; // Default assumption if actual data not available
    metrics.investments.annualizedReturn = 
      metrics.portfolio.returnPercentage * (365 / avgInvestmentDays);
  }
  
  // Process payment data (for all users)
  payments.forEach(payment => {
    if (payment.amount > 0) {
      metrics.cashflow.inflows += payment.amount;
    } else {
      metrics.cashflow.outflows += Math.abs(payment.amount);
    }
  });
  
  metrics.cashflow.netCashflow = metrics.cashflow.inflows - metrics.cashflow.outflows;
  
  return metrics;
};

module.exports = mongoose.model('Analytics', analyticsSchema);
