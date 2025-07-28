const db = require("../config/database");

class AnalyticsService {
  // Get comprehensive company analytics
  async getCompanyAnalytics(companyId, dateRange = "30") {
    try {
      const analytics = {};

      // User engagement metrics
      analytics.userEngagement = await db.query(
        `
        SELECT 
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as weekly_active,
          COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id END) as monthly_active,
          AVG(DATEDIFF(NOW(), u.created_at)) as avg_user_age_days
        FROM users u
        WHERE u.company_id = ? AND u.status = 'active'
      `,
        [companyId]
      );

      // Quiz performance metrics
      analytics.quizPerformance = await db.query(
        `
        SELECT 
          COUNT(*) as total_attempts,
          COUNT(CASE WHEN qr.passed = 1 THEN 1 END) as passed_attempts,
          AVG(qr.score) as average_score,
          AVG(qr.time_spent) as average_time_minutes,
          COUNT(CASE WHEN qr.score = 100 THEN 1 END) as perfect_scores
        FROM quiz_results qr
        JOIN users u ON qr.user_id = u.id
        WHERE u.company_id = ? AND qr.completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `,
        [companyId, dateRange]
      );

      // Learning progress over time
      analytics.progressOverTime = await db.query(
        `
        SELECT 
          DATE(qr.completed_at) as date,
          COUNT(*) as quiz_attempts,
          AVG(qr.score) as avg_score,
          COUNT(DISTINCT qr.user_id) as unique_users
        FROM quiz_results qr
        JOIN users u ON qr.user_id = u.id
        WHERE u.company_id = ? AND qr.completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(qr.completed_at)
        ORDER BY date ASC
      `,
        [companyId, dateRange]
      );

      // Top performers
      analytics.topPerformers = await db.query(
        `
        SELECT 
          u.name,
          COUNT(qr.id) as quiz_count,
          AVG(qr.score) as avg_score,
          SUM(up.points) as total_points,
          COUNT(DISTINCT ub.badge_id) as badge_count
        FROM users u
        LEFT JOIN quiz_results qr ON u.id = qr.user_id
        LEFT JOIN user_points up ON u.id = up.user_id
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        WHERE u.company_id = ? AND u.status = 'active'
        GROUP BY u.id
        ORDER BY total_points DESC, avg_score DESC
        LIMIT 10
      `,
        [companyId]
      );

      // Destination popularity
      analytics.destinationPopularity = await db.query(
        `
        SELECT 
          d.name,
          d.country,
          COUNT(qr.id) as quiz_attempts,
          AVG(qr.score) as avg_score
        FROM destinations d
        JOIN quizzes q ON d.id = q.destination_id
        JOIN quiz_results qr ON q.id = qr.quiz_id
        JOIN users u ON qr.user_id = u.id
        WHERE u.company_id = ?
        GROUP BY d.id
        ORDER BY quiz_attempts DESC
      `,
        [companyId]
      );

      // Badge distribution
      analytics.badgeDistribution = await db.query(
        `
        SELECT 
          b.name,
          b.rarity,
          COUNT(ub.id) as earned_count,
          (COUNT(ub.id) * 100.0 / (SELECT COUNT(*) FROM users WHERE company_id = ? AND status = 'active')) as percentage
        FROM badges b
        LEFT JOIN user_badges ub ON b.id = ub.badge_id
        LEFT JOIN users u ON ub.user_id = u.id AND u.company_id = ?
        GROUP BY b.id
        ORDER BY earned_count DESC
      `,
        [companyId, companyId]
      );

      return analytics;
    } catch (error) {
      console.error("Analytics service error:", error);
      throw error;
    }
  }

  // Generate user progress report
  async getUserProgressReport(userId) {
    try {
      const report = {};

      // Basic user stats
      report.userStats = await db.query(
        `
        SELECT 
          u.name,
          u.email,
          u.created_at,
          u.last_login,
          COALESCE(SUM(up.points), 0) as total_points,
          COUNT(DISTINCT ub.badge_id) as badge_count,
          COALESCE(ls.current_streak, 0) as current_streak,
          COALESCE(ls.longest_streak, 0) as longest_streak
        FROM users u
        LEFT JOIN user_points up ON u.id = up.user_id
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        LEFT JOIN learning_streaks ls ON u.id = ls.user_id
        WHERE u.id = ?
        GROUP BY u.id
      `,
        [userId]
      );

      // Quiz history
      report.quizHistory = await db.query(
        `
        SELECT 
          q.title,
          d.name as destination,
          qr.score,
          qr.points_earned,
          qr.time_spent,
          qr.passed,
          qr.completed_at
        FROM quiz_results qr
        JOIN quizzes q ON qr.quiz_id = q.id
        LEFT JOIN destinations d ON q.destination_id = d.id
        WHERE qr.user_id = ?
        ORDER BY qr.completed_at DESC
      `,
        [userId]
      );

      // Points history
      report.pointsHistory = await db.query(
        `
        SELECT 
          points,
          source,
          description,
          created_at
        FROM user_points
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 20
      `,
        [userId]
      );

      // Achievement timeline
      report.achievements = await db.query(
        `
        SELECT 
          b.name,
          b.description,
          b.icon,
          b.points_reward,
          ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?
        ORDER BY ub.earned_at DESC
      `,
        [userId]
      );

      return report;
    } catch (error) {
      console.error("User progress report error:", error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
