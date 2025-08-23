const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    unique: true
  },
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  invoiceId: {
    type: String,
    ref: 'Invoice'
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']
  },
  fileSize: {
    type: Number,
    required: true,
    max: 50 * 1024 * 1024 // 50MB max
  },
  mimeType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['invoice', 'contract', 'po', 'receipt', 'verification', 'kyc', 'other']
  },
  ipfs: {
    hash: {
      type: String,
      required: true
    },
    url: String,
    gateway: String,
    isPinned: { type: Boolean, default: false },
    pinataId: String
  },
  encryption: {
    isEncrypted: { type: Boolean, default: true },
    algorithm: { type: String, default: 'aes-256-gcm' },
    keyDerivation: { type: String, default: 'pbkdf2' },
    checksum: String // SHA-256 hash of original file
  },
  access: {
    isPublic: { type: Boolean, default: false },
    allowedUsers: [mongoose.Schema.Types.ObjectId],
    accessLinks: [{
      linkId: String,
      expiresAt: Date,
      accessCount: { type: Number, default: 0 },
      maxAccess: Number,
      isActive: { type: Boolean, default: true }
    }]
  },
  verification: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'verified', 'rejected', 'flagged'],
      default: 'pending'
    },
    verifiedBy: mongoose.Schema.Types.ObjectId,
    verifiedAt: Date,
    verificationNotes: String,
    aiAnalysis: {
      confidence: Number,
      extractedData: mongoose.Schema.Types.Mixed,
      flags: [String],
      risks: [String]
    }
  },
  metadata: {
    extractedText: String,
    pageCount: Number,
    language: String,
    businessInfo: {
      companyName: String,
      taxId: String,
      address: String,
      phoneNumber: String,
      email: String
    },
    financialData: {
      invoiceNumber: String,
      amount: Number,
      currency: String,
      dueDate: Date,
      issueDate: Date,
      taxAmount: Number
    },
    tags: [String],
    customFields: mongoose.Schema.Types.Mixed
  },
  auditTrail: [{
    action: {
      type: String,
      enum: ['upload', 'view', 'download', 'share', 'verify', 'update', 'delete']
    },
    userId: mongoose.Schema.Types.ObjectId,
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    details: String
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
DocumentSchema.index({ uploaderId: 1, status: 1 });
DocumentSchema.index({ invoiceId: 1, category: 1 });
DocumentSchema.index({ 'ipfs.hash': 1 });
DocumentSchema.index({ category: 1, createdAt: -1 });
DocumentSchema.index({ 'verification.status': 1 });
DocumentSchema.index({ 'metadata.businessInfo.companyName': 'text' });

// Virtual for file size in human readable format
DocumentSchema.virtual('fileSizeFormatted').get(function() {
  const size = this.fileSize;
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(1) + ' MB';
});

// Virtual for IPFS gateway URL
DocumentSchema.virtual('ipfsUrl').get(function() {
  if (!this.ipfs.hash) return null;
  return `https://gateway.pinata.cloud/ipfs/${this.ipfs.hash}`;
});

// Virtual for document age
DocumentSchema.virtual('age').get(function() {
  const now = new Date();
  const diffTime = now - this.createdAt;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

// Pre-save middleware
DocumentSchema.pre('save', function(next) {
  // Add audit trail entry for new documents
  if (this.isNew) {
    this.auditTrail.push({
      action: 'upload',
      userId: this.uploaderId,
      details: `Document uploaded: ${this.originalName}`
    });
  }
  
  next();
});

// Static methods
DocumentSchema.statics.findByUser = function(userId, category = null) {
  const query = { uploaderId: userId, status: 'active' };
  if (category) query.category = category;
  
  return this.find(query).sort({ createdAt: -1 });
};

DocumentSchema.statics.findPendingVerification = function() {
  return this.find({
    'verification.status': 'pending',
    status: 'active'
  }).populate('uploaderId', 'name email');
};

DocumentSchema.statics.getStorageStats = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        avgSize: { $avg: '$fileSize' }
      }
    }
  ]);
};

// Instance methods
DocumentSchema.methods.addAuditEntry = function(action, userId, details, ipAddress, userAgent) {
  this.auditTrail.push({
    action,
    userId,
    details,
    ipAddress,
    userAgent,
    timestamp: new Date()
  });
  return this.save();
};

DocumentSchema.methods.createAccessLink = function(expiresIn = 24, maxAccess = null) {
  const linkId = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresIn);
  
  this.access.accessLinks.push({
    linkId,
    expiresAt,
    maxAccess,
    accessCount: 0,
    isActive: true
  });
  
  return this.save().then(() => linkId);
};

DocumentSchema.methods.verifyDocument = function(verifierId, status, notes) {
  this.verification.status = status;
  this.verification.verifiedBy = verifierId;
  this.verification.verifiedAt = new Date();
  this.verification.verificationNotes = notes;
  
  this.addAuditEntry('verify', verifierId, `Document ${status}: ${notes}`);
  
  return this.save();
};

DocumentSchema.methods.softDelete = function() {
  this.status = 'deleted';
  return this.save();
};

module.exports = mongoose.model('Document', DocumentSchema);
