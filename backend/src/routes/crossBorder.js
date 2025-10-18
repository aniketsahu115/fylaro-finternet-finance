const express = require("express");
const router = express.Router();
const CrossBorderSettlementService = require("../services/crossBorderSettlement");
const auth = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const settlementService = new CrossBorderSettlementService();

// Rate limiting for cross-border endpoints
const crossBorderRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message:
    "Too many cross-border requests from this IP, please try again later.",
});

// Apply rate limiting to all routes
router.use(crossBorderRateLimit);

/**
 * @route POST /api/cross-border/settlement
 * @desc Create cross-border settlement
 * @access Private
 */
router.post("/settlement", auth, async (req, res) => {
  try {
    const settlementData = req.body;

    if (
      !settlementData.invoiceId ||
      !settlementData.amount ||
      !settlementData.payerCurrency ||
      !settlementData.payeeCurrency
    ) {
      return res.status(400).json({
        error:
          "Invoice ID, amount, payer currency, and payee currency are required",
      });
    }

    const settlement = await settlementService.createCrossBorderSettlement(
      settlementData
    );

    res.json({
      success: true,
      settlement,
    });
  } catch (error) {
    console.error("Cross-border settlement creation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/cross-border/settlement/:settlementId
 * @desc Get settlement status
 * @access Private
 */
router.get("/settlement/:settlementId", auth, async (req, res) => {
  try {
    const { settlementId } = req.params;
    const status = settlementService.getSettlementStatus(settlementId);

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error("Settlement status error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/cross-border/convert
 * @desc Convert currency
 * @access Public
 */
router.post("/convert", async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        error: "Amount, from currency, and to currency are required",
      });
    }

    const conversion = settlementService.convertCurrency(
      amount,
      fromCurrency,
      toCurrency
    );

    res.json({
      success: true,
      conversion,
    });
  } catch (error) {
    console.error("Currency conversion error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/cross-border/currencies
 * @desc Get supported currencies
 * @access Public
 */
router.get("/currencies", (req, res) => {
  const currencies = settlementService.getSupportedCurrencies();

  res.json({
    success: true,
    currencies,
  });
});

/**
 * @route GET /api/cross-border/exchange-rates
 * @desc Get current exchange rates
 * @access Public
 */
router.get("/exchange-rates", (req, res) => {
  const rates = settlementService.getExchangeRates();

  res.json({
    success: true,
    rates,
  });
});

/**
 * @route GET /api/cross-border/history
 * @desc Get settlement history
 * @access Private
 */
router.get("/history", auth, async (req, res) => {
  try {
    const { status, currency, jurisdiction } = req.query;
    const filters = { status, currency, jurisdiction };

    const history = settlementService.getSettlementHistory(filters);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Settlement history error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/cross-border/health
 * @desc Health check for cross-border service
 * @access Public
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "Cross-Border Settlement",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    supportedCurrencies: Object.keys(settlementService.getSupportedCurrencies())
      .length,
  });
});

module.exports = router;
