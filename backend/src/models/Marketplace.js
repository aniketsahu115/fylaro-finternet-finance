const mongoose = require('mongoose');

const marketplaceSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true
  },
  
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  originalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  discountedAmount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        return value <= this.originalAmount;
      },
      message: 'Discounted amount cannot be greater than original amount'
    }
  },
  
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  minimumInvestment: {
    type: Number,
    required: true,
    min: 1,
    default: 100
  },
  
  industry: {
    type: String,
    required: true,
    enum: ['technology', 'healthcare', 'energy', 'retail', 'manufacturing', 'agriculture', 'construction', 'financial', 'other'],
    index: true
  },
  
  riskLevel: {
    type: String,
    required: true,
    enum: ['minimal', 'low', 'medium', 'high'],
    index: true
  },
  
  creditScore: {
    type: Number,
    required: true,
    min: 300,
    max: 850,
    index: true
  },
  
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  
  timeToMaturity: {
    type: Number, // Days until maturity
    required: true,
    min: 1
  },
  
  expectedReturn: {
    type: Number,
    required: true,
    min: 0
  },
  
  annualizedReturn: {
    type: Number,
    required: true,
    min: 0
  },
  
  status: {
    type: String,
    required: true,
    enum: ['active', 'funded', 'withdrawn', 'expired', 'defaulted'],
    default: 'active',
    index: true
  },
  
  totalFunded: {
    type: Number,
    default: 0,
    min: 0
  },
  
  remainingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  fundingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  numberOfInvestors: {
    type: Number,
    default: 0,
    min: 0
  },
  
  investors: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    investmentDate: {
      type: Date,
      default: Date.now
    },
    transactionId: {
      type: String,
      required: true
    }
  }],
  
  documents: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  }],
  
  companyInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    registrationNumber: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    website: {
      type: String,
      trim: true
    },
    foundedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear()
    },
    employeeCount: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-1000', '1000+']
    }
  },
  
  riskFactors: [{
    type: {
      type: String,
      required: true,
      enum: ['industry', 'credit', 'market', 'operational', 'financial']
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high']
    }
  }],
  
  financialMetrics: {
    revenue: {
      type: Number,
      min: 0
    },
    profit: {
      type: Number
    },
    debtToEquity: {
      type: Number,
      min: 0
    },
    currentRatio: {
      type: Number,
      min: 0
    },
    quickRatio: {
      type: Number,
      min: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  marketplaceMetrics: {
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    interested: {
      type: Number,
      default: 0,
      min: 0
    },
    avgInvestmentSize: {
      type: Number,
      default: 0,
      min: 0
    },
    timeToFullFunding: {
      type: Number, // Hours
      min: 0
    }
  },
  
  listingFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  platformFee: {
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      default: 2.5
    },
    amount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  autoWithdrawAt: {
    type: Date
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for query optimization
marketplaceSchema.index({ industry: 1, riskLevel: 1 });
marketplaceSchema.index({ creditScore: -1, status: 1 });
marketplaceSchema.index({ discountPercentage: -1, status: 1 });
marketplaceSchema.index({ expectedReturn: -1, status: 1 });
marketplaceSchema.index({ timeToMaturity: 1, status: 1 });
marketplaceSchema.index({ originalAmount: 1, status: 1 });
marketplaceSchema.index({ createdAt: -1, status: 1 });
marketplaceSchema.index({ featured: -1, status: 1, createdAt: -1 });
marketplaceSchema.index({ expiresAt: 1 });

// Virtual for days remaining
marketplaceSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diffTime = this.dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for funding percentage
marketplaceSchema.virtual('fundingPercentage').get(function() {
  if (this.discountedAmount === 0) return 0;
  return Math.round((this.totalFunded / this.discountedAmount) * 100);
});

// Virtual for yield calculation
marketplaceSchema.virtual('yieldPercentage').get(function() {
  if (this.discountedAmount === 0) return 0;
  return Math.round(((this.originalAmount - this.discountedAmount) / this.discountedAmount) * 100);
});

// Pre-save middleware to calculate derived fields
marketplaceSchema.pre('save', function(next) {
  // Calculate discount percentage
  if (this.originalAmount && this.discountedAmount) {
    this.discountPercentage = Math.round(((this.originalAmount - this.discountedAmount) / this.originalAmount) * 100);
  }
  
  // Calculate time to maturity
  if (this.dueDate) {
    const now = new Date();
    const diffTime = this.dueDate - now;
    this.timeToMaturity = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Calculate expected return
  if (this.originalAmount && this.discountedAmount) {
    this.expectedReturn = this.originalAmount - this.discountedAmount;
  }
  
  // Calculate annualized return
  if (this.expectedReturn && this.discountedAmount && this.timeToMaturity > 0) {
    const dailyReturn = this.expectedReturn / this.discountedAmount;
    this.annualizedReturn = Math.round((dailyReturn * 365 / this.timeToMaturity) * 100 * 100) / 100;
  }
  
  // Calculate remaining amount
  this.remainingAmount = this.discountedAmount - this.totalFunded;
  
  // Calculate funding progress
  if (this.discountedAmount > 0) {
    this.fundingProgress = Math.round((this.totalFunded / this.discountedAmount) * 100);
  }
  
  // Set expiry date if not set (default to 30 days from creation)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
  }
  
  this.lastUpdated = new Date();
  next();
});

// Static methods
marketplaceSchema.statics.findByIndustry = function(industry) {
  return this.find({ industry, status: 'active' }).sort({ createdAt: -1 });
};

marketplaceSchema.statics.findByRiskLevel = function(riskLevel) {
  return this.find({ riskLevel, status: 'active' }).sort({ expectedReturn: -1 });
};

marketplaceSchema.statics.findFeatured = function() {
  return this.find({ featured: true, status: 'active' }).sort({ createdAt: -1 });
};

marketplaceSchema.statics.getMarketStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { status: { $in: ['active', 'funded'] } } },
    {
      $group: {
        _id: null,
        totalListings: { $sum: 1 },
        totalValue: { $sum: '$originalAmount' },
        avgDiscount: { $avg: '$discountPercentage' },
        avgReturn: { $avg: '$annualizedReturn' },
        activeListings: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        fundedListings: {
          $sum: { $cond: [{ $eq: ['$status', 'funded'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalListings: 0,
    totalValue: 0,
    avgDiscount: 0,
    avgReturn: 0,
    activeListings: 0,
    fundedListings: 0
  };
};

// Instance methods
marketplaceSchema.methods.addInvestment = function(userId, amount, transactionId) {
  this.investors.push({
    userId,
    amount,
    transactionId,
    investmentDate: new Date()
  });
  
  this.totalFunded += amount;
  this.numberOfInvestors = this.investors.length;
  
  if (this.totalFunded >= this.discountedAmount) {
    this.status = 'funded';
  }
  
  return this.save();
};

marketplaceSchema.methods.incrementView = function() {
  this.marketplaceMetrics.views += 1;
  return this.save();
};

marketplaceSchema.methods.incrementInterest = function() {
  this.marketplaceMetrics.interested += 1;
  return this.save();
};

module.exports = mongoose.model('Marketplace', marketplaceSchema);
