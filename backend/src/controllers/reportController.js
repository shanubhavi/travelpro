const db = require("../config/database");
const analyticsService = require("../services/analyticsService");

class ReportController {
  // Generate company performance report
  async generateCompanyReport(req, res) {
    try {
      const { companyId } = req.params;
      const { dateRange = "30", format = "json" } = req.query;

      // Verify access
      if (
        req.user.company_id !== parseInt(companyId) &&
        req.user.role !== "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      const analytics = await analyticsService.getCompanyAnalytics(
        companyId,
        dateRange
      );

      if (format === "csv") {
        return this.generateCSVReport(res, analytics);
      }

      res.json({
        success: true,
        data: analytics,
        generatedAt: new Date().toISOString(),
        dateRange: `${dateRange} days`,
      });
    } catch (error) {
      console.error("Generate company report error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate report",
      });
    }
  }

  // Generate user progress report
  async generateUserReport(req, res) {
    try {
      const { userId } = req.params;

      // Verify access
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

      const report = await analyticsService.getUserProgressReport(userId);

      res.json({
        success: true,
        data: report,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Generate user report error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate user report",
      });
    }
  }

  // Generate CSV format report
  generateCSVReport(res, analytics) {
    let csv = "Report Type,Metric,Value\n";

    // User engagement
    csv += `User Engagement,Total Users,${analytics.userEngagement[0].total_users}\n`;
    csv += `User Engagement,Weekly Active,${analytics.userEngagement[0].weekly_active}\n`;
    csv += `User Engagement,Monthly Active,${analytics.userEngagement[0].monthly_active}\n`;

    // Quiz performance
    csv += `Quiz Performance,Total Attempts,${analytics.quizPerformance[0].total_attempts}\n`;
    csv += `Quiz Performance,Passed Attempts,${analytics.quizPerformance[0].passed_attempts}\n`;
    csv += `Quiz Performance,Average Score,${analytics.quizPerformance[0].average_score}\n`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=company-report.csv"
    );
    res.send(csv);
  }

  // Get quiz analytics
  async getQuizAnalytics(req, res) {
    try {
      const { quizId } = req.params;

      const analytics = await db.query(
        `
        SELECT 
          q.title,
          q.difficulty,
          COUNT(qr.id) as total_attempts,
          COUNT(CASE WHEN qr.passed = 1 THEN 1 END) as passed_attempts,
          AVG(qr.score) as average_score,
          AVG(qr.time_spent) as average_time,
          COUNT(CASE WHEN qr.score = 100 THEN 1 END) as perfect_scores,
          MIN(qr.score) as min_score,
          MAX(qr.score) as max_score
        FROM quizzes q
        LEFT JOIN quiz_results qr ON q.id = qr.quiz_id
        WHERE q.id = ?
        GROUP BY q.id
      `,
        [quizId]
      );

      // Get question-level analytics
      const questionAnalytics = await db.query(
        `
        SELECT 
          qq.id,
          qq.question_text,
          qq.question_type,
          COUNT(qr.id) as total_responses
        FROM quiz_questions qq
        LEFT JOIN quiz_results qr ON JSON_EXTRACT(qr.answers, CONCAT('$[', qq.sort_order - 1, ']')) IS NOT NULL
        WHERE qq.quiz_id = ?
        GROUP BY qq.id
        ORDER BY qq.sort_order
      `,
        [quizId]
      );

      res.json({
        success: true,
        data: {
          quizAnalytics: analytics[0],
          questionAnalytics,
        },
      });
    } catch (error) {
      console.error("Get quiz analytics error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch quiz analytics",
      });
    }
  }
}

module.exports = new ReportController();
