const tf = require("@tensorflow/tfjs-node");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const crypto = require("crypto");

/**
 * AI-Powered Document Verification Service
 * Uses machine learning for document authenticity and fraud detection
 */
class AIDocumentVerification {
  constructor() {
    this.model = null;
    this.fraudPatterns = new Map();
    this.documentTypes = {
      INVOICE: "invoice",
      BUSINESS_LICENSE: "business_license",
      TAX_DOCUMENT: "tax_document",
      BANK_STATEMENT: "bank_statement",
      ID_DOCUMENT: "id_document",
    };
    this.initializeModel();
  }

  /**
   * Initialize ML model for document classification
   */
  async initializeModel() {
    try {
      // In production, load a pre-trained model
      // For now, create a simple sequential model
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [100],
            units: 128,
            activation: "relu",
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 64, activation: "relu" }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: "relu" }),
          tf.layers.dense({ units: 5, activation: "softmax" }), // 5 document types
        ],
      });

      this.model.compile({
        optimizer: "adam",
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"],
      });

      console.log("AI Document Verification Model initialized");
    } catch (error) {
      console.error("Model initialization error:", error);
    }
  }

  /**
   * Verify document authenticity using AI
   */
  async verifyDocument(documentBuffer, documentType, metadata = {}) {
    try {
      const verification = {
        documentId: crypto.randomBytes(16).toString("hex"),
        timestamp: new Date(),
        documentType,
        authentic: false,
        confidence: 0,
        fraudScore: 0,
        checks: {},
        warnings: [],
        recommendations: [],
      };

      // Step 1: Image Quality Analysis
      verification.checks.imageQuality = await this.analyzeImageQuality(
        documentBuffer
      );

      // Step 2: OCR Text Extraction
      verification.checks.ocrAnalysis = await this.extractTextWithOCR(
        documentBuffer
      );

      // Step 3: Document Structure Analysis
      verification.checks.structureAnalysis =
        await this.analyzeDocumentStructure(
          verification.checks.ocrAnalysis.text,
          documentType
        );

      // Step 4: Fraud Pattern Detection
      verification.checks.fraudDetection = await this.detectFraudPatterns(
        documentBuffer,
        verification.checks.ocrAnalysis,
        metadata
      );

      // Step 5: ML-Based Classification
      verification.checks.mlClassification = await this.classifyDocument(
        verification.checks.ocrAnalysis.text,
        documentType
      );

      // Step 6: Metadata Consistency Check
      verification.checks.metadataConsistency = this.checkMetadataConsistency(
        metadata,
        verification.checks.ocrAnalysis
      );

      // Calculate overall scores
      verification.confidence = this.calculateConfidenceScore(
        verification.checks
      );
      verification.fraudScore = this.calculateFraudScore(verification.checks);
      verification.authentic =
        verification.confidence > 0.7 && verification.fraudScore < 0.3;

      // Generate warnings and recommendations
      verification.warnings = this.generateWarnings(verification.checks);
      verification.recommendations = this.generateRecommendations(
        verification.checks
      );

      return verification;
    } catch (error) {
      console.error("Document verification error:", error);
      throw new Error("Failed to verify document: " + error.message);
    }
  }

  /**
   * Analyze image quality metrics
   */
  async analyzeImageQuality(documentBuffer) {
    try {
      const image = sharp(documentBuffer);
      const metadata = await image.metadata();
      const stats = await image.stats();

      const quality = {
        resolution: {
          width: metadata.width,
          height: metadata.height,
          acceptable: metadata.width >= 800 && metadata.height >= 600,
        },
        sharpness: this.calculateSharpness(stats),
        brightness: this.calculateBrightness(stats),
        contrast: this.calculateContrast(stats),
        colorBalance: this.analyzeColorBalance(stats),
        fileSize: documentBuffer.length,
        format: metadata.format,
        score: 0,
      };

      // Calculate quality score (0-1)
      quality.score =
        (quality.resolution.acceptable ? 0.3 : 0) +
        (quality.sharpness > 0.6 ? 0.2 : quality.sharpness * 0.2) +
        (quality.brightness > 0.4 && quality.brightness < 0.8 ? 0.2 : 0.1) +
        (quality.contrast > 0.5 ? 0.15 : quality.contrast * 0.15) +
        (quality.colorBalance ? 0.15 : 0);

      return quality;
    } catch (error) {
      console.error("Image quality analysis error:", error);
      return { score: 0.5, error: error.message };
    }
  }

  /**
   * Calculate image sharpness
   */
  calculateSharpness(stats) {
    // Use standard deviation as proxy for sharpness
    const avgStdDev =
      stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) /
      stats.channels.length;
    return Math.min(avgStdDev / 50, 1); // Normalize to 0-1
  }

  /**
   * Calculate image brightness
   */
  calculateBrightness(stats) {
    const avgMean =
      stats.channels.reduce((sum, ch) => sum + ch.mean, 0) /
      stats.channels.length;
    return avgMean / 255; // Normalize to 0-1
  }

  /**
   * Calculate image contrast
   */
  calculateContrast(stats) {
    const maxContrast = Math.max(
      ...stats.channels.map((ch) => ch.max - ch.min)
    );
    return maxContrast / 255; // Normalize to 0-1
  }

  /**
   * Analyze color balance
   */
  analyzeColorBalance(stats) {
    if (stats.channels.length < 3) return true; // Grayscale is acceptable

    const means = stats.channels.slice(0, 3).map((ch) => ch.mean);
    const avgMean = means.reduce((a, b) => a + b) / 3;
    const variance =
      means.reduce((sum, mean) => sum + Math.pow(mean - avgMean, 2), 0) / 3;

    return variance < 500; // Acceptable color balance threshold
  }

  /**
   * Extract text using OCR
   */
  async extractTextWithOCR(documentBuffer) {
    try {
      const result = await Tesseract.recognize(documentBuffer, "eng", {
        logger: () => {}, // Suppress logs
      });

      const analysis = {
        text: result.data.text,
        confidence: result.data.confidence / 100, // Normalize to 0-1
        words: result.data.words.length,
        lines: result.data.lines.length,
        blocks: result.data.blocks.length,
        languages: result.data.languages,
        highConfidenceWords: result.data.words.filter((w) => w.confidence > 80)
          .length,
        lowConfidenceWords: result.data.words.filter((w) => w.confidence < 60)
          .length,
      };

      // Calculate text quality score
      analysis.textQuality =
        analysis.confidence * 0.5 +
        (analysis.highConfidenceWords / analysis.words) * 0.3 +
        (analysis.words > 50 ? 0.2 : analysis.words / 250);

      return analysis;
    } catch (error) {
      console.error("OCR extraction error:", error);
      return { text: "", confidence: 0, textQuality: 0, error: error.message };
    }
  }

  /**
   * Analyze document structure
   */
  async analyzeDocumentStructure(text, documentType) {
    const structure = {
      hasHeader: false,
      hasFooter: false,
      hasLogo: false,
      hasNumbers: false,
      hasDates: false,
      hasAmounts: false,
      hasAddresses: false,
      hasEmails: false,
      hasPhones: false,
      score: 0,
    };

    // Check for common patterns
    structure.hasNumbers = /\d+/.test(text);
    structure.hasDates = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text);
    structure.hasAmounts = /\$?\d+[,.]?\d*\.?\d{2}/.test(text);
    structure.hasAddresses =
      /\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)/i.test(
        text
      );
    structure.hasEmails = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(
      text
    );
    structure.hasPhones = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);

    // Document-specific structure checks
    switch (documentType) {
      case this.documentTypes.INVOICE:
        structure.hasInvoiceNumber = /invoice\s*#?\s*\d+/i.test(text);
        structure.hasDueDate = /due\s*date/i.test(text);
        structure.hasItemized = /quantity|price|total/i.test(text);
        break;

      case this.documentTypes.BUSINESS_LICENSE:
        structure.hasLicenseNumber = /license\s*#?\s*\d+/i.test(text);
        structure.hasExpiration = /expir(ation|y|es)/i.test(text);
        structure.hasAuthority = /department|authority|commission/i.test(text);
        break;

      case this.documentTypes.BANK_STATEMENT:
        structure.hasBankName = /bank|credit\s+union/i.test(text);
        structure.hasAccountNumber = /account\s*#?\s*\d+/i.test(text);
        structure.hasBalance = /balance|total/i.test(text);
        break;
    }

    // Calculate structure score
    const checks = Object.values(structure).filter(
      (v) => typeof v === "boolean"
    );
    structure.score = checks.filter((v) => v).length / checks.length;

    return structure;
  }

  /**
   * Detect fraud patterns
   */
  async detectFraudPatterns(documentBuffer, ocrAnalysis, metadata) {
    const fraudChecks = {
      duplicateSubmission: false,
      manipulatedImage: false,
      inconsistentDates: false,
      suspiciousPatterns: false,
      metadataMismatch: false,
      score: 0,
      flags: [],
    };

    try {
      // Check for duplicate submissions using image hash
      const imageHash = crypto
        .createHash("sha256")
        .update(documentBuffer)
        .digest("hex");
      fraudChecks.duplicateSubmission = this.fraudPatterns.has(imageHash);
      if (!fraudChecks.duplicateSubmission) {
        this.fraudPatterns.set(imageHash, { timestamp: new Date(), metadata });
      }

      // Check for image manipulation
      fraudChecks.manipulatedImage = await this.detectImageManipulation(
        documentBuffer
      );

      // Check for date inconsistencies
      const dates = this.extractDates(ocrAnalysis.text);
      fraudChecks.inconsistentDates = this.checkDateConsistency(
        dates,
        metadata
      );

      // Check for suspicious patterns
      fraudChecks.suspiciousPatterns = this.detectSuspiciousTextPatterns(
        ocrAnalysis.text
      );

      // Check metadata consistency
      fraudChecks.metadataMismatch = this.checkMetadataMismatch(
        metadata,
        ocrAnalysis
      );

      // Count fraud flags
      if (fraudChecks.duplicateSubmission)
        fraudChecks.flags.push("Duplicate submission detected");
      if (fraudChecks.manipulatedImage)
        fraudChecks.flags.push("Possible image manipulation");
      if (fraudChecks.inconsistentDates)
        fraudChecks.flags.push("Date inconsistencies found");
      if (fraudChecks.suspiciousPatterns)
        fraudChecks.flags.push("Suspicious text patterns");
      if (fraudChecks.metadataMismatch)
        fraudChecks.flags.push("Metadata mismatch");

      fraudChecks.score = fraudChecks.flags.length / 5; // 0-1 scale

      return fraudChecks;
    } catch (error) {
      console.error("Fraud detection error:", error);
      return fraudChecks;
    }
  }

  /**
   * Detect image manipulation
   */
  async detectImageManipulation(documentBuffer) {
    try {
      const image = sharp(documentBuffer);
      const metadata = await image.metadata();

      // Check for suspicious metadata
      const suspiciousIndicators = [
        !metadata.exif || Object.keys(metadata.exif).length === 0, // Missing EXIF data
        metadata.format === "png" && metadata.hasAlpha, // PNG with transparency (suspicious for documents)
        metadata.density && metadata.density < 72, // Very low DPI
      ];

      return suspiciousIndicators.filter(Boolean).length >= 2;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract dates from text
   */
  extractDates(text) {
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g,
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/gi,
    ];

    const dates = [];
    datePatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) dates.push(...matches);
    });

    return dates;
  }

  /**
   * Check date consistency
   */
  checkDateConsistency(dates, metadata) {
    if (dates.length === 0) return false;

    const parsedDates = dates.map((d) => new Date(d)).filter((d) => !isNaN(d));
    if (parsedDates.length === 0) return false;

    // Check for dates in the future (suspicious)
    const futureDate = parsedDates.some((d) => d > new Date());

    // Check for very old dates (suspicious for new documents)
    const veryOld = parsedDates.some((d) => d < new Date("2000-01-01"));

    return futureDate || veryOld;
  }

  /**
   * Detect suspicious text patterns
   */
  detectSuspiciousTextPatterns(text) {
    const suspiciousPatterns = [
      /\b(test|sample|dummy|fake|example)\b/i,
      /\b(xxx|000|111|999)\b/g,
      /(.)\1{5,}/, // Repeated characters
      /\b\d{10,}\b/, // Suspiciously long numbers
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Check metadata mismatch
   */
  checkMetadataMismatch(metadata, ocrAnalysis) {
    if (!metadata.expectedAmount || !ocrAnalysis.text) return false;

    // Check if expected amount matches OCR text
    const amountPattern = new RegExp(
      metadata.expectedAmount.toString().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    return !amountPattern.test(ocrAnalysis.text.replace(/,/g, ""));
  }

  /**
   * Classify document using ML
   */
  async classifyDocument(text, expectedType) {
    try {
      // Extract features from text
      const features = this.extractFeatures(text);
      const tensorFeatures = tf.tensor2d([features]);

      // Predict document type
      const prediction = this.model.predict(tensorFeatures);
      const probabilities = await prediction.data();

      const types = Object.values(this.documentTypes);
      const predictedTypeIndex = probabilities.indexOf(
        Math.max(...probabilities)
      );
      const predictedType = types[predictedTypeIndex];
      const confidence = probabilities[predictedTypeIndex];

      tensorFeatures.dispose();
      prediction.dispose();

      return {
        predictedType,
        expectedType,
        match: predictedType === expectedType,
        confidence,
        probabilities: types.reduce((obj, type, i) => {
          obj[type] = probabilities[i];
          return obj;
        }, {}),
      };
    } catch (error) {
      console.error("ML classification error:", error);
      return {
        predictedType: expectedType,
        expectedType,
        match: true,
        confidence: 0.5,
        error: error.message,
      };
    }
  }

  /**
   * Extract features for ML model
   */
  extractFeatures(text) {
    const features = new Array(100).fill(0);

    // Feature extraction (simplified for demonstration)
    const words = text.toLowerCase().split(/\s+/);

    // Word count features
    features[0] = Math.min(words.length / 1000, 1);

    // Keyword presence features (one-hot encoding)
    const keywords = {
      invoice: [1, "invoice", "bill", "payment"],
      license: [10, "license", "permit", "certificate"],
      tax: [20, "tax", "revenue", "irs"],
      bank: [30, "bank", "account", "statement"],
      id: [40, "identification", "passport", "license"],
    };

    Object.entries(keywords).forEach(([category, [index, ...terms]]) => {
      features[index] = terms.some((term) => text.toLowerCase().includes(term))
        ? 1
        : 0;
    });

    // Numeric content features
    const numbers = text.match(/\d+/g) || [];
    features[50] = Math.min(numbers.length / 50, 1);

    // Date features
    const dates = this.extractDates(text);
    features[51] = Math.min(dates.length / 10, 1);

    // Amount features
    const amounts = text.match(/\$?\d+[,.]?\d*\.?\d{2}/g) || [];
    features[52] = Math.min(amounts.length / 20, 1);

    return features;
  }

  /**
   * Check metadata consistency
   */
  checkMetadataConsistency(metadata, ocrAnalysis) {
    const consistency = {
      amountMatch: false,
      dateMatch: false,
      nameMatch: false,
      score: 0,
    };

    if (!ocrAnalysis.text) return consistency;

    const text = ocrAnalysis.text.toLowerCase();

    // Check amount
    if (metadata.amount) {
      const amountStr = metadata.amount.toString().replace(/[^0-9.]/g, "");
      consistency.amountMatch = text.includes(amountStr);
    }

    // Check dates
    if (metadata.date) {
      const dateStr = new Date(metadata.date).toLocaleDateString();
      consistency.dateMatch = text.includes(dateStr.toLowerCase());
    }

    // Check names
    if (metadata.issuerName) {
      consistency.nameMatch = text.includes(metadata.issuerName.toLowerCase());
    }

    // Calculate consistency score
    const checks = [
      consistency.amountMatch,
      consistency.dateMatch,
      consistency.nameMatch,
    ];
    consistency.score = checks.filter(Boolean).length / checks.length;

    return consistency;
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidenceScore(checks) {
    const weights = {
      imageQuality: 0.15,
      ocrAnalysis: 0.25,
      structureAnalysis: 0.2,
      fraudDetection: 0.2,
      mlClassification: 0.15,
      metadataConsistency: 0.05,
    };

    let score = 0;

    if (checks.imageQuality) {
      score += checks.imageQuality.score * weights.imageQuality;
    }

    if (checks.ocrAnalysis) {
      score += checks.ocrAnalysis.textQuality * weights.ocrAnalysis;
    }

    if (checks.structureAnalysis) {
      score += checks.structureAnalysis.score * weights.structureAnalysis;
    }

    if (checks.fraudDetection) {
      score += (1 - checks.fraudDetection.score) * weights.fraudDetection;
    }

    if (checks.mlClassification) {
      score +=
        (checks.mlClassification.match
          ? checks.mlClassification.confidence
          : 0) * weights.mlClassification;
    }

    if (checks.metadataConsistency) {
      score += checks.metadataConsistency.score * weights.metadataConsistency;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Calculate fraud score
   */
  calculateFraudScore(checks) {
    if (!checks.fraudDetection) return 0;

    return checks.fraudDetection.score;
  }

  /**
   * Generate warnings
   */
  generateWarnings(checks) {
    const warnings = [];

    if (checks.imageQuality && checks.imageQuality.score < 0.5) {
      warnings.push(
        "Poor image quality detected - may affect verification accuracy"
      );
    }

    if (checks.ocrAnalysis && checks.ocrAnalysis.confidence < 0.6) {
      warnings.push("Low text extraction confidence - document may be unclear");
    }

    if (checks.structureAnalysis && checks.structureAnalysis.score < 0.5) {
      warnings.push("Document structure incomplete or non-standard");
    }

    if (checks.fraudDetection && checks.fraudDetection.flags.length > 0) {
      warnings.push(...checks.fraudDetection.flags);
    }

    if (checks.mlClassification && !checks.mlClassification.match) {
      warnings.push(
        `Document appears to be ${checks.mlClassification.predictedType}, not ${checks.mlClassification.expectedType}`
      );
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(checks) {
    const recommendations = [];

    if (checks.imageQuality && !checks.imageQuality.resolution.acceptable) {
      recommendations.push(
        "Upload a higher resolution image (minimum 800x600)"
      );
    }

    if (checks.imageQuality && checks.imageQuality.sharpness < 0.5) {
      recommendations.push("Ensure document is in focus when capturing");
    }

    if (
      checks.ocrAnalysis &&
      checks.ocrAnalysis.lowConfidenceWords > checks.ocrAnalysis.words * 0.3
    ) {
      recommendations.push(
        "Improve lighting and contrast when capturing document"
      );
    }

    if (checks.fraudDetection && checks.fraudDetection.score > 0.3) {
      recommendations.push("Manual review recommended due to fraud indicators");
    }

    if (checks.metadataConsistency && checks.metadataConsistency.score < 0.5) {
      recommendations.push(
        "Verify that provided information matches document content"
      );
    }

    return recommendations;
  }

  /**
   * Clear fraud pattern cache (call periodically)
   */
  clearFraudPatternCache(olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    for (const [hash, data] of this.fraudPatterns.entries()) {
      if (data.timestamp < cutoffDate) {
        this.fraudPatterns.delete(hash);
      }
    }
  }
}

module.exports = AIDocumentVerification;
