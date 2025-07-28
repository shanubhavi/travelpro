const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const notificationService = require("../services/notificationService");

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({
    server,
    path: "/ws",
  });

  wss.on("connection", async (ws, req) => {
    try {
      // Extract token from query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

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
        })
      );

      // Handle incoming messages
      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message);

          switch (data.type) {
            case "ping":
              ws.send(JSON.stringify({ type: "pong" }));
              break;
            case "mark_notification_read":
              await notificationService.markAsRead(data.notificationId, userId);
              break;
            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      });
    } catch (error) {
      console.error("WebSocket connection error:", error);
      ws.close(1008, "Authentication failed");
    }
  });

  return wss;
};

module.exports = setupWebSocket;
