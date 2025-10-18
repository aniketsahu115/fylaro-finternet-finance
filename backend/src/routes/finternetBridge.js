const express = require("express");
const router = express.Router();
const FinternetBridgeService = require("../services/finternetBridge");
const auth = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const bridgeService = new FinternetBridgeService();

// Rate limiting for bridge endpoints
const bridgeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many bridge requests from this IP, please try again later.",
});

// Apply rate limiting to all routes
router.use(bridgeRateLimit);

/**
 * @route POST /api/finternet-bridge/payment-intent
 * @desc Create payment intent with external processor
 * @access Private
 */
router.post("/payment-intent", auth, async (req, res) => {
  try {
    const paymentData = req.body;

    if (
      !paymentData.amount ||
      !paymentData.currency ||
      !paymentData.paymentMethod
    ) {
      return res.status(400).json({
        error: "Amount, currency, and payment method are required",
      });
    }

    const paymentIntent = await bridgeService.createPaymentIntent(paymentData);

    res.json({
      success: true,
      paymentIntent,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/finternet-bridge/cross-chain-transfer
 * @desc Execute cross-chain asset transfer
 * @access Private
 */
router.post("/cross-chain-transfer", auth, async (req, res) => {
  try {
    const transferData = req.body;

    if (
      !transferData.fromChain ||
      !transferData.toChain ||
      !transferData.amount ||
      !transferData.recipient
    ) {
      return res.status(400).json({
        error: "From chain, to chain, amount, and recipient are required",
      });
    }

    const transfer = await bridgeService.executeCrossChainTransfer(
      transferData
    );

    res.json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error("Cross-chain transfer error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/finternet-bridge/defi-operation
 * @desc Execute DeFi operation
 * @access Private
 */
router.post("/defi-operation", auth, async (req, res) => {
  try {
    const defiData = req.body;

    if (
      !defiData.protocol ||
      !defiData.operation ||
      !defiData.amount ||
      !defiData.userAddress
    ) {
      return res.status(400).json({
        error: "Protocol, operation, amount, and user address are required",
      });
    }

    const operation = await bridgeService.executeDeFiOperation(defiData);

    res.json({
      success: true,
      operation,
    });
  } catch (error) {
    console.error("DeFi operation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/finternet-bridge/credit-score
 * @desc Get credit score from external bureau
 * @access Private
 */
router.post("/credit-score", auth, async (req, res) => {
  try {
    const creditData = req.body;

    if (!creditData.userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    const creditScore = await bridgeService.getCreditScore(creditData);

    res.json({
      success: true,
      creditScore,
    });
  } catch (error) {
    console.error("Credit score retrieval error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/finternet-bridge/status
 * @desc Get bridge status
 * @access Public
 */
router.get("/status", (req, res) => {
  const status = bridgeService.getBridgeStatus();

  res.json({
    success: true,
    status,
  });
});

/**
 * @route GET /api/finternet-bridge/systems
 * @desc Get supported systems
 * @access Public
 */
router.get("/systems", (req, res) => {
  const systems = bridgeService.getSupportedSystems();

  res.json({
    success: true,
    systems,
  });
});

/**
 * @route POST /api/finternet-bridge/webhook
 * @desc Register webhook for external system
 * @access Private
 */
router.post("/webhook", auth, async (req, res) => {
  try {
    const { system, event, url } = req.body;

    if (!system || !event || !url) {
      return res.status(400).json({
        error: "System, event, and URL are required",
      });
    }

    const webhook = await bridgeService.registerWebhook(system, event, url);

    res.json({
      success: true,
      webhook,
    });
  } catch (error) {
    console.error("Webhook registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/finternet-bridge/health
 * @desc Health check for bridge service
 * @access Public
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "Finternet Bridge",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    connectedSystems: bridgeService.getBridgeStatus().connectedSystems,
  });
});

module.exports = router;
