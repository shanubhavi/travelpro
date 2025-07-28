const db = require("../config/database");

class NotificationService {
  constructor() {
    this.subscribers = new Map(); // userId -> WebSocket connection
  }

  // Subscribe user to notifications
  subscribe(userId, ws) {
    this.subscribers.set(userId, ws);

    ws.on("close", () => {
      this.subscribers.delete(userId);
    });
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    const ws = this.subscribers.get(userId);
    if (ws && ws.readyState === 1) {
      // WebSocket.OPEN
      ws.send(JSON.stringify(notification));
    }

    // Store notification in database
    await this.storeNotification(userId, notification);
  }

  // Send notification to all company users
  async sendToCompany(companyId, notification, excludeUserId = null) {
    const users = await db.query(
      'SELECT id FROM users WHERE company_id = ? AND status = "active" AND id != ?',
      [companyId, excludeUserId || 0]
    );

    for (const user of users) {
      await this.sendToUser(user.id, notification);
    }
  }

  // Store notification in database
  async storeNotification(userId, notification) {
    try {
      await db.query(
        "INSERT INTO notifications (user_id, type, title, message, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [
          userId,
          notification.type,
          notification.title,
          notification.message,
          JSON.stringify(notification.data || {}),
        ]
      );
    } catch (error) {
      console.error("Store notification error:", error);
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const notifications = await db.query(
        `
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `,
        [userId, limit, offset]
      );

      return notifications.map((n) => ({
        ...n,
        data: JSON.parse(n.data || "{}"),
      }));
    } catch (error) {
      console.error("Get notifications error:", error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      await db.query(
        "UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?",
        [notificationId, userId]
      );
    } catch (error) {
      console.error("Mark notification as read error:", error);
    }
  }

  // Badge achievement notification
  async notifyBadgeEarned(userId, badge) {
    const notification = {
      type: "badge_earned",
      title: "🎉 New Badge Earned!",
      message: `Congratulations! You've earned the "${badge.name}" badge`,
      data: {
        badgeId: badge.id,
        badgeName: badge.name,
        badgeIcon: badge.icon,
        pointsReward: badge.points_reward,
      },
    };

    await this.sendToUser(userId, notification);
  }

  // Quiz completion notification
  async notifyQuizCompleted(userId, quizResult) {
    const notification = {
      type: "quiz_completed",
      title: quizResult.passed ? "✅ Quiz Passed!" : "❌ Quiz Failed",
      message: `You scored ${quizResult.score}% on ${quizResult.quizTitle}`,
      data: {
        quizId: quizResult.quizId,
        score: quizResult.score,
        passed: quizResult.passed,
        pointsEarned: quizResult.pointsEarned,
      },
    };

    await this.sendToUser(userId, notification);
  }

  // Content approval notification
  async notifyContentApproved(userId, submission) {
    const notification = {
      type: "content_approved",
      title: "✅ Content Approved!",
      message: `Your content submission for ${submission.destinationName} has been approved`,
      data: {
        submissionId: submission.id,
        destinationName: submission.destinationName,
        pointsEarned: 50,
      },
    };

    await this.sendToUser(userId, notification);
  }

  // Leaderboard position change
  async notifyRankChange(userId, oldRank, newRank, companyId) {
    if (newRank < oldRank) {
      // Rank improved (lower number is better)
      const notification = {
        type: "rank_improved",
        title: "📈 Rank Improved!",
        message: `You moved up to rank #${newRank} in your company!`,
        data: {
          oldRank,
          newRank,
          companyId,
        },
      };

      await this.sendToUser(userId, notification);
    }
  }
}

module.exports = new NotificationService();
