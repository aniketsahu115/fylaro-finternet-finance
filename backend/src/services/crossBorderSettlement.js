const axios = require("axios");
const crypto = require("crypto");

/**
 * Cross-Border Settlement Service
 * Handles multi-currency, multi-jurisdiction settlement with real-time FX
 */
class CrossBorderSettlementService {
  constructor() {
    this.supportedCurrencies = {
      USD: { name: "US Dollar", symbol: "$", decimals: 2 },
      EUR: { name: "Euro", symbol: "€", decimals: 2 },
      GBP: { name: "British Pound", symbol: "£", decimals: 2 },
      JPY: { name: "Japanese Yen", symbol: "¥", decimals: 0 },
      SGD: { name: "Singapore Dollar", symbol: "S$", decimals: 2 },
      CAD: { name: "Canadian Dollar", symbol: "C$", decimals: 2 },
      AUD: { name: "Australian Dollar", symbol: "A$", decimals: 2 },
      CHF: { name: "Swiss Franc", symbol: "CHF", decimals: 2 },
      CNY: { name: "Chinese Yuan", symbol: "¥", decimals: 2 },
      INR: { name: "Indian Rupee", symbol: "₹", decimals: 2 },
    };

    this.fxRates = new Map();
    this.settlementQueue = [];
    this.activeSettlements = new Map();
    this.lastFxUpdate = null;

    // Initialize FX rates
    this.updateExchangeRates();

    // Update FX rates every 5 minutes
    setInterval(() => {
      this.updateExchangeRates();
    }, 5 * 60 * 1000);
  }

  /**
   * Update exchange rates from external API
   */
  async updateExchangeRates() {
    try {
      // In production, this would use a real FX API like Fixer.io, CurrencyLayer, or XE
      const baseCurrency = "USD";
      const currencies = Object.keys(this.supportedCurrencies).filter(
        (c) => c !== baseCurrency
      );

      // Mock exchange rates for demonstration
      const mockRates = {
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
        SGD: 1.35,
        CAD: 1.25,
        AUD: 1.3,
        CHF: 0.92,
        CNY: 6.45,
        INR: 74.0,
      };

      // Update rates
      for (const [currency, rate] of Object.entries(mockRates)) {
        this.fxRates.set(`${baseCurrency}_${currency}`, rate);
        this.fxRates.set(`${currency}_${baseCurrency}`, 1 / rate);
      }

      // Cross rates (e.g., EUR to GBP)
      this.fxRates.set("EUR_GBP", mockRates.EUR / mockRates.GBP);
      this.fxRates.set("GBP_EUR", mockRates.GBP / mockRates.EUR);

      this.lastFxUpdate = new Date();
      console.log("Exchange rates updated:", this.lastFxUpdate);
    } catch (error) {
      console.error("Failed to update exchange rates:", error);
    }
  }

  /**
   * Get exchange rate between two currencies
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Exchange rate
   */
  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const directRate = this.fxRates.get(`${fromCurrency}_${toCurrency}`);
    if (directRate) {
      return directRate;
    }

    // Try reverse rate
    const reverseRate = this.fxRates.get(`${toCurrency}_${fromCurrency}`);
    if (reverseRate) {
      return 1 / reverseRate;
    }

    // Try USD as intermediate currency
    const fromToUSD = this.fxRates.get(`${fromCurrency}_USD`);
    const usdToTo = this.fxRates.get(`USD_${toCurrency}`);

    if (fromToUSD && usdToTo) {
      return fromToUSD * usdToTo;
    }

    throw new Error(
      `Exchange rate not available for ${fromCurrency} to ${toCurrency}`
    );
  }

  /**
   * Convert amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Object} Conversion result
   */
  convertCurrency(amount, fromCurrency, toCurrency) {
    if (!this.supportedCurrencies[fromCurrency]) {
      throw new Error(`Unsupported source currency: ${fromCurrency}`);
    }

    if (!this.supportedCurrencies[toCurrency]) {
      throw new Error(`Unsupported target currency: ${toCurrency}`);
    }

    const rate = this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;

    // Round to appropriate decimal places
    const decimals = this.supportedCurrencies[toCurrency].decimals;
    const roundedAmount =
      Math.round(convertedAmount * Math.pow(10, decimals)) /
      Math.pow(10, decimals);

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: roundedAmount,
      targetCurrency: toCurrency,
      exchangeRate: rate,
      timestamp: new Date(),
      fxProvider: "internal", // In production, this would be the actual provider
    };
  }

  /**
   * Create cross-border settlement
   * @param {Object} settlementData - Settlement data
   * @returns {Object} Settlement result
   */
  async createCrossBorderSettlement(settlementData) {
    const {
      invoiceId,
      payerJurisdiction,
      payerCurrency,
      payeeJurisdiction,
      payeeCurrency,
      amount,
      dueDate,
      metadata = {},
    } = settlementData;

    // Validate currencies
    if (!this.supportedCurrencies[payerCurrency]) {
      throw new Error(`Unsupported payer currency: ${payerCurrency}`);
    }

    if (!this.supportedCurrencies[payeeCurrency]) {
      throw new Error(`Unsupported payee currency: ${payeeCurrency}`);
    }

    // Generate settlement ID
    const settlementId = crypto.randomUUID();

    // Convert currency if needed
    let convertedAmount = amount;
    let exchangeRate = 1;
    let conversionFee = 0;

    if (payerCurrency !== payeeCurrency) {
      const conversion = this.convertCurrency(
        amount,
        payerCurrency,
        payeeCurrency
      );
      convertedAmount = conversion.convertedAmount;
      exchangeRate = conversion.exchangeRate;
      conversionFee = this.calculateConversionFee(
        amount,
        payerCurrency,
        payeeCurrency
      );
    }

    // Calculate settlement fees
    const settlementFee = this.calculateSettlementFee(
      convertedAmount,
      payeeCurrency
    );
    const totalFees = conversionFee + settlementFee;

    const settlement = {
      settlementId,
      invoiceId,
      payerJurisdiction,
      payerCurrency,
      payeeJurisdiction,
      payeeCurrency,
      originalAmount: amount,
      convertedAmount,
      exchangeRate,
      conversionFee,
      settlementFee,
      totalFees,
      netAmount: convertedAmount - totalFees,
      dueDate: new Date(dueDate),
      status: "pending",
      createdAt: new Date(),
      metadata,
      steps: this.generateSettlementSteps(
        payerJurisdiction,
        payeeJurisdiction,
        payerCurrency,
        payeeCurrency
      ),
    };

    // Add to settlement queue
    this.settlementQueue.push(settlement);
    this.activeSettlements.set(settlementId, settlement);

    // Process settlement asynchronously
    this.processSettlement(settlementId);

    return settlement;
  }

  /**
   * Process settlement
   * @param {string} settlementId - Settlement ID
   */
  async processSettlement(settlementId) {
    const settlement = this.activeSettlements.get(settlementId);
    if (!settlement) {
      throw new Error("Settlement not found");
    }

    try {
      settlement.status = "processing";
      settlement.processingStartedAt = new Date();

      // Step 1: Compliance checks
      await this.performComplianceChecks(settlement);

      // Step 2: Currency conversion (if needed)
      if (settlement.payerCurrency !== settlement.payeeCurrency) {
        await this.executeCurrencyConversion(settlement);
      }

      // Step 3: Cross-border transfer
      await this.executeCrossBorderTransfer(settlement);

      // Step 4: Settlement confirmation
      await this.confirmSettlement(settlement);

      settlement.status = "completed";
      settlement.completedAt = new Date();
    } catch (error) {
      settlement.status = "failed";
      settlement.error = error.message;
      settlement.failedAt = new Date();
      console.error("Settlement processing failed:", error);
    }

    // Update settlement in active settlements
    this.activeSettlements.set(settlementId, settlement);
  }

  /**
   * Perform compliance checks for settlement
   * @param {Object} settlement - Settlement object
   */
  async performComplianceChecks(settlement) {
    // This would integrate with the compliance engine
    const complianceChecks = [
      "kyc_verification",
      "aml_screening",
      "sanctions_check",
      "regulatory_approval",
    ];

    for (const check of complianceChecks) {
      // Simulate compliance check
      await new Promise((resolve) => setTimeout(resolve, 100));
      settlement.complianceChecks = settlement.complianceChecks || {};
      settlement.complianceChecks[check] = {
        status: "passed",
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute currency conversion
   * @param {Object} settlement - Settlement object
   */
  async executeCurrencyConversion(settlement) {
    // Simulate currency conversion execution
    await new Promise((resolve) => setTimeout(resolve, 200));

    settlement.conversionExecuted = true;
    settlement.conversionExecutedAt = new Date();
  }

  /**
   * Execute cross-border transfer
   * @param {Object} settlement - Settlement object
   */
  async executeCrossBorderTransfer(settlement) {
    // Simulate cross-border transfer
    await new Promise((resolve) => setTimeout(resolve, 500));

    settlement.transferExecuted = true;
    settlement.transferExecutedAt = new Date();
    settlement.transferReference = crypto.randomUUID();
  }

  /**
   * Confirm settlement
   * @param {Object} settlement - Settlement object
   */
  async confirmSettlement(settlement) {
    // Simulate settlement confirmation
    await new Promise((resolve) => setTimeout(resolve, 100));

    settlement.confirmed = true;
    settlement.confirmedAt = new Date();
  }

  /**
   * Calculate conversion fee
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Conversion fee
   */
  calculateConversionFee(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return 0;
    }

    // 0.5% conversion fee with minimum of $5
    const feeRate = 0.005;
    const minFee = 5;
    const calculatedFee = amount * feeRate;

    return Math.max(calculatedFee, minFee);
  }

  /**
   * Calculate settlement fee
   * @param {number} amount - Settlement amount
   * @param {string} currency - Currency
   * @returns {number} Settlement fee
   */
  calculateSettlementFee(amount, currency) {
    // Tiered fee structure
    if (amount <= 1000) {
      return 10; // $10 for amounts up to $1000
    } else if (amount <= 10000) {
      return 25; // $25 for amounts up to $10,000
    } else if (amount <= 100000) {
      return 50; // $50 for amounts up to $100,000
    } else {
      return 100; // $100 for amounts over $100,000
    }
  }

  /**
   * Generate settlement steps
   * @param {string} payerJurisdiction - Payer jurisdiction
   * @param {string} payeeJurisdiction - Payee jurisdiction
   * @param {string} payerCurrency - Payer currency
   * @param {string} payeeCurrency - Payee currency
   * @returns {Array} Settlement steps
   */
  generateSettlementSteps(
    payerJurisdiction,
    payeeJurisdiction,
    payerCurrency,
    payeeCurrency
  ) {
    const steps = [
      {
        step: 1,
        name: "Compliance Verification",
        description: "Verify KYC/AML compliance for both parties",
        status: "pending",
      },
      {
        step: 2,
        name: "Currency Conversion",
        description:
          payerCurrency !== payeeCurrency
            ? `Convert ${payerCurrency} to ${payeeCurrency}`
            : "No currency conversion needed",
        status: "pending",
      },
      {
        step: 3,
        name: "Cross-Border Transfer",
        description: `Transfer funds from ${payerJurisdiction} to ${payeeJurisdiction}`,
        status: "pending",
      },
      {
        step: 4,
        name: "Settlement Confirmation",
        description: "Confirm settlement completion",
        status: "pending",
      },
    ];

    return steps;
  }

  /**
   * Get settlement status
   * @param {string} settlementId - Settlement ID
   * @returns {Object} Settlement status
   */
  getSettlementStatus(settlementId) {
    const settlement = this.activeSettlements.get(settlementId);
    if (!settlement) {
      throw new Error("Settlement not found");
    }

    return {
      settlementId,
      status: settlement.status,
      progress: this.calculateProgress(settlement),
      steps: settlement.steps,
      createdAt: settlement.createdAt,
      completedAt: settlement.completedAt,
      error: settlement.error,
    };
  }

  /**
   * Calculate settlement progress
   * @param {Object} settlement - Settlement object
   * @returns {number} Progress percentage
   */
  calculateProgress(settlement) {
    if (settlement.status === "completed") return 100;
    if (settlement.status === "failed") return 0;

    let completedSteps = 0;
    const totalSteps = settlement.steps.length;

    if (settlement.complianceChecks) completedSteps++;
    if (settlement.conversionExecuted) completedSteps++;
    if (settlement.transferExecuted) completedSteps++;
    if (settlement.confirmed) completedSteps++;

    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Get supported currencies
   * @returns {Object} Supported currencies
   */
  getSupportedCurrencies() {
    return this.supportedCurrencies;
  }

  /**
   * Get current exchange rates
   * @returns {Object} Exchange rates
   */
  getExchangeRates() {
    const rates = {};
    for (const [pair, rate] of this.fxRates.entries()) {
      rates[pair] = rate;
    }
    return {
      rates,
      lastUpdated: this.lastFxUpdate,
      baseCurrency: "USD",
    };
  }

  /**
   * Get settlement history
   * @param {Object} filters - Filter options
   * @returns {Array} Settlement history
   */
  getSettlementHistory(filters = {}) {
    let settlements = Array.from(this.activeSettlements.values());

    if (filters.status) {
      settlements = settlements.filter((s) => s.status === filters.status);
    }

    if (filters.currency) {
      settlements = settlements.filter(
        (s) =>
          s.payerCurrency === filters.currency ||
          s.payeeCurrency === filters.currency
      );
    }

    if (filters.jurisdiction) {
      settlements = settlements.filter(
        (s) =>
          s.payerJurisdiction === filters.jurisdiction ||
          s.payeeJurisdiction === filters.jurisdiction
      );
    }

    return settlements.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
}

module.exports = CrossBorderSettlementService;
