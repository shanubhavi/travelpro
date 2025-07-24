// ============================================
// src/middleware/websocket.js - WebSocket Middleware
// ============================================
const jwt = require("jsonwebtoken");

class NotificationService {
  constructor() {
    this.subscribers = new Map(); // userId -> WebSocket connection
  }

  // Subscribe user to notifications
  subscribe(userId, ws) {
    this.subscribers.set(userId, ws);

    ws.on("close", () => {
      this.subscribers.delete(userId);
      console.log(`User ${userId} disconnected from WebSocket`);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      this.subscribers.delete(userId);
    });

    console.log(`User ${userId} connected to WebSocket`);
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    const ws = this.subscribers.get(userId);
    if (ws && ws.readyState === 1) {
      // WebSocket.OPEN
      try {
        ws.send(JSON.stringify(notification));
        return true;
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        this.subscribers.delete(userId);
        return false;
      }
    }
    return false;
  }

  // Send notification to all company users
  async sendToCompany(companyId, notification, excludeUserId = null) {
    // This would require database access to get company users
    // For now, we'll just return the notification object
    return notification;
  }

  // Get connected users count
  getConnectedCount() {
    return this.subscribers.size;
  }

  // Get connected user IDs
  getConnectedUsers() {
    return Array.from(this.subscribers.keys());
  }
}

// Create singleton instance
const notificationService = new NotificationService();

const setupWebSocket = (server) => {
  // Check if ws module is available
  let WebSocket;
  try {
    WebSocket = require("ws");
  } catch (error) {
    console.log("⚠️  WebSocket module not found. WebSocket features disabled.");
    console.log("   Install with: npm install ws");
    return null;
  }

  const wss = new WebSocket.Server({
    server,
    path: "/ws",
  });

  console.log("🔌 WebSocket server initialized on /ws");

  wss.on("connection", async (ws, req) => {
    try {
      // Extract token from query parameters or headers
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token =
        url.searchParams.get("token") ||
        req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        ws.close(1008, "Authentication required");
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Subscribe user to notifications
      notificationService.subscribe(userId, ws);

      // Send connection confirmation
      ws.send(
        JSON.stringify({
          type: "connection_established",
          message: "WebSocket connection established",
          userId: userId,
          timestamp: new Date().toISOString(),
        })
      );

      // Handle incoming messages
      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message);

          switch (data.type) {
            case "ping":
              ws.send(
                JSON.stringify({
                  type: "pong",
                  timestamp: new Date().toISOString(),
                })
              );
              break;

            case "subscribe_notifications":
              ws.send(
                JSON.stringify({
                  type: "subscription_confirmed",
                  message: "Subscribed to notifications",
                  timestamp: new Date().toISOString(),
                })
              );
              break;

            default:
              console.log("Unknown WebSocket message type:", data.type);
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Unknown message type",
                  timestamp: new Date().toISOString(),
                })
              );
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
              timestamp: new Date().toISOString(),
            })
          );
        }
      });
    } catch (error) {
      console.error("WebSocket connection error:", error);
      ws.close(1008, "Authentication failed");
    }
  });

  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  // Cleanup on server shutdown
  process.on("SIGTERM", () => {
    wss.clients.forEach((ws) => {
      ws.close(1001, "Server shutting down");
    });
  });

  return { wss, notificationService };
};

module.exports = setupWebSocket;
module.exports.notificationService = notificationService;
