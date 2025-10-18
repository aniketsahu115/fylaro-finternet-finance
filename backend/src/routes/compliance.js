const express = require("express");
const router = express.Router();
const ComplianceEngine = require("../services/complianceEngine");
const auth = require("../middleware/auth");
const { requireAdminUser } = require("../middleware/permissions");
const rateLimit = require("express-rate-limit");

const complianceEngine = new ComplianceEngine();

// Rate limiting for compliance endpoints
const complianceRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: "Too many compliance requests from this IP, please try again later.",
});

// Apply rate limiting to all routes
router.use(complianceRateLimit);

/**
 * @route POST /api/compliance/check
 * @desc Check compliance for a transaction
 * @access Private
 */
router.post("/check", auth, async (req, res) => {
  try {
    const { transaction, jurisdictions = ["US", "EU"] } = req.body;

    if (!transaction) {
      return res.status(400).json({ error: "Transaction data is required" });
    }

    const result = await complianceEngine.checkCompliance(
      transaction,
      jurisdictions
    );

    res.json({
      success: true,
      compliance: result,
    });
  } catch (error) {
    console.error("Compliance check error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/compliance/jurisdictions
 * @desc Get supported jurisdictions
 * @access Public
 */
router.get("/jurisdictions", (req, res) => {
  const jurisdictions = Object.keys(complianceEngine.jurisdictions).map(
    (code) => ({
      code,
      name: complianceEngine.jurisdictions[code].name,
      currency: complianceEngine.jurisdictions[code].currency,
      regulators: complianceEngine.jurisdictions[code].regulators,
    })
  );

  res.json({
    success: true,
    jurisdictions,
  });
});

/**
 * @route GET /api/compliance/jurisdiction/:code
 * @desc Get jurisdiction details
 * @access Public
 */
router.get("/jurisdiction/:code", (req, res) => {
  const { code } = req.params;
  const jurisdiction = complianceEngine.jurisdictions[code];

  if (!jurisdiction) {
    return res.status(404).json({ error: "Jurisdiction not found" });
  }

  res.json({
    success: true,
    jurisdiction: {
      code,
      ...jurisdiction,
    },
  });
});

/**
 * @route POST /api/compliance/report
 * @desc Generate compliance report
 * @access Private (Admin)
 */
router.post("/report", auth, requireAdminUser, async (req, res) => {
  try {
    const { jurisdiction, startDate, endDate } = req.body;

    if (!jurisdiction || !startDate || !endDate) {
      return res.status(400).json({
        error: "Jurisdiction, start date, and end date are required",
      });
    }

    const report = await complianceEngine.generateComplianceReport(
      jurisdiction,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/compliance/submit-report
 * @desc Submit regulatory report
 * @access Private (Admin)
 */
router.post("/submit-report", auth, requireAdminUser, async (req, res) => {
  try {
    const { jurisdiction, report } = req.body;

    if (!jurisdiction || !report) {
      return res.status(400).json({
        error: "Jurisdiction and report data are required",
      });
    }

    const submission = await complianceEngine.submitRegulatoryReport(
      jurisdiction,
      report
    );

    res.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error("Report submission error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/compliance/dashboard
 * @desc Get compliance dashboard data
 * @access Private (Admin)
 */
router.get("/dashboard", auth, requireAdminUser, async (req, res) => {
  try {
    const dashboard = {
      overview: {
        totalJurisdictions: Object.keys(complianceEngine.jurisdictions).length,
        activeComplianceChecks: complianceEngine.complianceCache.size,
        pendingReports: complianceEngine.reportingQueue.length,
        lastUpdated: new Date(),
      },
      jurisdictions: Object.keys(complianceEngine.jurisdictions).map(
        (code) => ({
          code,
          name: complianceEngine.jurisdictions[code].name,
          status: "active",
          lastCheck: new Date(),
          violations: 0, // This would be calculated from actual data
        })
      ),
      recentViolations: [], // This would be populated from actual data
      upcomingReports: [], // This would be populated from actual data
    };

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/compliance/violations
 * @desc Get compliance violations
 * @access Private (Admin)
 */
router.get("/violations", auth, requireAdminUser, async (req, res) => {
  try {
    const { jurisdiction, severity, limit = 50, offset = 0 } = req.query;

    // This would query actual violations from database
    const violations = [];

    res.json({
      success: true,
      violations,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: violations.length,
      },
    });
  } catch (error) {
    console.error("Violations fetch error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/compliance/health
 * @desc Health check for compliance service
 * @access Public
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "Compliance Engine",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    jurisdictions: Object.keys(complianceEngine.jurisdictions).length,
  });
});

module.exports = router;
