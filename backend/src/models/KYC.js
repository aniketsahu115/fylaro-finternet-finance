const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'submitted', 'under_review', 'approved', 'rejected', 'expired'],
    default: 'pending',
    required: true,
    index: true
  },
  
  verificationLevel: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced', 'business'],
    default: 'basic',
    required: true
  },
  
  submissionDate: {
    type: Date,
    default: null
  },
  
  approvalDate: {
    type: Date,
    default: null
  },
  
  rejectionDate: {
    type: Date,
    default: null
  },
  
  rejectionReason: {
    type: String,
    default: null
  },
  
  expiryDate: {
    type: Date,
    default: null
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  personalInfo: {
    firstName: {
      type: String,
      trim: true
    },
    
    middleName: {
      type: String,
      trim: true
    },
    
    lastName: {
      type: String,
      trim: true
    },
    
    dob: {
      type: Date
    },
    
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    
    nationality: {
      type: String,
      trim: true
    },
    
    taxResidency: {
      type: String,
      trim: true
    },
    
    taxId: {
      type: String,
      trim: true
    }
  },
  
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    
    phoneNumber: {
      type: String,
      trim: true
    },
    
    address: {
      street: {
        type: String,
        trim: true
      },
      
      city: {
        type: String,
        trim: true
      },
      
      state: {
        type: String,
        trim: true
      },
      
      zipCode: {
        type: String,
        trim: true
      },
      
      country: {
        type: String,
        trim: true
      }
    },
    
    alternateAddress: {
      street: {
        type: String,
        trim: true
      },
      
      city: {
        type: String,
        trim: true
      },
      
      state: {
        type: String,
        trim: true
      },
      
      zipCode: {
        type: String,
        trim: true
      },
      
      country: {
        type: String,
        trim: true
      }
    }
  },
  
  identityDocuments: [{
    type: {
      type: String,
      enum: ['passport', 'national_id', 'drivers_license', 'residence_permit'],
      required: true
    },
    
    documentNumber: {
      type: String,
      required: true,
      trim: true
    },
    
    issuingCountry: {
      type: String,
      required: true,
      trim: true
    },
    
    issueDate: {
      type: Date,
      required: true
    },
    
    expiryDate: {
      type: Date,
      required: true
    },
    
    fileName: {
      type: String,
      required: true
    },
    
    fileUrl: {
      type: String,
      required: true
    },
    
    fileHash: {
      type: String,
      required: true
    },
    
    uploadDate: {
      type: Date,
      default: Date.now
    },
    
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    
    verificationNotes: {
      type: String,
      default: null
    }
  }],
  
  addressProofs: [{
    type: {
      type: String,
      enum: ['utility_bill', 'bank_statement', 'tax_statement', 'lease_agreement'],
      required: true
    },
    
    issuer: {
      type: String,
      required: true,
      trim: true
    },
    
    issueDate: {
      type: Date,
      required: true
    },
    
    fileName: {
      type: String,
      required: true
    },
    
    fileUrl: {
      type: String,
      required: true
    },
    
    fileHash: {
      type: String,
      required: true
    },
    
    uploadDate: {
      type: Date,
      default: Date.now
    },
    
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    
    verificationNotes: {
      type: String,
      default: null
    }
  }],
  
  businessInfo: {
    companyName: {
      type: String,
      trim: true
    },
    
    registrationNumber: {
      type: String,
      trim: true
    },
    
    taxId: {
      type: String,
      trim: true
    },
    
    incorporationDate: {
      type: Date
    },
    
    incorporationCountry: {
      type: String,
      trim: true
    },
    
    businessType: {
      type: String,
      enum: ['sole_proprietorship', 'partnership', 'llc', 'corporation', 'non_profit', 'other']
    },
    
    industry: {
      type: String,
      trim: true
    },
    
    businessAddress: {
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
    
    numberOfEmployees: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-1000', '1000+']
    }
  },
  
  businessDocuments: [{
    type: {
      type: String,
      enum: ['certificate_of_incorporation', 'business_license', 'articles_of_organization', 'operating_agreement', 'tax_registration'],
      required: true
    },
    
    documentNumber: {
      type: String,
      trim: true
    },
    
    issueDate: {
      type: Date
    },
    
    expiryDate: {
      type: Date
    },
    
    fileName: {
      type: String,
      required: true
    },
    
    fileUrl: {
      type: String,
      required: true
    },
    
    fileHash: {
      type: String,
      required: true
    },
    
    uploadDate: {
      type: Date,
      default: Date.now
    },
    
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    
    verificationNotes: {
      type: String
    }
  }],
  
  authorizedPersons: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    
    position: {
      type: String,
      required: true,
      trim: true
    },
    
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    
    phoneNumber: {
      type: String,
      trim: true
    },
    
    idDocumentType: {
      type: String,
      enum: ['passport', 'national_id', 'drivers_license']
    },
    
    idDocumentNumber: {
      type: String,
      trim: true
    },
    
    fileName: {
      type: String
    },
    
    fileUrl: {
      type: String
    },
    
    fileHash: {
      type: String
    }
  }],
  
  financialInfo: {
    employmentStatus: {
      type: String,
      enum: ['employed', 'self_employed', 'unemployed', 'retired', 'student', 'other']
    },
    
    employer: {
      type: String,
      trim: true
    },
    
    occupation: {
      type: String,
      trim: true
    },
    
    annualIncome: {
      type: String,
      enum: ['<25k', '25k-50k', '50k-100k', '100k-250k', '250k-1m', '>1m']
    },
    
    sourceOfFunds: {
      type: String,
      enum: ['salary', 'business_income', 'investments', 'inheritance', 'savings', 'other']
    },
    
    sourceOfFundsDescription: {
      type: String,
      trim: true
    },
    
    investmentExperience: {
      type: String,
      enum: ['none', 'limited', 'moderate', 'extensive']
    }
  },
  
  verificationChecks: {
    identityVerified: {
      type: Boolean,
      default: false
    },
    
    addressVerified: {
      type: Boolean,
      default: false
    },
    
    watchlistChecked: {
      type: Boolean,
      default: false
    },
    
    pepChecked: {
      type: Boolean,
      default: false
    },
    
    sanctionsChecked: {
      type: Boolean,
      default: false
    },
    
    enhancedDueDiligence: {
      type: Boolean,
      default: false
    },
    
    riskRating: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    
    riskJustification: {
      type: String,
      default: null
    }
  },
  
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'submitted', 'approved', 'rejected', 'additional_docs_requested', 'expired'],
      required: true
    },
    
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    notes: {
      type: String
    },
    
    ipAddress: {
      type: String
    },
    
    userAgent: {
      type: String
    }
  }],
  
  notes: [{
    content: {
      type: String,
      required: true
    },
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    createdAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    
    isInternal: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Indexes
kycSchema.index({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });
kycSchema.index({ 'contactInfo.email': 1 });
kycSchema.index({ 'businessInfo.companyName': 1 });
kycSchema.index({ verificationLevel: 1, status: 1 });
kycSchema.index({ 'verificationChecks.riskRating': 1 });

// Instance methods
kycSchema.methods.approve = function(adminUserId, notes = '') {
  this.status = 'approved';
  this.approvalDate = new Date();
  this.reviewedBy = adminUserId;
  
  // Set expiry date to 1 year from now
  this.expiryDate = new Date();
  this.expiryDate.setFullYear(this.expiryDate.getFullYear() + 1);
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'approved',
    timestamp: new Date(),
    performedBy: adminUserId,
    notes
  });
  
  return this.save();
};

kycSchema.methods.reject = function(adminUserId, reason, notes = '') {
  this.status = 'rejected';
  this.rejectionDate = new Date();
  this.rejectionReason = reason;
  this.reviewedBy = adminUserId;
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'rejected',
    timestamp: new Date(),
    performedBy: adminUserId,
    notes
  });
  
  return this.save();
};

kycSchema.methods.submit = function(userId, userAgent, ipAddress) {
  this.status = 'submitted';
  this.submissionDate = new Date();
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'submitted',
    timestamp: new Date(),
    performedBy: userId,
    ipAddress,
    userAgent
  });
  
  return this.save();
};

kycSchema.methods.requestAdditionalDocuments = function(adminUserId, message) {
  this.status = 'pending';
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'additional_docs_requested',
    timestamp: new Date(),
    performedBy: adminUserId,
    notes: message
  });
  
  // Add a note
  this.notes.push({
    content: message,
    createdBy: adminUserId,
    isInternal: false
  });
  
  return this.save();
};

// Static methods
kycSchema.statics.findPendingReviews = function() {
  return this.find({ status: 'submitted' })
    .sort({ submissionDate: 1 })
    .populate('userId', 'email firstName lastName userType');
};

kycSchema.statics.findByVerificationLevel = function(level) {
  return this.find({ verificationLevel: level, status: 'approved' })
    .sort({ approvalDate: -1 });
};

kycSchema.statics.findExpiringKYC = function(daysUntilExpiry = 30) {
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + daysUntilExpiry);
  
  return this.find({
    status: 'approved',
    expiryDate: { $lte: expiryThreshold }
  }).sort({ expiryDate: 1 });
};

kycSchema.statics.getStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

kycSchema.statics.checkUserVerificationStatus = async function(userId) {
  const kyc = await this.findOne({ userId }).sort({ approvalDate: -1 });
  
  if (!kyc) {
    return {
      isVerified: false,
      status: 'not_submitted',
      level: null,
      expiryDate: null
    };
  }
  
  return {
    isVerified: kyc.status === 'approved',
    status: kyc.status,
    level: kyc.verificationLevel,
    expiryDate: kyc.expiryDate,
    submissionDate: kyc.submissionDate,
    rejectionReason: kyc.rejectionReason
  };
};

module.exports = mongoose.model('KYC', kycSchema);
