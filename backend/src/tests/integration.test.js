// Integration tests for Fylaro platform
const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");

describe("Fylaro Platform Integration Tests", () => {
  let authToken;
  let testUserId;
  let testInvoiceId;
  let testPaymentId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/fylaro-test"
    );
  });

  afterAll(async () => {
    // Clean up test database
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  describe("Authentication Flow", () => {
    test("User Registration", async () => {
      const userData = {
        email: "test@fylaro.com",
        password: "TestPassword123!",
        firstName: "Test",
        lastName: "User",
        userType: "business",
        companyName: "Test Company",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      testUserId = response.body.data.user._id;
    });

    test("User Login", async () => {
      const loginData = {
        email: "test@fylaro.com",
        password: "TestPassword123!",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      authToken = response.body.data.token;
    });
  });

  describe("Invoice Management Flow", () => {
    test("Upload Invoice", async () => {
      const invoiceData = {
        amount: 125000,
        dueDate: "2024-03-15",
        debtorName: "Test Debtor",
        debtorEmail: "debtor@test.com",
        description: "Test invoice for integration testing",
        industry: "technology",
        invoiceNumber: "INV-TEST-001",
      };

      const response = await request(app)
        .post("/api/invoices/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("amount", invoiceData.amount)
        .field("dueDate", invoiceData.dueDate)
        .field("debtorName", invoiceData.debtorName)
        .field("debtorEmail", invoiceData.debtorEmail)
        .field("description", invoiceData.description)
        .field("industry", invoiceData.industry)
        .field("invoiceNumber", invoiceData.invoiceNumber)
        .expect(201);

      expect(response.body.message).toBe("Invoice uploaded successfully");
      expect(response.body.invoiceId).toBeDefined();
      testInvoiceId = response.body.invoiceId;
    });

    test("Get User Invoices", async () => {
      const response = await request(app)
        .get("/api/invoices/my-invoices")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.invoices).toBeDefined();
      expect(response.body.invoices.length).toBeGreaterThan(0);
    });
  });

  describe("Marketplace Flow", () => {
    test("Get Marketplace Listings", async () => {
      const response = await request(app)
        .get("/api/marketplace/listings")
        .expect(200);

      expect(response.body.listings).toBeDefined();
    });

    test("Place Bid on Listing", async () => {
      const bidData = {
        amount: 1000,
        message: "Test bid for integration testing",
      };

      // First get a listing ID
      const listingsResponse = await request(app)
        .get("/api/marketplace/listings")
        .expect(200);

      if (listingsResponse.body.listings.length > 0) {
        const listingId = listingsResponse.body.listings[0].id;

        const response = await request(app)
          .post(`/api/marketplace/listings/${listingId}/bid`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(bidData)
          .expect(201);

        expect(response.body.message).toBe("Bid placed successfully");
      }
    });
  });

  describe("Trading Flow", () => {
    test("Get Order Book", async () => {
      const response = await request(app)
        .get("/api/trading/orderbook/INV-USD")
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test("Place Trading Order", async () => {
      const orderData = {
        tradingPair: "INV-USD",
        side: "buy",
        type: "market",
        quantity: 100,
        price: 0.95,
      };

      const response = await request(app)
        .post("/api/trading/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toBeDefined();
    });
  });

  describe("Payment Processing Flow", () => {
    test("Create Payment Intent", async () => {
      const paymentData = {
        amount: 1000,
        currency: "USD",
        paymentMethod: "credit_card",
        description: "Test payment for integration testing",
        metadata: {
          invoiceId: testInvoiceId,
        },
      };

      const response = await request(app)
        .post("/api/payments/create-intent")
        .set("Authorization", `Bearer ${authToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentId).toBeDefined();
      testPaymentId = response.body.data.paymentId;
    });

    test("Get Payment Status", async () => {
      const response = await request(app)
        .get(`/api/payments/status/${testPaymentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPaymentId);
    });
  });

  describe("Document Management Flow", () => {
    test("Upload Document", async () => {
      const documentData = {
        type: "invoice",
        description: "Test document for integration testing",
      };

      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("type", documentData.type)
        .field("description", documentData.description)
        .attach(
          "file",
          Buffer.from("test document content"),
          "test-document.pdf"
        )
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documentId).toBeDefined();
    });

    test("Get Document", async () => {
      // First upload a document
      const uploadResponse = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("type", "invoice")
        .attach(
          "file",
          Buffer.from("test document content"),
          "test-document.pdf"
        )
        .expect(201);

      const documentId = uploadResponse.body.data.documentId;

      const response = await request(app)
        .get(`/api/documents/${documentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(documentId);
    });
  });

  describe("Finternet Integration Flow", () => {
    test("Create Finternet Identity", async () => {
      const identityData = {
        walletAddress: "0x1234567890123456789012345678901234567890",
        provider: "metamask",
      };

      const response = await request(app)
        .post("/api/finternet-sso/identity")
        .set("Authorization", `Bearer ${authToken}`)
        .send(identityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.identityId).toBeDefined();
    });

    test("Check Compliance", async () => {
      const complianceData = {
        transaction: {
          amount: 1000,
          currency: "USD",
          fromCountry: "US",
          toCountry: "CA",
          type: "invoice_payment",
        },
        jurisdictions: ["US", "CA"],
      };

      const response = await request(app)
        .post("/api/compliance/check")
        .set("Authorization", `Bearer ${authToken}`)
        .send(complianceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.compliant).toBeDefined();
    });

    test("Create Cross-Border Settlement", async () => {
      const settlementData = {
        payerJurisdiction: "US",
        payeeJurisdiction: "CA",
        payerCurrency: "USD",
        payeeCurrency: "CAD",
        amount: 1000,
        description: "Test cross-border settlement",
      };

      const response = await request(app)
        .post("/api/cross-border/settlement")
        .set("Authorization", `Bearer ${authToken}`)
        .send(settlementData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settlementId).toBeDefined();
    });

    test("Create Universal Asset", async () => {
      const assetData = {
        assetType: "invoice_token",
        issuer: testUserId,
        metadata: {
          name: "Test Invoice Token",
          description: "Test universal asset for integration testing",
          value: 1000,
          currency: "USD",
        },
        compliance: {
          jurisdictions: ["US"],
          verified: true,
        },
      };

      const response = await request(app)
        .post("/api/universal-assets/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assetId).toBeDefined();
    });
  });

  describe("Credit Scoring Flow", () => {
    test("Get Credit Score", async () => {
      const response = await request(app)
        .get("/api/credit-scoring/score")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.score).toBeDefined();
    });

    test("Update Credit Data", async () => {
      const creditData = {
        paymentHistory: [
          { date: "2024-01-01", amount: 1000, onTime: true },
          { date: "2024-02-01", amount: 1500, onTime: true },
        ],
        businessMetrics: {
          revenue: 100000,
          expenses: 75000,
          profitMargin: 0.25,
        },
      };

      const response = await request(app)
        .post("/api/credit-scoring/update")
        .set("Authorization", `Bearer ${authToken}`)
        .send(creditData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("KYC Flow", () => {
    test("Submit KYC Application", async () => {
      const kycData = {
        personalInfo: {
          firstName: "Test",
          lastName: "User",
          dateOfBirth: "1990-01-01",
          nationality: "US",
        },
        contactInfo: {
          email: "test@fylaro.com",
          phone: "+1234567890",
          address: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zipCode: "12345",
            country: "US",
          },
        },
        businessInfo: {
          companyName: "Test Company",
          businessType: "LLC",
          registrationNumber: "123456789",
          industry: "Technology",
        },
      };

      const response = await request(app)
        .post("/api/kyc/submit")
        .set("Authorization", `Bearer ${authToken}`)
        .send(kycData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.kycId).toBeDefined();
    });

    test("Get KYC Status", async () => {
      const response = await request(app)
        .get("/api/kyc/status")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
    });
  });

  describe("Analytics Flow", () => {
    test("Get Analytics Overview", async () => {
      const response = await request(app)
        .get("/api/analytics/overview")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe("WebSocket Connection", () => {
    test("WebSocket Health Check", async () => {
      const response = await request(app)
        .get("/api/websocket/health")
        .expect(200);

      expect(response.body.status).toBe("OK");
    });
  });

  describe("System Health", () => {
    test("Main Health Check", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.status).toBe("OK");
      expect(response.body.service).toBe("Fylaro Backend API");
    });

    test("API Status Check", async () => {
      const response = await request(app).get("/api/status").expect(200);

      expect(response.body.websocket).toBeDefined();
      expect(response.body.trading).toBeDefined();
    });
  });
});
