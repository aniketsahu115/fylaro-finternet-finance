const express = require("express");
const router = express.Router();
const UniversalAssetStandardsService = require("../services/universalAssetStandards");
const auth = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const assetStandards = new UniversalAssetStandardsService();

// Rate limiting for universal assets endpoints
const assetsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many asset requests from this IP, please try again later.",
});

// Apply rate limiting to all routes
router.use(assetsRateLimit);

/**
 * @route POST /api/universal-assets/create
 * @desc Create universal asset
 * @access Private
 */
router.post("/create", auth, async (req, res) => {
  try {
    const assetData = req.body;

    if (!assetData.assetType || !assetData.issuer || !assetData.owner) {
      return res.status(400).json({
        error: "Asset type, issuer, and owner are required",
      });
    }

    const asset = assetStandards.createUniversalAsset(assetData);

    res.json({
      success: true,
      asset,
    });
  } catch (error) {
    console.error("Asset creation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/universal-assets/:assetId
 * @desc Get asset by ID
 * @access Private
 */
router.get("/:assetId", auth, async (req, res) => {
  try {
    const { assetId } = req.params;
    const asset = assetStandards.getAsset(assetId);

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json({
      success: true,
      asset,
    });
  } catch (error) {
    console.error("Asset retrieval error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/universal-assets/owner/:owner
 * @desc Get assets by owner
 * @access Private
 */
router.get("/owner/:owner", auth, async (req, res) => {
  try {
    const { owner } = req.params;
    const assets = assetStandards.getAssetsByOwner(owner);

    res.json({
      success: true,
      assets,
    });
  } catch (error) {
    console.error("Assets by owner error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/universal-assets/type/:assetType
 * @desc Get assets by type
 * @access Public
 */
router.get("/type/:assetType", async (req, res) => {
  try {
    const { assetType } = req.params;
    const assets = assetStandards.getAssetsByType(assetType);

    res.json({
      success: true,
      assets,
    });
  } catch (error) {
    console.error("Assets by type error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/universal-assets/:assetId/transfer
 * @desc Transfer asset to another platform
 * @access Private
 */
router.post("/:assetId/transfer", auth, async (req, res) => {
  try {
    const { assetId } = req.params;
    const { targetPlatform, newOwner } = req.body;

    if (!targetPlatform || !newOwner) {
      return res.status(400).json({
        error: "Target platform and new owner are required",
      });
    }

    const transfer = await assetStandards.transferAsset(
      assetId,
      targetPlatform,
      newOwner
    );

    res.json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error("Asset transfer error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/universal-assets/:assetId/validate
 * @desc Validate asset against standard
 * @access Private
 */
router.post("/:assetId/validate", auth, async (req, res) => {
  try {
    const { assetId } = req.params;
    const { standard = "finternet-v1.0" } = req.body;

    const asset = assetStandards.getAsset(assetId);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const validation = assetStandards.validateAsset(asset, standard);

    res.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error("Asset validation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/universal-assets/standards
 * @desc Get available standards
 * @access Public
 */
router.get("/standards", (req, res) => {
  const standards = assetStandards.getStandards();

  res.json({
    success: true,
    standards,
  });
});

/**
 * @route GET /api/universal-assets/stats
 * @desc Get asset registry statistics
 * @access Public
 */
router.get("/stats", (req, res) => {
  const stats = assetStandards.getRegistryStats();

  res.json({
    success: true,
    stats,
  });
});

/**
 * @route GET /api/universal-assets/health
 * @desc Health check for universal assets service
 * @access Public
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "Universal Asset Standards",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    totalAssets: assetStandards.getRegistryStats().totalAssets,
  });
});

module.exports = router;
