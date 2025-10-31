const express = require("express");
const router = express.Router();
const multer = require("multer");
const AIDocumentVerification = require("../services/aiDocumentVerification");
const auth = require("../middleware/auth");

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."));
    }
  },
});

const aiVerification = new AIDocumentVerification();

/**
 * @route POST /api/ai-verification/verify-document
 * @desc Verify document using AI
 * @access Private
 */
router.post(
  "/verify-document",
  auth,
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No document file provided",
        });
      }

      const { documentType, metadata } = req.body;

      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: "Document type is required",
        });
      }

      // Parse metadata if provided as string
      const parsedMetadata = metadata
        ? typeof metadata === "string"
          ? JSON.parse(metadata)
          : metadata
        : {};

      // Verify document
      const verification = await aiVerification.verifyDocument(
        req.file.buffer,
        documentType,
        parsedMetadata
      );

      res.json({
        success: true,
        data: verification,
      });
    } catch (error) {
      console.error("AI verification error:", error);
      res.status(500).json({
        success: false,
        message: "Document verification failed",
        error: error.message,
      });
    }
  }
);

/**
 * @route POST /api/ai-verification/verify-invoice
 * @desc Verify invoice document with enhanced AI analysis
 * @access Private
 */
router.post(
  "/verify-invoice",
  auth,
  upload.single("invoice"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No invoice file provided",
        });
      }

      const { expectedAmount, expectedDate, expectedIssuer, invoiceNumber } =
        req.body;

      const metadata = {
        amount: expectedAmount,
        date: expectedDate,
        issuerName: expectedIssuer,
        invoiceNumber,
        userId: req.user.id,
      };

      // Verify invoice
      const verification = await aiVerification.verifyDocument(
        req.file.buffer,
        "invoice",
        metadata
      );

      // Additional invoice-specific validation
      const invoiceValidation = {
        ...verification,
        invoiceSpecific: {
          hasInvoiceNumber:
            verification.checks.structureAnalysis?.hasInvoiceNumber || false,
          hasDueDate:
            verification.checks.structureAnalysis?.hasDueDate || false,
          hasItemized:
            verification.checks.structureAnalysis?.hasItemized || false,
          amountMatches:
            verification.checks.metadataConsistency?.amountMatch || false,
        },
      };

      res.json({
        success: true,
        data: invoiceValidation,
      });
    } catch (error) {
      console.error("Invoice verification error:", error);
      res.status(500).json({
        success: false,
        message: "Invoice verification failed",
        error: error.message,
      });
    }
  }
);

/**
 * @route POST /api/ai-verification/verify-kyc-document
 * @desc Verify KYC document with AI
 * @access Private
 */
router.post(
  "/verify-kyc-document",
  auth,
  upload.single("kycDocument"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No KYC document provided",
        });
      }

      const { documentType, expectedName, expectedDOB } = req.body;

      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: "Document type is required",
        });
      }

      const metadata = {
        expectedName,
        expectedDOB,
        userId: req.user.id,
      };

      const verification = await aiVerification.verifyDocument(
        req.file.buffer,
        documentType,
        metadata
      );

      // Check if verification passed minimum requirements
      const kycPassed =
        verification.authentic &&
        verification.confidence > 0.75 &&
        verification.fraudScore < 0.25;

      res.json({
        success: true,
        data: {
          ...verification,
          kycStatus: kycPassed ? "APPROVED" : "REVIEW_REQUIRED",
          nextSteps: kycPassed
            ? ["KYC verification complete", "Proceed with account activation"]
            : [
                "Manual review required",
                "Additional documentation may be needed",
              ],
        },
      });
    } catch (error) {
      console.error("KYC verification error:", error);
      res.status(500).json({
        success: false,
        message: "KYC verification failed",
        error: error.message,
      });
    }
  }
);

/**
 * @route POST /api/ai-verification/batch-verify
 * @desc Verify multiple documents at once
 * @access Private
 */
router.post(
  "/batch-verify",
  auth,
  upload.array("documents", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No documents provided",
        });
      }

      const { documentTypes, metadata } = req.body;
      const parsedMetadata = metadata
        ? typeof metadata === "string"
          ? JSON.parse(metadata)
          : metadata
        : {};
      const parsedTypes = documentTypes
        ? typeof documentTypes === "string"
          ? JSON.parse(documentTypes)
          : documentTypes
        : [];

      // Verify each document
      const verifications = await Promise.all(
        req.files.map(async (file, index) => {
          try {
            const docType = parsedTypes[index] || "invoice";
            const docMetadata = parsedMetadata[index] || {};

            const verification = await aiVerification.verifyDocument(
              file.buffer,
              docType,
              docMetadata
            );

            return {
              filename: file.originalname,
              success: true,
              verification,
            };
          } catch (error) {
            return {
              filename: file.originalname,
              success: false,
              error: error.message,
            };
          }
        })
      );

      // Calculate overall status
      const successCount = verifications.filter(
        (v) => v.success && v.verification.authentic
      ).length;
      const totalCount = verifications.length;

      res.json({
        success: true,
        data: {
          verifications,
          summary: {
            total: totalCount,
            successful: successCount,
            failed: totalCount - successCount,
            successRate: ((successCount / totalCount) * 100).toFixed(2) + "%",
          },
        },
      });
    } catch (error) {
      console.error("Batch verification error:", error);
      res.status(500).json({
        success: false,
        message: "Batch verification failed",
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/ai-verification/supported-types
 * @desc Get supported document types
 * @access Public
 */
router.get("/supported-types", (req, res) => {
  res.json({
    success: true,
    data: {
      documentTypes: [
        "invoice",
        "business_license",
        "tax_document",
        "bank_statement",
        "id_document",
      ],
      fileFormats: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
      maxFileSize: "50MB",
      features: [
        "OCR text extraction",
        "Image quality analysis",
        "Fraud pattern detection",
        "ML-based classification",
        "Metadata consistency checking",
        "Structure analysis",
      ],
    },
  });
});

/**
 * @route GET /api/ai-verification/statistics
 * @desc Get verification statistics
 * @access Private (Admin only)
 */
router.get("/statistics", auth, async (req, res) => {
  try {
    // This would query database for actual statistics
    // For now, return sample statistics
    res.json({
      success: true,
      data: {
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        averageConfidence: 0,
        averageProcessingTime: "0ms",
        topFraudFlags: [],
      },
    });
  } catch (error) {
    console.error("Statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve statistics",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/ai-verification/clear-cache
 * @desc Clear fraud pattern cache
 * @access Private (Admin only)
 */
router.post("/clear-cache", auth, async (req, res) => {
  try {
    const { olderThanDays = 30 } = req.body;

    aiVerification.clearFraudPatternCache(olderThanDays);

    res.json({
      success: true,
      message: `Cleared fraud patterns older than ${olderThanDays} days`,
    });
  } catch (error) {
    console.error("Cache clear error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache",
      error: error.message,
    });
  }
});

module.exports = router;
