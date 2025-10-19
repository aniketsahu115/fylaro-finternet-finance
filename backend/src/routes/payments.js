// Payment processing routes
const express = require("express");
const { body, validationResult } = require("express-validator");
const PaymentProcessorService = require("../services/paymentProcessor");
const auth = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const router = express.Router();
const paymentProcessor = new PaymentProcessorService();

// Rate limiting for payment operations
const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 payment requests per windowMs
  message: { error: "Too many payment requests, please try again later" },
});

// Create payment intent
router.post(
  "/create-intent",
  auth,
  paymentRateLimit,
  [
    body("amount").isNumeric().isFloat({ min: 0.01 }),
    body("currency").isIn(["USD", "EUR", "GBP", "BNB", "ETH", "USDT", "USDC"]),
    body("paymentMethod").isIn([
      "crypto",
      "credit_card",
      "bank_transfer",
      "wire_transfer",
      "ach",
      "sepa",
    ]),
    body("description").optional().trim().isLength({ max: 500 }),
    body("metadata").optional().isObject(),
    body("returnUrl").optional().isURL(),
    body("webhookUrl").optional().isURL(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const paymentData = {
        ...req.body,
        userId: req.user.userId,
      };

      const result = await paymentProcessor.createPaymentIntent(paymentData);

      res.status(201).json({
        success: true,
        message: "Payment intent created successfully",
        data: result,
      });
    } catch (error) {
      console.error("Create payment intent error:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Process payment
router.post(
  "/process/:paymentId",
  auth,
  paymentRateLimit,
  [
    body("transactionHash").optional().trim(),
    body("blockNumber").optional().isNumeric(),
    body("reference").optional().trim(),
    body("paymentMethodData").optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { paymentId } = req.params;
      const paymentData = req.body;

      const result = await paymentProcessor.processPayment(
        paymentId,
        paymentData
      );

      res.json({
        success: true,
        message: "Payment processed successfully",
        data: result,
      });
    } catch (error) {
      console.error("Process payment error:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get payment status
router.get("/status/:paymentId", auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const status = paymentProcessor.getPaymentStatus(paymentId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// Get payment history
router.get("/history", auth, async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      currency,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {
      status,
      paymentMethod,
      currency,
      startDate,
      endDate,
    };

    const history = paymentProcessor.getPaymentHistory(filters);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = history.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        payments: paginatedHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: history.length,
          pages: Math.ceil(history.length / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve payment history",
    });
  }
});

// Create escrow account
router.post(
  "/escrow/create",
  auth,
  [
    body("invoiceId").isMongoId(),
    body("amount").isNumeric().isFloat({ min: 0.01 }),
    body("currency").isIn(["USD", "EUR", "GBP", "BNB", "ETH", "USDT", "USDC"]),
    body("parties").isArray().isLength({ min: 2 }),
    body("parties.*").isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const escrowData = {
        ...req.body,
        createdBy: req.user.userId,
      };

      const escrowId = await paymentProcessor.createEscrowAccount(escrowData);

      res.status(201).json({
        success: true,
        message: "Escrow account created successfully",
        data: { escrowId },
      });
    } catch (error) {
      console.error("Create escrow error:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Release escrow funds
router.post(
  "/escrow/:escrowId/release",
  auth,
  [
    body("recipient").isMongoId(),
    body("amount").isNumeric().isFloat({ min: 0.01 }),
    body("reason").optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { escrowId } = req.params;
      const releaseData = {
        ...req.body,
        releasedBy: req.user.userId,
      };

      const result = await paymentProcessor.releaseEscrow(
        escrowId,
        releaseData
      );

      res.json({
        success: true,
        message: "Escrow funds released successfully",
        data: result,
      });
    } catch (error) {
      console.error("Release escrow error:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get escrow account details
router.get("/escrow/:escrowId", auth, async (req, res) => {
  try {
    const { escrowId } = req.params;
    const escrow = paymentProcessor.escrowAccounts.get(escrowId);

    if (!escrow) {
      return res.status(404).json({
        success: false,
        error: "Escrow account not found",
      });
    }

    res.json({
      success: true,
      data: escrow,
    });
  } catch (error) {
    console.error("Get escrow error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve escrow account",
    });
  }
});

// Get supported payment methods
router.get("/methods", (req, res) => {
  try {
    const methods = paymentProcessor.paymentMethods;
    const currencies = paymentProcessor.currencies;
    const gateways = Object.keys(paymentProcessor.paymentGateways);

    res.json({
      success: true,
      data: {
        methods,
        currencies,
        gateways,
      },
    });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve payment methods",
    });
  }
});

// Get payment statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const stats = paymentProcessor.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get payment stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve payment statistics",
    });
  }
});

// Webhook endpoint for payment notifications
router.post(
  "/webhook/:gateway",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const { gateway } = req.params;
      const signature =
        req.headers["stripe-signature"] ||
        req.headers["paypal-transmission-id"];
      const payload = req.body;

      // Verify webhook signature
      const isValid = await verifyWebhookSignature(gateway, payload, signature);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      // Process webhook event
      await processWebhookEvent(gateway, payload);

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  }
);

// Helper functions
async function verifyWebhookSignature(gateway, payload, signature) {
  // Mock verification - in production, verify actual signatures
  return true;
}

async function processWebhookEvent(gateway, payload) {
  // Mock webhook processing - in production, handle actual webhook events
  console.log(`Processing ${gateway} webhook:`, payload);
}

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Payment Processor",
    timestamp: new Date().toISOString(),
    stats: paymentProcessor.getStats(),
  });
});

module.exports = router;
