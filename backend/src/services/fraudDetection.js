const crypto = require('crypto');

class FraudDetection {
  constructor() {
    this.suspiciousPatterns = {
      rapidSubmissions: { threshold: 5, timeWindow: 300000 }, // 5 submissions in 5 minutes
      unusualAmounts: { minThreshold: 1000000, maxThreshold: 1000000000 }, // Very high amounts
      duplicateDocuments: { hashCache: new Map() },
      velocityThreshold: 10 // Max invoices per hour
    };
    
    this.userActivityCache = new Map();
  }

  async analyzeInvoice(invoiceData, userId) {
    try {
      const checks = await Promise.all([
        this.checkRapidSubmissions(userId),
        this.checkUnusualAmounts(invoiceData.amount),
        this.checkDuplicateDocuments(invoiceData.documentHash),
        this.checkVelocityPattern(userId),
        this.checkInvoiceValidity(invoiceData),
        this.checkUserBehavior(userId, invoiceData)
      ]);

      const riskScore = this.calculateRiskScore(checks);
      const riskLevel = this.determineRiskLevel(riskScore);

      return {
        riskScore,
        riskLevel,
        flags: checks.filter(check => check.flagged),
        passed: riskScore < 0.7,
        details: {
          rapidSubmissions: checks[0],
          unusualAmounts: checks[1],
          duplicateDocuments: checks[2],
          velocityPattern: checks[3],
          invoiceValidity: checks[4],
          userBehavior: checks[5]
        }
      };
    } catch (error) {
      console.error('Fraud detection error:', error);
      return {
        riskScore: 0.5,
        riskLevel: 'medium',
        flags: [],
        passed: true,
        error: error.message
      };
    }
  }

  async checkRapidSubmissions(userId) {
    const now = Date.now();
    const userActivity = this.userActivityCache.get(userId) || [];
    
    // Clean old entries
    const recentActivity = userActivity.filter(
      timestamp => now - timestamp < this.suspiciousPatterns.rapidSubmissions.timeWindow
    );
    
    const flagged = recentActivity.length >= this.suspiciousPatterns.rapidSubmissions.threshold;
    
    // Update cache
    recentActivity.push(now);
    this.userActivityCache.set(userId, recentActivity);

    return {
      type: 'rapidSubmissions',
      flagged,
      score: flagged ? 0.8 : 0.1,
      details: {
        submissions: recentActivity.length,
        threshold: this.suspiciousPatterns.rapidSubmissions.threshold,
        timeWindow: this.suspiciousPatterns.rapidSubmissions.timeWindow
      }
    };
  }

  async checkUnusualAmounts(amount) {
    const { minThreshold, maxThreshold } = this.suspiciousPatterns.unusualAmounts;
    const flagged = amount < minThreshold || amount > maxThreshold;
    
    return {
      type: 'unusualAmounts',
      flagged,
      score: flagged ? 0.6 : 0.1,
      details: {
        amount,
        minThreshold,
        maxThreshold,
        reason: amount < minThreshold ? 'amount_too_low' : amount > maxThreshold ? 'amount_too_high' : 'normal'
      }
    };
  }

  async checkDuplicateDocuments(documentHash) {
    if (!documentHash) {
      return {
        type: 'duplicateDocuments',
        flagged: false,
        score: 0.1,
        details: { reason: 'no_document_hash' }
      };
    }

    const hashCache = this.suspiciousPatterns.duplicateDocuments.hashCache;
    const existing = hashCache.get(documentHash);
    const flagged = !!existing;

    if (!existing) {
      hashCache.set(documentHash, {
        firstSeen: Date.now(),
        count: 1
      });
    } else {
      existing.count++;
    }

    return {
      type: 'duplicateDocuments',
      flagged,
      score: flagged ? 0.9 : 0.1,
      details: {
        documentHash: documentHash.substring(0, 16) + '...',
        duplicateCount: existing ? existing.count : 1,
        firstSeen: existing ? existing.firstSeen : Date.now()
      }
    };
  }

  async checkVelocityPattern(userId) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const userActivity = this.userActivityCache.get(userId) || [];
    
    const recentActivity = userActivity.filter(timestamp => now - timestamp < oneHour);
    const flagged = recentActivity.length > this.suspiciousPatterns.velocityThreshold;

    return {
      type: 'velocityPattern',
      flagged,
      score: flagged ? 0.7 : Math.min(recentActivity.length / this.suspiciousPatterns.velocityThreshold, 1) * 0.3,
      details: {
        invoicesLastHour: recentActivity.length,
        threshold: this.suspiciousPatterns.velocityThreshold
      }
    };
  }

  async checkInvoiceValidity(invoiceData) {
    const checks = [];
    
    // Check required fields
    const requiredFields = ['amount', 'dueDate', 'companyName'];
    const missingFields = requiredFields.filter(field => !invoiceData[field]);
    
    if (missingFields.length > 0) {
      checks.push(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check date validity
    if (invoiceData.dueDate) {
      const dueDate = new Date(invoiceData.dueDate);
      const now = new Date();
      const daysDiff = (dueDate - now) / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 0) {
        checks.push('Invoice already overdue');
      } else if (daysDiff > 365) {
        checks.push('Due date too far in future');
      }
    }

    // Check amount validity
    if (invoiceData.amount <= 0) {
      checks.push('Invalid amount');
    }

    const flagged = checks.length > 0;

    return {
      type: 'invoiceValidity',
      flagged,
      score: flagged ? 0.8 : 0.1,
      details: {
        validationErrors: checks,
        fieldsChecked: requiredFields.length
      }
    };
  }

  async checkUserBehavior(userId, invoiceData) {
    // Simplified user behavior analysis
    const behaviorScore = Math.random() * 0.3; // Mock behavior analysis
    
    return {
      type: 'userBehavior',
      flagged: behaviorScore > 0.7,
      score: behaviorScore,
      details: {
        behaviorScore,
        factors: ['account_age', 'previous_transactions', 'verification_status']
      }
    };
  }

  calculateRiskScore(checks) {
    const weights = {
      rapidSubmissions: 0.25,
      unusualAmounts: 0.20,
      duplicateDocuments: 0.30,
      velocityPattern: 0.15,
      invoiceValidity: 0.25,
      userBehavior: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    checks.forEach((check, index) => {
      const checkTypes = Object.keys(weights);
      if (index < checkTypes.length) {
        const weight = weights[checkTypes[index]];
        totalScore += check.score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  determineRiskLevel(riskScore) {
    if (riskScore >= 0.8) return 'high';
    if (riskScore >= 0.5) return 'medium';
    if (riskScore >= 0.3) return 'low';
    return 'minimal';
  }

  async getDetectionStats() {
    return {
      totalAnalyzed: this.userActivityCache.size,
      cacheSize: this.suspiciousPatterns.duplicateDocuments.hashCache.size,
      activeUsers: Array.from(this.userActivityCache.entries()).filter(
        ([_, activity]) => Date.now() - Math.max(...activity) < 24 * 60 * 60 * 1000
      ).length
    };
  }

  clearCache() {
    this.userActivityCache.clear();
    this.suspiciousPatterns.duplicateDocuments.hashCache.clear();
  }
}

module.exports = new FraudDetection();
