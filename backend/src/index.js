const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import database connection and models
const { connectDB } = require("./models");

// Import services
const WebSocketService = require("./services/websocketService");
const IPFSService = require("./services/ipfsService");
const AdvancedCreditScoring = require("./services/advancedCreditScoring");
const OrderMatchingEngine = require("./services/orderMatchingEngine");
const BlockchainIntegrationService = require("./services/blockchainIntegrationService");
const PaymentProcessorService = require("./services/paymentProcessor");
const DocumentManagerService = require("./services/documentManager");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize database connection
connectDB()
  .then((conn) => {
    if (conn) {
      console.log("✅ Database connected successfully");
    }
  })
  .catch((err) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "⚠️ Database connection failed but continuing in development mode"
      );
    } else {
      console.error("❌ Database connection failed:", err);
      process.exit(1);
    }
  });

// Initialize services
const websocketService = new WebSocketService(server);
const ipfsService = new IPFSService();
const creditScoring = new AdvancedCreditScoring();
const orderMatchingEngine = new OrderMatchingEngine(websocketService);
const blockchainService = new BlockchainIntegrationService();
const paymentProcessor = new PaymentProcessorService();
const documentManager = new DocumentManagerService();

// Make services available to routes
app.locals.websocketService = websocketService;
app.locals.ipfsService = ipfsService;
app.locals.creditScoring = creditScoring;
app.locals.orderMatchingEngine = orderMatchingEngine;
app.locals.blockchainService = blockchainService;
app.locals.paymentProcessor = paymentProcessor;
app.locals.documentManager = documentManager;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Enhanced rate limiting with different limits for different endpoints
const createRateLimit = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });

// General API rate limiting
app.use("/api/", createRateLimit(15 * 60 * 1000, 100, "Too many requests"));

// Stricter limits for sensitive operations
app.use(
  "/api/auth/login",
  createRateLimit(15 * 60 * 1000, 5, "Too many login attempts")
);
app.use(
  "/api/auth/register",
  createRateLimit(60 * 60 * 1000, 3, "Too many registration attempts")
);
app.use(
  "/api/invoices/upload",
  createRateLimit(60 * 60 * 1000, 10, "Too many upload attempts")
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`
  );
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/invoices", require("./routes/invoices"));
app.use("/api/marketplace", require("./routes/marketplace"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/kyc", require("./routes/kyc"));
app.use("/api/blockchain", require("./routes/blockchain"));

// New enhanced routes
app.use("/api/trading", require("./routes/trading"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/credit-scoring", require("./routes/creditScoring"));
app.use("/api/websocket", require("./routes/websocket"));

// AI-powered verification routes
app.use("/api/ai-verification", require("./routes/aiVerification"));

// Finternet integration routes
app.use("/api/finternet-sso", require("./routes/finternetSSO"));
app.use("/api/compliance", require("./routes/compliance"));
app.use("/api/cross-border", require("./routes/crossBorder"));
app.use("/api/finternet-bridge", require("./routes/finternetBridge"));
app.use("/api/universal-assets", require("./routes/universalAssets"));

// API route registry for docs
app.get("/api/docs/routes", (req, res) => {
  const routes = [];

  const walk = (stack, prefix = "") => {
    stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods)
          .filter((m) => layer.route.methods[m])
          .map((m) => m.toUpperCase());
        routes.push({
          method: methods.join(","),
          path: prefix + layer.route.path,
        });
      } else if (
        layer.name === "router" &&
        layer.handle &&
        layer.handle.stack
      ) {
        const newPrefix =
          layer.regexp && layer.regexp.fast_star
            ? prefix
            : layer.regexp && layer.regexp.fast_slash
            ? prefix
            : layer.regexp && layer.regexp.toString().includes("^\\/api")
            ? prefix
            : prefix;
        walk(layer.handle.stack, prefix);
      }
    });
  };

  if (app && app._router && app._router.stack) {
    walk(app._router.stack);
  }

  // Only include API routes
  const apiRoutes = routes
    .filter((r) => typeof r.path === "string" && r.path.startsWith("/api/"))
    .sort(
      (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)
    );

  res.json({ routes: apiRoutes });
});

// Health check with service status
app.get("/health", (req, res) => {
  const healthStatus = {
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Fylaro Backend API",
    version: process.env.npm_package_version || "1.0.0",
    services: {
      websocket: {
        status: "running",
        connections: websocketService.getConnectionStats().totalConnections,
      },
      ipfs: {
        status: "available",
      },
      orderMatching: {
        status: "running",
        activeOrders: orderMatchingEngine.pendingOrders.size,
      },
      creditScoring: {
        status: "available",
      },
    },
    environment: process.env.NODE_ENV || "development",
  };

  res.json(healthStatus);
});

// Service status endpoint
app.get("/api/status", (req, res) => {
  const connectionStats = websocketService.getConnectionStats();
  const marketStats = orderMatchingEngine.getMarketStats();

  res.json({
    websocket: connectionStats,
    trading: {
      marketStats,
      pendingOrders: orderMatchingEngine.pendingOrders.size,
      recentTrades: orderMatchingEngine.tradeHistory.slice(-10),
    },
    timestamp: Date.now(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : "Internal server error",
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

// Start cleanup intervals
orderMatchingEngine.startCleanupInterval();

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Fylaro Backend API running on port ${PORT}`);
  console.log(`📊 WebSocket server initialized`);
  console.log(`📄 IPFS service ready`);
  console.log(`💹 Order matching engine started`);
  console.log(`🔍 Credit scoring system active`);
  console.log(`� Environment: ${process.env.NODE_ENV || "development"}`);
});
