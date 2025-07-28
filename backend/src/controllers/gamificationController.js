const db = require("../config/database");

class GamificationController {
  // Get company leaderboard
  async getLeaderboard(req, res) {
    try {
      const { companyId } = req.params;

      // Verify user has access to this company's data
      if (
        req.user.company_id !== parseInt(companyId) &&
        req.user.role !== "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      const leaderboard = await db.query(
        `
        SELECT 
          u.id,
          u.name,
          COALESCE(SUM(up.points), 0) as total_points,
          COUNT(DISTINCT ub.badge_id) as badge_count,
          COALESCE(ls.current_streak, 0) as current_streak,
          COUNT(DISTINCT qr.id) as quiz_count,
          COALESCE(AVG(qr.score), 0) as average_score
        FROM users u
        LEFT JOIN user_points up ON u.id = up.user_id
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        LEFT JOIN learning_streaks ls ON u.id = ls.user_id
        LEFT JOIN quiz_results qr ON u.id = qr.user_id
        WHERE u.company_id = ? AND u.status = 'active'
        GROUP BY u.id
        ORDER BY total_points DESC, average_score DESC
      `,
        [companyId]
      );

      // Add rank to each user
      const rankedLeaderboard = leaderboard.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      res.json({
        success: true,
        data: rankedLeaderboard,
      });
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch leaderboard",
      });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const { userId } = req.params;

      // Check access rights
      if (
        req.user.id !== parseInt(userId) &&
        req.user.role !== "company_admin" &&
        req.user.role !== "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      const [stats] = await db.query(
        `
        SELECT 
          u.id,
          u.name,
          COALESCE(SUM(up.points), 0) as total_points,
          COUNT(DISTINCT ub.badge_id) as badge_count,
          COALESCE(ls.current_streak, 0) as current_streak,
          COALESCE(ls.longest_streak, 0) as longest_streak,
          COUNT(DISTINCT qr.id) as quiz_count,
          COUNT(DISTINCT CASE WHEN qr.passed = 1 THEN qr.id END) as passed_quizzes,
          COALESCE(AVG(qr.score), 0) as average_score,
          COUNT(DISTINCT CASE WHEN qr.score = 100 THEN qr.id END) as perfect_scores
        FROM users u
        LEFT JOIN user_points up ON u.id = up.user_id
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        LEFT JOIN learning_streaks ls ON u.id = ls.user_id
        LEFT JOIN quiz_results qr ON u.id = qr.user_id
        WHERE u.id = ?
        GROUP BY u.id
      `,
        [userId]
      );

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Get user's badges
      const badges = await db.query(
        `
        SELECT b.*, ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?
        ORDER BY ub.earned_at DESC
      `,
        [userId]
      );

      // Get recent points history
      const pointsHistory = await db.query(
        `
        SELECT 
          points,
          source,
          description,
          created_at
        FROM user_points
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `,
        [userId]
      );

      // Get user's rank in company
      const [rankResult] = await db.query(
        `
        SELECT COUNT(*) + 1 as rank
        FROM (
          SELECT u.id, COALESCE(SUM(up.points), 0) as total_points
          FROM users u
          LEFT JOIN user_points up ON u.id = up.user_id
          WHERE u.company_id = ? AND u.status = 'active'
          GROUP BY u.id
          HAVING total_points > (
            SELECT COALESCE(SUM(up2.points), 0)
            FROM user_points up2
            WHERE up2.user_id = ?
          )
        ) as higher_users
      `,
        [req.user.company_id, userId]
      );

      res.json({
        success: true,
        data: {
          ...stats,
          rank: rankResult.rank,
          badges,
          pointsHistory,
        },
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user statistics",
      });
    }
  }

  // Get all available badges
  async getBadges(req, res) {
    try {
      const badges = await db.query(
        "SELECT * FROM badges ORDER BY rarity DESC, name ASC"
      );

      res.json({
        success: true,
        data: badges,
      });
    } catch (error) {
      console.error("Get badges error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch badges",
      });
    }
  }

  // Get company analytics (admin only)
  async getCompanyAnalytics(req, res) {
    try {
      const { companyId } = req.params;

      // Verify admin access
      if (
        req.user.role !== "company_admin" &&
        req.user.role !== "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      if (
        req.user.company_id !== parseInt(companyId) &&
        req.user.role !== "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      const analytics = await db.query(
        `
        SELECT 
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as active_users,
          COUNT(DISTINCT qr.id) as total_quiz_attempts,
          COALESCE(AVG(qr.score), 0) as average_score,
          COUNT(DISTINCT CASE WHEN qr.passed = 1 THEN qr.id END) as passed_attempts,
          COUNT(DISTINCT d.id) as destinations_viewed
        FROM users u
        LEFT JOIN quiz_results qr ON u.id = qr.user_id
        LEFT JOIN destinations d ON d.created_by = u.id
        WHERE u.company_id = ?
      `,
        [companyId]
      );

      // Get weekly activity data
      const weeklyActivity = await db.query(
        `
        SELECT 
          DATE(qr.completed_at) as date,
          COUNT(*) as quiz_attempts,
          AVG(qr.score) as avg_score
        FROM quiz_results qr
        JOIN users u ON qr.user_id = u.id
        WHERE u.company_id = ? AND qr.completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(qr.completed_at)
        ORDER BY date DESC
      `,
        [companyId]
      );

      res.json({
        success: true,
        data: {
          overview: analytics[0],
          weeklyActivity,
        },
      });
    } catch (error) {
      console.error("Get company analytics error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch analytics",
      });
    }
  }
}

module.exports = new GamificationController();
