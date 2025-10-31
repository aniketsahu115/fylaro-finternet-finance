const crypto = require("crypto");
const tf = require("@tensorflow/tfjs-node");

class FraudDetection {
  constructor() {
    this.suspiciousPatterns = {
      rapidSubmissions: { threshold: 5, timeWindow: 300000 }, // 5 submissions in 5 minutes
      unusualAmounts: { minThreshold: 1000000, maxThreshold: 1000000000 }, // Very high amounts
      duplicateDocuments: { hashCache: new Map() },
      velocityThreshold: 10, // Max invoices per hour
    };

    this.userActivityCache = new Map();
    this.mlModel = null;
    this.fraudPatternHistory = [];
    this.initializeMLModel();
  }

  /**
   * Initialize Machine Learning model for fraud detection
   */
  async initializeMLModel() {
    try {
      // Create neural network for fraud pattern recognition
      this.mlModel = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [20], units: 64, activation: "relu" }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 32, activation: "relu" }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: "relu" }),
          tf.layers.dense({ units: 1, activation: "sigmoid" }), // Binary classification (fraud/not fraud)
        ],
      });

      this.mlModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: "binaryCrossentropy",
        metrics: ["accuracy"],
      });

      console.log("ML Fraud Detection Model initialized");
    } catch (error) {
      console.error("ML model initialization error:", error);
    }
  }

  async analyzeInvoice(invoiceData, userId) {
    try {
      // Run traditional rule-based checks
      const checks = await Promise.all([
        this.checkRapidSubmissions(userId),
        this.checkUnusualAmounts(invoiceData.amount),
        this.checkDuplicateDocuments(invoiceData.documentHash),
        this.checkVelocityPattern(userId),
        this.checkInvoiceValidity(invoiceData),
        this.checkUserBehavior(userId, invoiceData),
      ]);

      // Run ML-based fraud detection
      const mlAnalysis = await this.mlFraudDetection(
        invoiceData,
        userId,
        checks
      );

      const riskScore = this.calculateRiskScore(checks, mlAnalysis);
      const riskLevel = this.determineRiskLevel(riskScore);

      // Store pattern for model training
      this.storePatternForTraining(
        invoiceData,
        userId,
        checks,
        mlAnalysis,
        riskScore
      );

      return {
        riskScore,
        riskLevel,
        mlPrediction: mlAnalysis,
        flags: checks.filter((check) => check.flagged),
        passed: riskScore < 0.7,
        details: {
          rapidSubmissions: checks[0],
          unusualAmounts: checks[1],
          duplicateDocuments: checks[2],
          velocityPattern: checks[3],
          invoiceValidity: checks[4],
          userBehavior: checks[5],
        },
        recommendations: this.generateRecommendations(
          riskScore,
          checks,
          mlAnalysis
        ),
      };
    } catch (error) {
      console.error("Fraud detection error:", error);
      return {
        riskScore: 0.5,
        riskLevel: "medium",
        flags: [],
        passed: true,
        error: error.message,
      };
    }
  }

  /**
   * Machine Learning based fraud detection
   */
  async mlFraudDetection(invoiceData, userId, ruleBasedChecks) {
    try {
      if (!this.mlModel) {
        return { fraudProbability: 0.5, confidence: 0, method: "fallback" };
      }

      // Extract features for ML model
      const features = this.extractMLFeatures(
        invoiceData,
        userId,
        ruleBasedChecks
      );
      const tensorFeatures = tf.tensor2d([features]);

      // Predict fraud probability
      const prediction = this.mlModel.predict(tensorFeatures);
      const fraudProbability = (await prediction.data())[0];

      tensorFeatures.dispose();
      prediction.dispose();

      return {
        fraudProbability,
        confidence: Math.abs(fraudProbability - 0.5) * 2, // 0-1 scale
        method: "ml",
        features: this.getFeatureImportance(features),
      };
    } catch (error) {
      console.error("ML fraud detection error:", error);
      return {
        fraudProbability: 0.5,
        confidence: 0,
        method: "error",
        error: error.message,
      };
    }
  }

  /**
   * Extract features for ML model
   */
  extractMLFeatures(invoiceData, userId, ruleBasedChecks) {
    const features = [];

    // Feature 0-2: Amount-based features
    features[0] = invoiceData.amount
      ? Math.min(invoiceData.amount / 1000000, 1)
      : 0;
    features[1] = ruleBasedChecks[1]?.flagged ? 1 : 0; // Unusual amount flag
    features[2] = invoiceData.amount
      ? Math.log10(invoiceData.amount + 1) / 7
      : 0; // Log scale amount

    // Feature 3-5: Time-based features
    const userActivity = this.userActivityCache.get(userId) || [];
    features[3] = Math.min(userActivity.length / 100, 1); // User activity level
    features[4] = ruleBasedChecks[0]?.flagged ? 1 : 0; // Rapid submission flag
    features[5] = ruleBasedChecks[3]?.flagged ? 1 : 0; // Velocity pattern flag

    // Feature 6-8: Document-based features
    features[6] = ruleBasedChecks[2]?.flagged ? 1 : 0; // Duplicate document flag
    features[7] = invoiceData.documentHash ? 1 : 0; // Has document hash
    features[8] = invoiceData.ipfsHash ? 1 : 0; // Has IPFS hash

    // Feature 9-11: Validity features
    features[9] = ruleBasedChecks[4]?.flagged ? 0 : 1; // Invoice validity (inverted)
    features[10] = invoiceData.dueDate
      ? new Date(invoiceData.dueDate) > new Date()
        ? 1
        : 0
      : 0;
    features[11] = invoiceData.invoiceNumber ? 1 : 0;

    // Feature 12-14: User behavior features
    features[12] = ruleBasedChecks[5]?.flagged ? 1 : 0; // User behavior flag
    features[13] = invoiceData.debtorVerified ? 1 : 0;
    features[14] = invoiceData.previousTransactions
      ? Math.min(invoiceData.previousTransactions / 10, 1)
      : 0;

    // Feature 15-17: Business features
    features[15] = invoiceData.industry ? 1 : 0;
    features[16] = invoiceData.businessAge
      ? Math.min(invoiceData.businessAge / 10, 1)
      : 0;
    features[17] = invoiceData.creditScore
      ? invoiceData.creditScore / 850
      : 0.5;

    // Feature 18-19: Network features
    features[18] = this.calculateNetworkTrust(userId);
    features[19] = this.calculateHistoricalPerformance(userId);

    return features;
  }

  /**
   * Calculate network trust score
   */
  calculateNetworkTrust(userId) {
    // Placeholder - would integrate with user network analysis
    return 0.5;
  }

  /**
   * Calculate historical performance
   */
  calculateHistoricalPerformance(userId) {
    const userActivity = this.userActivityCache.get(userId);
    if (!userActivity || userActivity.length === 0) return 0.5;

    // Simple metric: consistent activity = higher trust
    return Math.min(userActivity.length / 50, 1);
  }

  /**
   * Get feature importance
   */
  getFeatureImportance(features) {
    const featureNames = [
      "amount_normalized",
      "unusual_amount_flag",
      "amount_log_scale",
      "user_activity_level",
      "rapid_submission_flag",
      "velocity_flag",
      "duplicate_doc_flag",
      "has_document_hash",
      "has_ipfs_hash",
      "invoice_validity",
      "valid_due_date",
      "has_invoice_number",
      "user_behavior_flag",
      "debtor_verified",
      "previous_transactions",
      "has_industry",
      "business_age",
      "credit_score",
      "network_trust",
      "historical_performance",
    ];

    return featureNames
      .map((name, i) => ({
        name,
        value: features[i],
        importance:
          features[i] > 0.7 ? "high" : features[i] > 0.3 ? "medium" : "low",
      }))
      .filter((f) => f.value > 0.1); // Only return significant features
  }

  /**
   * Store pattern for model training
   */
  storePatternForTraining(invoiceData, userId, checks, mlAnalysis, riskScore) {
    this.fraudPatternHistory.push({
      timestamp: new Date(),
      invoiceData: {
        amount: invoiceData.amount,
        industry: invoiceData.industry,
        creditScore: invoiceData.creditScore,
      },
      userId,
      checks: checks.map((c) => ({ flagged: c.flagged, reason: c.reason })),
      mlAnalysis,
      riskScore,
      label: null, // Will be labeled after manual review
    });

    // Keep only last 10000 patterns
    if (this.fraudPatternHistory.length > 10000) {
      this.fraudPatternHistory.shift();
    }
  }

  /**
   * Train model with labeled data
   */
  async trainModel(labeledData) {
    if (!this.mlModel || labeledData.length < 100) {
      console.log("Insufficient data for training");
      return;
    }

    try {
      const features = labeledData.map((d) =>
        this.extractMLFeatures(d.invoiceData, d.userId, d.checks)
      );
      const labels = labeledData.map((d) => (d.isFraud ? 1 : 0));

      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(labels, [labels.length, 1]);

      await this.mlModel.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(
                `Epoch ${epoch}: loss = ${logs.loss.toFixed(
                  4
                )}, accuracy = ${logs.acc.toFixed(4)}`
              );
            }
          },
        },
      });

      xs.dispose();
      ys.dispose();

      console.log("Model training completed");
    } catch (error) {
      console.error("Model training error:", error);
    }
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(riskScore, checks, mlAnalysis) {
    const recommendations = [];

    if (riskScore > 0.7) {
      recommendations.push("HIGH RISK: Manual review required before approval");
    } else if (riskScore > 0.5) {
      recommendations.push("MEDIUM RISK: Enhanced verification recommended");
    }

    if (mlAnalysis && mlAnalysis.fraudProbability > 0.6) {
      recommendations.push(
        `ML model indicates ${(mlAnalysis.fraudProbability * 100).toFixed(
          1
        )}% fraud probability`
      );
    }

    checks.forEach((check) => {
      if (check.flagged && check.reason) {
        recommendations.push(`Action required: ${check.reason}`);
      }
    });

    if (checks[0]?.flagged) {
      // Rapid submissions
      recommendations.push(
        "Implement cooling-off period before next submission"
      );
    }

    if (checks[2]?.flagged) {
      // Duplicate document
      recommendations.push("Verify this is not a duplicate submission");
    }

    if (checks[4]?.flagged) {
      // Invoice validity
      recommendations.push("Request additional documentation for verification");
    }

    return recommendations;
  }

  async checkRapidSubmissions(userId) {
    const now = Date.now();
    const userActivity = this.userActivityCache.get(userId) || [];

    // Clean old entries
    const recentActivity = userActivity.filter(
      (timestamp) =>
        now - timestamp < this.suspiciousPatterns.rapidSubmissions.timeWindow
    );

    const flagged =
      recentActivity.length >=
      this.suspiciousPatterns.rapidSubmissions.threshold;

    // Update cache
    recentActivity.push(now);
    this.userActivityCache.set(userId, recentActivity);

    return {
      type: "rapidSubmissions",
      flagged,
      score: flagged ? 0.8 : 0.1,
      details: {
        submissions: recentActivity.length,
        threshold: this.suspiciousPatterns.rapidSubmissions.threshold,
        timeWindow: this.suspiciousPatterns.rapidSubmissions.timeWindow,
      },
    };
  }

  async checkUnusualAmounts(amount) {
    const { minThreshold, maxThreshold } =
      this.suspiciousPatterns.unusualAmounts;
    const flagged = amount < minThreshold || amount > maxThreshold;

    return {
      type: "unusualAmounts",
      flagged,
      score: flagged ? 0.6 : 0.1,
      details: {
        amount,
        minThreshold,
        maxThreshold,
        reason:
          amount < minThreshold
            ? "amount_too_low"
            : amount > maxThreshold
            ? "amount_too_high"
            : "normal",
      },
    };
  }

  async checkDuplicateDocuments(documentHash) {
    if (!documentHash) {
      return {
        type: "duplicateDocuments",
        flagged: false,
        score: 0.1,
        details: { reason: "no_document_hash" },
      };
    }

    const hashCache = this.suspiciousPatterns.duplicateDocuments.hashCache;
    const existing = hashCache.get(documentHash);
    const flagged = !!existing;

    if (!existing) {
      hashCache.set(documentHash, {
        firstSeen: Date.now(),
        count: 1,
      });
    } else {
      existing.count++;
    }

    return {
      type: "duplicateDocuments",
      flagged,
      score: flagged ? 0.9 : 0.1,
      details: {
        documentHash: documentHash.substring(0, 16) + "...",
        duplicateCount: existing ? existing.count : 1,
        firstSeen: existing ? existing.firstSeen : Date.now(),
      },
    };
  }

  async checkVelocityPattern(userId) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const userActivity = this.userActivityCache.get(userId) || [];

    const recentActivity = userActivity.filter(
      (timestamp) => now - timestamp < oneHour
    );
    const flagged =
      recentActivity.length > this.suspiciousPatterns.velocityThreshold;

    return {
      type: "velocityPattern",
      flagged,
      score: flagged
        ? 0.7
        : Math.min(
            recentActivity.length / this.suspiciousPatterns.velocityThreshold,
            1
          ) * 0.3,
      details: {
        invoicesLastHour: recentActivity.length,
        threshold: this.suspiciousPatterns.velocityThreshold,
      },
    };
  }

  async checkInvoiceValidity(invoiceData) {
    const checks = [];

    // Check required fields
    const requiredFields = ["amount", "dueDate", "companyName"];
    const missingFields = requiredFields.filter((field) => !invoiceData[field]);

    if (missingFields.length > 0) {
      checks.push(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Check date validity
    if (invoiceData.dueDate) {
      const dueDate = new Date(invoiceData.dueDate);
      const now = new Date();
      const daysDiff = (dueDate - now) / (1000 * 60 * 60 * 24);

      if (daysDiff < 0) {
        checks.push("Invoice already overdue");
      } else if (daysDiff > 365) {
        checks.push("Due date too far in future");
      }
    }

    // Check amount validity
    if (invoiceData.amount <= 0) {
      checks.push("Invalid amount");
    }

    const flagged = checks.length > 0;

    return {
      type: "invoiceValidity",
      flagged,
      score: flagged ? 0.8 : 0.1,
      details: {
        validationErrors: checks,
        fieldsChecked: requiredFields.length,
      },
    };
  }

  async checkUserBehavior(userId, invoiceData) {
    // Simplified user behavior analysis
    const behaviorScore = Math.random() * 0.3; // Mock behavior analysis

    return {
      type: "userBehavior",
      flagged: behaviorScore > 0.7,
      score: behaviorScore,
      details: {
        behaviorScore,
        factors: [
          "account_age",
          "previous_transactions",
          "verification_status",
        ],
      },
    };
  }

  calculateRiskScore(checks) {
    const weights = {
      rapidSubmissions: 0.25,
      unusualAmounts: 0.2,
      duplicateDocuments: 0.3,
      velocityPattern: 0.15,
      invoiceValidity: 0.25,
      userBehavior: 0.15,
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
    if (riskScore >= 0.8) return "high";
    if (riskScore >= 0.5) return "medium";
    if (riskScore >= 0.3) return "low";
    return "minimal";
  }

  async getDetectionStats() {
    return {
      totalAnalyzed: this.userActivityCache.size,
      cacheSize: this.suspiciousPatterns.duplicateDocuments.hashCache.size,
      activeUsers: Array.from(this.userActivityCache.entries()).filter(
        ([_, activity]) =>
          Date.now() - Math.max(...activity) < 24 * 60 * 60 * 1000
      ).length,
    };
  }

  clearCache() {
    this.userActivityCache.clear();
    this.suspiciousPatterns.duplicateDocuments.hashCache.clear();
  }
}

module.exports = new FraudDetection();
