// ============================================
// server.js - Robust Main Application Entry Point
// ============================================
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

// Create upload directories
const uploadDirs = [
  "uploads",
  "uploads/destinations",
  "uploads/user-avatars",
  "uploads/documents",
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Load routes with error handling
const loadRoute = (routePath, routeName) => {
  try {
    return require(routePath);
  } catch (error) {
    console.error(`❌ Failed to load ${routeName} routes:`, error.message);

    // Return a basic router with error message
    const errorRouter = express.Router();
    errorRouter.all("*", (req, res) => {
      res.status(503).json({
        success: false,
        error: `${routeName} service temporarily unavailable`,
      });
    });
    return errorRouter;
  }
};

// API Routes with error handling
try {
  app.use("/api/auth", loadRoute("./src/routes/auth", "Authentication"));
  console.log("✅ Authentication routes loaded");
} catch (error) {
  console.error("❌ Authentication routes failed to load");
}

try {
  app.use("/api/users", loadRoute("./src/routes/users", "Users"));
  console.log("✅ User routes loaded");
} catch (error) {
  console.error("❌ User routes failed to load");
}

try {
  app.use(
    "/api/destinations",
    loadRoute("./src/routes/destinations", "Destinations")
  );
  console.log("✅ Destination routes loaded");
} catch (error) {
  console.error("❌ Destination routes failed to load");
}

try {
  app.use("/api/quizzes", loadRoute("./src/routes/quizzes", "Quizzes"));
  console.log("✅ Quiz routes loaded");
} catch (error) {
  console.error("❌ Quiz routes failed to load");
}

try {
  app.use(
    "/api/gamification",
    loadRoute("./src/routes/gamification", "Gamification")
  );
  console.log("✅ Gamification routes loaded");
} catch (error) {
  console.error("❌ Gamification routes failed to load");
}

try {
  app.use(
    "/api/submissions",
    loadRoute("./src/routes/submissions", "Submissions")
  );
  console.log("✅ Submission routes loaded");
} catch (error) {
  console.error("❌ Submission routes failed to load");
}

try {
  app.use("/api/admin", loadRoute("./src/routes/admin", "Admin"));
  console.log("✅ Admin routes loaded");
} catch (error) {
  console.error("❌ Admin routes failed to load");
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: Math.floor(process.uptime()),
  });
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "TravelPro Academy API",
    version: "1.0.0",
    description: "Gamified Learning Management System for Travel Professionals",
    status: "operational",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      destinations: "/api/destinations",
      quizzes: "/api/quizzes",
      gamification: "/api/gamification",
      submissions: "/api/submissions",
      admin: "/api/admin",
    },
    features: {
      authentication: "JWT-based with role management",
      gamification: "Points, badges, and leaderboards",
      multiTenant: "Company-based data isolation",
      realTime: "WebSocket support (optional)",
      fileUploads: "Image and document support",
    },
    health: "/health",
  });
});

// WebSocket setup (optional)
let webSocketInfo = null;
try {
  const setupWebSocket = require("./src/middleware/websocket");
  const wsResult = setupWebSocket(server);
  if (wsResult) {
    webSocketInfo = wsResult;
    console.log("🔌 WebSocket server enabled");
  }
} catch (error) {
  console.log("⚠️  WebSocket features disabled (optional dependency)");
  console.log("   To enable WebSocket: npm install ws");
}

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.details,
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      error: "File too large",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expired",
    });
  }

  if (err.code === "ER_NO_SUCH_TABLE") {
    return res.status(500).json({
      success: false,
      error: "Database not properly initialized. Run: npm run setup",
    });
  }

  if (err.code && err.code.startsWith("ER_")) {
    return res.status(500).json({
      success: false,
      error: "Database error. Please check your configuration.",
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: "The requested endpoint does not exist",
    availableEndpoints: [
      "/api",
      "/health",
      "/api/auth",
      "/api/destinations",
      "/api/quizzes",
      "/api/gamification",
      "/api/users",
      "/api/submissions",
      "/api/admin",
    ],
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("\n🚀 TravelPro Academy Backend Server Started");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`📁 File Server: http://localhost:${PORT}/uploads/`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );

  if (webSocketInfo) {
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`👥 WebSocket Service: Available`);
  } else {
    console.log(`🔌 WebSocket: Disabled (install 'ws' to enable)`);
  }

  // Database connection check
  try {
    const db = require("./src/config/database");
    console.log("🗄️  Database: Connection pool initialized");
  } catch (error) {
    console.log(
      "⚠️  Database: Connection failed - check your .env configuration"
    );
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Server ready for connections");

  // Show next steps if this is first run
  if (!fs.existsSync(".env")) {
    console.log("\n📝 Next Steps:");
    console.log("1. Copy .env.example to .env");
    console.log("2. Configure your database settings in .env");
    console.log("3. Run: npm run setup");
    console.log("4. Run: npm run seed (optional sample data)");
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  server.close(() => {
    console.log("HTTP server closed");

    if (webSocketInfo && webSocketInfo.wss) {
      webSocketInfo.wss.clients.forEach((ws) => {
        ws.close(1001, "Server shutting down");
      });
      console.log("WebSocket connections closed");
    }

    // Close database connections
    try {
      const db = require("./src/config/database");
      db.close();
      console.log("Database connections closed");
    } catch (error) {
      // Database module might not be loaded
    }

    console.log("✅ Server shutdown complete");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});

module.exports = app;
