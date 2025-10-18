const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Web3 = require("web3");

/**
 * Finternet Universal Single Sign-On Service
 * Provides unified identity across all financial services
 */
class FinternetSSOService {
  constructor() {
    this.web3 = new Web3();
    this.verificationCache = new Map();
    this.sessionCache = new Map();
    this.trustedProviders = new Set([
      "metamask",
      "walletconnect",
      "coinbase",
      "trustwallet",
      "finternet-identity",
    ]);
  }

  /**
   * Generate universal identity for a wallet address
   * @param {string} walletAddress - The user's wallet address
   * @param {string} provider - The wallet provider (metamask, walletconnect, etc.)
   * @returns {Object} Universal identity object
   */
  generateUniversalIdentity(walletAddress, provider = "metamask") {
    if (!this.web3.utils.isAddress(walletAddress)) {
      throw new Error("Invalid wallet address");
    }

    if (!this.trustedProviders.has(provider)) {
      throw new Error("Unsupported wallet provider");
    }

    const universalId = this.generateUniversalId(walletAddress, provider);
    const identityHash = this.generateIdentityHash(walletAddress, provider);

    return {
      universalId,
      walletAddress: walletAddress.toLowerCase(),
      provider,
      identityHash,
      createdAt: new Date(),
      isActive: true,
      trustLevel: this.calculateTrustLevel(provider),
      capabilities: this.getIdentityCapabilities(provider),
    };
  }

  /**
   * Generate a universal ID that works across all Finternet services
   * @param {string} walletAddress - The wallet address
   * @param {string} provider - The wallet provider
   * @returns {string} Universal ID
   */
  generateUniversalId(walletAddress, provider) {
    const normalizedAddress = walletAddress.toLowerCase();
    const providerHash = crypto
      .createHash("sha256")
      .update(provider)
      .digest("hex");
    const combined = `${normalizedAddress}-${providerHash}`;
    return crypto.createHash("sha256").update(combined).digest("hex");
  }

  /**
   * Generate identity hash for verification
   * @param {string} walletAddress - The wallet address
   * @param {string} provider - The wallet provider
   * @returns {string} Identity hash
   */
  generateIdentityHash(walletAddress, provider) {
    const timestamp = Math.floor(Date.now() / 1000);
    const data = `${walletAddress}-${provider}-${timestamp}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Calculate trust level based on provider
   * @param {string} provider - The wallet provider
   * @returns {string} Trust level
   */
  calculateTrustLevel(provider) {
    const trustLevels = {
      "finternet-identity": "high",
      metamask: "high",
      walletconnect: "medium",
      coinbase: "high",
      trustwallet: "medium",
    };
    return trustLevels[provider] || "low";
  }

  /**
   * Get identity capabilities based on provider
   * @param {string} provider - The wallet provider
   * @returns {Array} Array of capabilities
   */
  getIdentityCapabilities(provider) {
    const capabilities = {
      "finternet-identity": [
        "sign",
        "encrypt",
        "decrypt",
        "verify",
        "delegate",
      ],
      metamask: ["sign", "verify"],
      walletconnect: ["sign", "verify"],
      coinbase: ["sign", "verify"],
      trustwallet: ["sign", "verify"],
    };
    return capabilities[provider] || ["sign"];
  }

  /**
   * Verify wallet signature for authentication
   * @param {string} walletAddress - The wallet address
   * @param {string} signature - The signature
   * @param {string} message - The original message
   * @returns {boolean} Verification result
   */
  verifyWalletSignature(walletAddress, signature, message) {
    try {
      const messageHash = this.web3.utils.sha3(message);
      const recoveredAddress = this.web3.eth.accounts.recover(
        messageHash,
        signature
      );
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Create Finternet authentication token
   * @param {Object} identity - The universal identity
   * @param {Object} additionalClaims - Additional JWT claims
   * @returns {string} JWT token
   */
  createFinternetToken(identity, additionalClaims = {}) {
    const payload = {
      universalId: identity.universalId,
      walletAddress: identity.walletAddress,
      provider: identity.provider,
      trustLevel: identity.trustLevel,
      capabilities: identity.capabilities,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      ...additionalClaims,
    };

    return jwt.sign(
      payload,
      process.env.FINTERNET_JWT_SECRET || process.env.JWT_SECRET
    );
  }

  /**
   * Verify Finternet token
   * @param {string} token - The JWT token
   * @returns {Object} Decoded token payload
   */
  verifyFinternetToken(token) {
    try {
      return jwt.verify(
        token,
        process.env.FINTERNET_JWT_SECRET || process.env.JWT_SECRET
      );
    } catch (error) {
      throw new Error("Invalid Finternet token");
    }
  }

  /**
   * Create cross-service authentication challenge
   * @param {string} serviceId - The target service ID
   * @param {string} universalId - The user's universal ID
   * @returns {Object} Authentication challenge
   */
  createServiceChallenge(serviceId, universalId) {
    const challengeId = crypto.randomUUID();
    const challenge = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const challengeData = {
      challengeId,
      serviceId,
      universalId,
      challenge,
      expiresAt,
      status: "pending",
    };

    this.verificationCache.set(challengeId, challengeData);

    return {
      challengeId,
      challenge,
      expiresAt,
      serviceId,
    };
  }

  /**
   * Verify service challenge response
   * @param {string} challengeId - The challenge ID
   * @param {string} signature - The signature response
   * @param {string} walletAddress - The wallet address
   * @returns {Object} Verification result
   */
  verifyServiceChallenge(challengeId, signature, walletAddress) {
    const challengeData = this.verificationCache.get(challengeId);

    if (!challengeData) {
      throw new Error("Challenge not found or expired");
    }

    if (new Date() > challengeData.expiresAt) {
      this.verificationCache.delete(challengeId);
      throw new Error("Challenge expired");
    }

    const isValid = this.verifyWalletSignature(
      walletAddress,
      signature,
      challengeData.challenge
    );

    if (isValid) {
      challengeData.status = "verified";
      challengeData.verifiedAt = new Date();
      this.verificationCache.set(challengeId, challengeData);
    }

    return {
      valid: isValid,
      challengeId,
      serviceId: challengeData.serviceId,
      universalId: challengeData.universalId,
    };
  }

  /**
   * Create service-specific session
   * @param {string} universalId - The universal ID
   * @param {string} serviceId - The service ID
   * @param {Object} permissions - Service-specific permissions
   * @returns {Object} Service session
   */
  createServiceSession(universalId, serviceId, permissions = {}) {
    const sessionId = crypto.randomUUID();
    const sessionToken = this.createFinternetToken(
      { universalId, walletAddress: "", provider: "finternet-identity" },
      { serviceId, permissions, sessionId }
    );

    const session = {
      sessionId,
      universalId,
      serviceId,
      permissions,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isActive: true,
    };

    this.sessionCache.set(sessionId, session);

    return {
      sessionId,
      sessionToken,
      expiresAt: session.expiresAt,
      permissions,
    };
  }

  /**
   * Validate service session
   * @param {string} sessionToken - The session token
   * @param {string} serviceId - The expected service ID
   * @returns {Object} Session validation result
   */
  validateServiceSession(sessionToken, serviceId) {
    try {
      const decoded = this.verifyFinternetToken(sessionToken);
      const session = this.sessionCache.get(decoded.sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      if (session.serviceId !== serviceId) {
        throw new Error("Invalid service for session");
      }

      if (new Date() > session.expiresAt) {
        this.sessionCache.delete(decoded.sessionId);
        throw new Error("Session expired");
      }

      if (!session.isActive) {
        throw new Error("Session inactive");
      }

      return {
        valid: true,
        universalId: decoded.universalId,
        permissions: decoded.permissions,
        sessionId: decoded.sessionId,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's active sessions across all services
   * @param {string} universalId - The universal ID
   * @returns {Array} Array of active sessions
   */
  getActiveSessions(universalId) {
    const sessions = [];

    for (const [sessionId, session] of this.sessionCache.entries()) {
      if (
        session.universalId === universalId &&
        session.isActive &&
        new Date() < session.expiresAt
      ) {
        sessions.push({
          sessionId,
          serviceId: session.serviceId,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          permissions: session.permissions,
        });
      }
    }

    return sessions;
  }

  /**
   * Revoke service session
   * @param {string} sessionId - The session ID
   * @param {string} universalId - The universal ID (for authorization)
   * @returns {boolean} Success status
   */
  revokeServiceSession(sessionId, universalId) {
    const session = this.sessionCache.get(sessionId);

    if (!session) {
      return false;
    }

    if (session.universalId !== universalId) {
      throw new Error("Unauthorized to revoke this session");
    }

    session.isActive = false;
    this.sessionCache.set(sessionId, session);

    return true;
  }

  /**
   * Revoke all sessions for a user
   * @param {string} universalId - The universal ID
   * @returns {number} Number of sessions revoked
   */
  revokeAllSessions(universalId) {
    let revokedCount = 0;

    for (const [sessionId, session] of this.sessionCache.entries()) {
      if (session.universalId === universalId && session.isActive) {
        session.isActive = false;
        this.sessionCache.set(sessionId, session);
        revokedCount++;
      }
    }

    return revokedCount;
  }

  /**
   * Get identity verification status
   * @param {string} universalId - The universal ID
   * @returns {Object} Verification status
   */
  getIdentityVerificationStatus(universalId) {
    // This would integrate with the KYC system
    return {
      universalId,
      isVerified: true, // This would check actual KYC status
      verificationLevel: "advanced",
      lastVerified: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };
  }

  /**
   * Clean up expired sessions and challenges
   */
  cleanupExpired() {
    const now = new Date();

    // Clean up expired challenges
    for (const [challengeId, challenge] of this.verificationCache.entries()) {
      if (now > challenge.expiresAt) {
        this.verificationCache.delete(challengeId);
      }
    }

    // Clean up expired sessions
    for (const [sessionId, session] of this.sessionCache.entries()) {
      if (now > session.expiresAt || !session.isActive) {
        this.sessionCache.delete(sessionId);
      }
    }
  }
}

module.exports = FinternetSSOService;
