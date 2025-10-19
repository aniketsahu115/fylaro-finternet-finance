// Payment processing service for handling various payment methods
const axios = require("axios");
const crypto = require("crypto");
const Web3 = require("web3");

class PaymentProcessorService {
  constructor() {
    this.web3 = new Web3();
    this.paymentMethods = {
      CRYPTO: "crypto",
      BANK_TRANSFER: "bank_transfer",
      CREDIT_CARD: "credit_card",
      WIRE_TRANSFER: "wire_transfer",
      ACH: "ach",
      SEPA: "sepa",
    };

    this.currencies = {
      USD: { symbol: "USD", decimals: 2, name: "US Dollar" },
      EUR: { symbol: "EUR", decimals: 2, name: "Euro" },
      GBP: { symbol: "GBP", decimals: 2, name: "British Pound" },
      BNB: { symbol: "BNB", decimals: 18, name: "Binance Coin" },
      ETH: { symbol: "ETH", decimals: 18, name: "Ethereum" },
      USDT: { symbol: "USDT", decimals: 6, name: "Tether USD" },
      USDC: { symbol: "USDC", decimals: 6, name: "USD Coin" },
    };

    this.paymentGateways = {
      stripe: {
        name: "Stripe",
        supportedCurrencies: ["USD", "EUR", "GBP"],
        supportedMethods: ["credit_card", "ach", "sepa"],
        apiKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      },
      paypal: {
        name: "PayPal",
        supportedCurrencies: ["USD", "EUR", "GBP", "CAD", "AUD"],
        supportedMethods: ["credit_card", "paypal"],
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      },
      coinbase: {
        name: "Coinbase Commerce",
        supportedCurrencies: ["BTC", "ETH", "USDC", "USDT", "BNB"],
        supportedMethods: ["crypto"],
        apiKey: process.env.COINBASE_API_KEY,
        webhookSecret: process.env.COINBASE_WEBHOOK_SECRET,
      },
    };

    this.activePayments = new Map();
    this.paymentHistory = [];
    this.escrowAccounts = new Map();
  }

  // Create a new payment intent
  async createPaymentIntent(paymentData) {
    try {
      const {
        amount,
        currency,
        paymentMethod,
        description,
        metadata = {},
        returnUrl,
        webhookUrl,
      } = paymentData;

      // Validate payment data
      this.validatePaymentData(paymentData);

      // Generate payment ID
      const paymentId = this.generatePaymentId();

      // Determine payment gateway
      const gateway = this.selectPaymentGateway(paymentMethod, currency);

      // Create payment intent based on method
      let paymentIntent;
      switch (paymentMethod) {
        case this.paymentMethods.CRYPTO:
          paymentIntent = await this.createCryptoPayment(
            paymentId,
            amount,
            currency,
            description,
            metadata
          );
          break;
        case this.paymentMethods.CREDIT_CARD:
        case this.paymentMethods.ACH:
        case this.paymentMethods.SEPA:
          paymentIntent = await this.createFiatPayment(
            paymentId,
            amount,
            currency,
            paymentMethod,
            description,
            metadata,
            gateway
          );
          break;
        case this.paymentMethods.BANK_TRANSFER:
        case this.paymentMethods.WIRE_TRANSFER:
          paymentIntent = await this.createBankTransfer(
            paymentId,
            amount,
            currency,
            description,
            metadata
          );
          break;
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

      // Store payment intent
      const payment = {
        id: paymentId,
        amount,
        currency,
        paymentMethod,
        gateway,
        status: "pending",
        description,
        metadata,
        returnUrl,
        webhookUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...paymentIntent,
      };

      this.activePayments.set(paymentId, payment);

      return {
        success: true,
        paymentId,
        status: payment.status,
        ...paymentIntent,
      };
    } catch (error) {
      console.error("Payment intent creation error:", error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  // Process payment
  async processPayment(paymentId, paymentData) {
    try {
      const payment = this.activePayments.get(paymentId);
      if (!payment) {
        throw new Error("Payment not found");
      }

      if (payment.status !== "pending") {
        throw new Error(`Payment already ${payment.status}`);
      }

      let result;
      switch (payment.paymentMethod) {
        case this.paymentMethods.CRYPTO:
          result = await this.processCryptoPayment(payment, paymentData);
          break;
        case this.paymentMethods.CREDIT_CARD:
        case this.paymentMethods.ACH:
        case this.paymentMethods.SEPA:
          result = await this.processFiatPayment(payment, paymentData);
          break;
        case this.paymentMethods.BANK_TRANSFER:
        case this.paymentMethods.WIRE_TRANSFER:
          result = await this.processBankTransfer(payment, paymentData);
          break;
        default:
          throw new Error(
            `Unsupported payment method: ${payment.paymentMethod}`
          );
      }

      // Update payment status
      payment.status = result.status;
      payment.transactionId = result.transactionId;
      payment.processedAt = new Date();
      payment.updatedAt = new Date();

      // Move to history
      this.paymentHistory.push(payment);
      this.activePayments.delete(paymentId);

      return {
        success: true,
        paymentId,
        status: payment.status,
        transactionId: payment.transactionId,
        processedAt: payment.processedAt,
      };
    } catch (error) {
      console.error("Payment processing error:", error);
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  // Create crypto payment
  async createCryptoPayment(
    paymentId,
    amount,
    currency,
    description,
    metadata
  ) {
    const gateway = this.paymentGateways.coinbase;

    // For demo purposes, we'll create a mock crypto payment
    // In production, integrate with Coinbase Commerce or similar
    const cryptoAddress = this.generateCryptoAddress(currency);

    return {
      type: "crypto",
      address: cryptoAddress,
      amount: this.formatCryptoAmount(amount, currency),
      currency: currency,
      qrCode: this.generateQRCode(cryptoAddress, amount, currency),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  // Process crypto payment
  async processCryptoPayment(payment, paymentData) {
    const { transactionHash, blockNumber } = paymentData;

    // Verify transaction on blockchain
    const isValid = await this.verifyCryptoTransaction(
      transactionHash,
      payment.address,
      payment.amount,
      payment.currency
    );

    if (!isValid) {
      throw new Error("Invalid crypto transaction");
    }

    return {
      status: "completed",
      transactionId: transactionHash,
      blockNumber,
      confirmedAt: new Date(),
    };
  }

  // Create fiat payment (Stripe/PayPal)
  async createFiatPayment(
    paymentId,
    amount,
    currency,
    paymentMethod,
    description,
    metadata,
    gateway
  ) {
    if (gateway === "stripe") {
      return await this.createStripePaymentIntent(
        paymentId,
        amount,
        currency,
        description,
        metadata
      );
    } else if (gateway === "paypal") {
      return await this.createPayPalOrder(
        paymentId,
        amount,
        currency,
        description,
        metadata
      );
    }

    throw new Error(`Unsupported gateway: ${gateway}`);
  }

  // Process fiat payment
  async processFiatPayment(payment, paymentData) {
    if (payment.gateway === "stripe") {
      return await this.confirmStripePayment(payment, paymentData);
    } else if (payment.gateway === "paypal") {
      return await this.confirmPayPalPayment(payment, paymentData);
    }

    throw new Error(`Unsupported gateway: ${payment.gateway}`);
  }

  // Create bank transfer
  async createBankTransfer(paymentId, amount, currency, description, metadata) {
    const bankDetails = this.getBankDetails(currency);

    return {
      type: "bank_transfer",
      bankName: bankDetails.name,
      accountNumber: bankDetails.accountNumber,
      routingNumber: bankDetails.routingNumber,
      swiftCode: bankDetails.swiftCode,
      amount: this.formatAmount(amount, currency),
      currency: currency,
      reference: paymentId,
      instructions: `Please include reference: ${paymentId}`,
    };
  }

  // Process bank transfer
  async processBankTransfer(payment, paymentData) {
    // Bank transfers are typically manual verification
    // This would integrate with banking APIs or manual verification process
    return {
      status: "pending_verification",
      transactionId: paymentData.reference,
      note: "Bank transfer pending verification",
    };
  }

  // Create escrow account
  async createEscrowAccount(accountData) {
    const { invoiceId, amount, currency, parties } = accountData;

    const escrowId = this.generateEscrowId();
    const escrowAccount = {
      id: escrowId,
      invoiceId,
      amount,
      currency,
      parties,
      status: "active",
      createdAt: new Date(),
      balance: 0,
      transactions: [],
    };

    this.escrowAccounts.set(escrowId, escrowAccount);
    return escrowId;
  }

  // Release escrow funds
  async releaseEscrow(escrowId, releaseData) {
    const escrow = this.escrowAccounts.get(escrowId);
    if (!escrow) {
      throw new Error("Escrow account not found");
    }

    if (escrow.status !== "active") {
      throw new Error("Escrow account not active");
    }

    const { recipient, amount, reason } = releaseData;

    // Process release
    escrow.balance -= amount;
    escrow.transactions.push({
      type: "release",
      recipient,
      amount,
      reason,
      timestamp: new Date(),
    });

    if (escrow.balance <= 0) {
      escrow.status = "closed";
    }

    return {
      success: true,
      escrowId,
      releasedAmount: amount,
      remainingBalance: escrow.balance,
    };
  }

  // Get payment status
  getPaymentStatus(paymentId) {
    const payment =
      this.activePayments.get(paymentId) ||
      this.paymentHistory.find((p) => p.id === paymentId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      transactionId: payment.transactionId,
    };
  }

  // Get payment history
  getPaymentHistory(filters = {}) {
    let history = [...this.paymentHistory];

    if (filters.status) {
      history = history.filter((p) => p.status === filters.status);
    }

    if (filters.paymentMethod) {
      history = history.filter(
        (p) => p.paymentMethod === filters.paymentMethod
      );
    }

    if (filters.currency) {
      history = history.filter((p) => p.currency === filters.currency);
    }

    if (filters.startDate) {
      history = history.filter(
        (p) => p.createdAt >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      history = history.filter((p) => p.createdAt <= new Date(filters.endDate));
    }

    return history.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Utility methods
  validatePaymentData(paymentData) {
    const { amount, currency, paymentMethod } = paymentData;

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    if (!currency || !this.currencies[currency]) {
      throw new Error("Unsupported currency");
    }

    if (
      !paymentMethod ||
      !Object.values(this.paymentMethods).includes(paymentMethod)
    ) {
      throw new Error("Unsupported payment method");
    }
  }

  selectPaymentGateway(paymentMethod, currency) {
    if (paymentMethod === this.paymentMethods.CRYPTO) {
      return "coinbase";
    }

    if (this.paymentGateways.stripe.supportedCurrencies.includes(currency)) {
      return "stripe";
    }

    if (this.paymentGateways.paypal.supportedCurrencies.includes(currency)) {
      return "paypal";
    }

    throw new Error(`No gateway available for ${currency}`);
  }

  generatePaymentId() {
    return `pay_${crypto.randomBytes(16).toString("hex")}`;
  }

  generateEscrowId() {
    return `escrow_${crypto.randomBytes(16).toString("hex")}`;
  }

  generateCryptoAddress(currency) {
    // Generate mock crypto address
    return `0x${crypto.randomBytes(20).toString("hex")}`;
  }

  generateQRCode(address, amount, currency) {
    // Generate QR code data
    return `crypto:${currency}:${address}?amount=${amount}`;
  }

  formatAmount(amount, currency) {
    const currencyInfo = this.currencies[currency];
    return (amount / Math.pow(10, currencyInfo.decimals)).toFixed(
      currencyInfo.decimals
    );
  }

  formatCryptoAmount(amount, currency) {
    const currencyInfo = this.currencies[currency];
    return (amount / Math.pow(10, currencyInfo.decimals)).toString();
  }

  getBankDetails(currency) {
    // Mock bank details - in production, these would be real bank accounts
    return {
      name: "Fylaro Financial Bank",
      accountNumber: "1234567890",
      routingNumber: "021000021",
      swiftCode: "FYARUS33",
      address: "123 Financial St, New York, NY 10001",
    };
  }

  async verifyCryptoTransaction(txHash, address, amount, currency) {
    // Mock verification - in production, verify on actual blockchain
    return true;
  }

  async createStripePaymentIntent(
    paymentId,
    amount,
    currency,
    description,
    metadata
  ) {
    // Mock Stripe integration
    return {
      type: "stripe",
      clientSecret: `pi_${crypto.randomBytes(24).toString("hex")}`,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };
  }

  async confirmStripePayment(payment, paymentData) {
    // Mock Stripe confirmation
    return {
      status: "completed",
      transactionId: `pi_${crypto.randomBytes(24).toString("hex")}`,
      confirmedAt: new Date(),
    };
  }

  async createPayPalOrder(paymentId, amount, currency, description, metadata) {
    // Mock PayPal integration
    return {
      type: "paypal",
      orderId: `PAYPAL_${crypto.randomBytes(16).toString("hex")}`,
      approvalUrl: `https://paypal.com/approve/${paymentId}`,
    };
  }

  async confirmPayPalPayment(payment, paymentData) {
    // Mock PayPal confirmation
    return {
      status: "completed",
      transactionId: `PAYPAL_${crypto.randomBytes(16).toString("hex")}`,
      confirmedAt: new Date(),
    };
  }

  // Get service statistics
  getStats() {
    const totalPayments = this.paymentHistory.length;
    const activePayments = this.activePayments.size;
    const totalVolume = this.paymentHistory.reduce(
      (sum, p) => sum + p.amount,
      0
    );
    const successRate =
      this.paymentHistory.length > 0
        ? (this.paymentHistory.filter((p) => p.status === "completed").length /
            this.paymentHistory.length) *
          100
        : 0;

    return {
      totalPayments,
      activePayments,
      totalVolume,
      successRate: Math.round(successRate * 100) / 100,
      supportedCurrencies: Object.keys(this.currencies),
      supportedMethods: Object.values(this.paymentMethods),
    };
  }
}

module.exports = PaymentProcessorService;
