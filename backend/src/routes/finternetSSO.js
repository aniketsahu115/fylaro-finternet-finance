const express = require("express");
const router = express.Router();
const FinternetSSOService = require("../services/finternetSSO");
const auth = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const ssoService = new FinternetSSOService();

// Rate limiting for SSO endpoints
const ssoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many SSO requests from this IP, please try again later.",
});

const challengeRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 challenge requests per windowMs
  message: "Too many challenge requests from this IP, please try again later.",
});

// Apply rate limiting to all routes
router.use(ssoRateLimit);

/**
 * @route POST /api/finternet-sso/identity
 * @desc Generate universal identity for wallet
 * @access Public
 */
router.post("/identity", async (req, res) => {
  try {
    const { walletAddress, provider = "metamask" } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    const identity = ssoService.generateUniversalIdentity(
      walletAddress,
      provider
    );

    res.json({
      success: true,
      identity: {
        universalId: identity.universalId,
        walletAddress: identity.walletAddress,
        provider: identity.provider,
        trustLevel: identity.trustLevel,
        capabilities: identity.capabilities,
        createdAt: identity.createdAt,
      },
    });
  } catch (error) {
    console.error("Identity generation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/finternet-sso/authenticate
 * @desc Authenticate wallet and create Finternet token
 * @access Public
 */
router.post("/authenticate", async (req, res) => {
  try {
    const {
      walletAddress,
      signature,
      message,
      provider = "metamask",
    } = req.body;

    if (!walletAddress || !signature || !message) {
      return res
        .status(400)
        .json({ error: "Wallet address, signature, and message are required" });
    }

    // Verify wallet signature
    const isValidSignature = ssoService.verifyWalletSignature(
      walletAddress,
      signature,
      message
    );

    if (!isValidSignature) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Generate universal identity
    const identity = ssoService.generateUniversalIdentity(
      walletAddress,
      provider
    );

    // Create Finternet token
    const token = ssoService.createFinternetToken(identity, {
      authMethod: "wallet_signature",
      messageHash: ssoService.web3.utils.sha3(message),
    });

    res.json({
      success: true,
      token,
      identity: {
        universalId: identity.universalId,
        walletAddress: identity.walletAddress,
        provider: identity.provider,
        trustLevel: identity.trustLevel,
        capabilities: identity.capabilities,
      },
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/finternet-sso/challenge
 * @desc Create service authentication challenge
 * @access Private
 */
router.post("/challenge", auth, challengeRateLimit, async (req, res) => {
  try {
    const { serviceId } = req.body;
    const universalId = req.user.universalId;

    if (!serviceId) {
      return res.status(400).json({ error: "Service ID is required" });
    }

    const challenge = ssoService.createServiceChallenge(serviceId, universalId);

    res.json({
      success: true,
      challenge,
    });
  } catch (error) {
    console.error("Challenge creation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/finternet-sso/verify-challenge
 * @desc Verify service challenge response
 * @access Public
 */
router.post("/verify-challenge", async (req, res) => {
  try {
    const { challengeId, signature, walletAddress } = req.body;

    if (!challengeId || !signature || !walletAddress) {
      return res
        .status(400)
        .json({
          error: "Challenge ID, signature, and wallet address are required",
        });
    }

    const result = ssoService.verifyServiceChallenge(
      challengeId,
      signature,
      walletAddress
    );

    if (!result.valid) {
      return res.status(401).json({ error: "Challenge verification failed" });
    }

    res.json({
      success: true,
      challengeId: result.challengeId,
      serviceId: result.serviceId,
      universalId: result.universalId,
    });
  } catch (error) {
    console.error("Challenge verification error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/finternet-sso/service-session
 * @desc Create service-specific session
 * @access Private
 */
router.post("/service-session", auth, async (req, res) => {
  try {
    const { serviceId, permissions = {} } = req.body;
    const universalId = req.user.universalId;

    if (!serviceId) {
      return res.status(400).json({ error: "Service ID is required" });
    }

    const session = ssoService.createServiceSession(
      universalId,
      serviceId,
      permissions
    );

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Service session creation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/finternet-sso/validate-session
 * @desc Validate service session
 * @access Public
 */
router.post("/validate-session", async (req, res) => {
  try {
    const { sessionToken, serviceId } = req.body;

    if (!sessionToken || !serviceId) {
      return res
        .status(400)
        .json({ error: "Session token and service ID are required" });
    }

    const result = ssoService.validateServiceSession(sessionToken, serviceId);

    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    res.json({
      success: true,
      valid: true,
      universalId: result.universalId,
      permissions: result.permissions,
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error("Session validation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/finternet-sso/sessions
 * @desc Get user's active sessions
 * @access Private
 */
router.get("/sessions", auth, async (req, res) => {
  try {
    const universalId = req.user.universalId;
    const sessions = ssoService.getActiveSessions(universalId);

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route DELETE /api/finternet-sso/session/:sessionId
 * @desc Revoke specific session
 * @access Private
 */
router.delete("/session/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const universalId = req.user.universalId;

    const success = ssoService.revokeServiceSession(sessionId, universalId);

    if (!success) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Session revocation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route DELETE /api/finternet-sso/sessions
 * @desc Revoke all user sessions
 * @access Private
 */
router.delete("/sessions", auth, async (req, res) => {
  try {
    const universalId = req.user.universalId;
    const revokedCount = ssoService.revokeAllSessions(universalId);

    res.json({
      success: true,
      message: `Revoked ${revokedCount} sessions`,
      revokedCount,
    });
  } catch (error) {
    console.error("Bulk session revocation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/finternet-sso/verification-status
 * @desc Get identity verification status
 * @access Private
 */
router.get("/verification-status", auth, async (req, res) => {
  try {
    const universalId = req.user.universalId;
    const status = ssoService.getIdentityVerificationStatus(universalId);

    res.json({
      success: true,
      verification: status,
    });
  } catch (error) {
    console.error("Verification status error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/finternet-sso/health
 * @desc Health check for SSO service
 * @access Public
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "Finternet SSO",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Cleanup expired sessions and challenges every hour
setInterval(() => {
  ssoService.cleanupExpired();
}, 60 * 60 * 1000);

module.exports = router;
