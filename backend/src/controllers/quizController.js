const db = require("../config/database");

class QuizController {
  // Get all quizzes
  async getAll(req, res) {
    try {
      const { destinationId, difficulty, limit = 20, offset = 0 } = req.query;

      let query = `
        SELECT q.*, d.name as destination_name,
               COUNT(qq.id) as question_count,
               AVG(qr.score) as average_score,
               COUNT(qr.id) as attempt_count
        FROM quizzes q
        LEFT JOIN destinations d ON q.destination_id = d.id
        LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
        LEFT JOIN quiz_results qr ON q.id = qr.quiz_id
        WHERE q.status = 'active'
      `;

      const params = [];

      if (destinationId) {
        query += " AND q.destination_id = ?";
        params.push(destinationId);
      }

      if (difficulty) {
        query += " AND q.difficulty = ?";
        params.push(difficulty);
      }

      query += " GROUP BY q.id ORDER BY q.created_at DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));

      const quizzes = await db.query(query, params);

      res.json({
        success: true,
        data: quizzes,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: quizzes.length,
        },
      });
    } catch (error) {
      console.error("Get quizzes error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch quizzes",
      });
    }
  }

  // Get quiz details with questions
  async getById(req, res) {
    try {
      const { id } = req.params;

      const quizzes = await db.query(
        `
        SELECT q.*, d.name as destination_name
        FROM quizzes q
        LEFT JOIN destinations d ON q.destination_id = d.id
        WHERE q.id = ? AND q.status = 'active'
      `,
        [id]
      );

      if (quizzes.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Quiz not found",
        });
      }

      const quiz = quizzes[0];

      // Get questions for the quiz
      const questions = await db.query(
        `
        SELECT id, question_text, question_type, options, explanation, points, sort_order
        FROM quiz_questions
        WHERE quiz_id = ?
        ORDER BY sort_order ASC
      `,
        [id]
      );

      quiz.questions = questions;

      res.json({
        success: true,
        data: quiz,
      });
    } catch (error) {
      console.error("Get quiz error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch quiz",
      });
    }
  }

  // Submit quiz answers
  async submitQuiz(req, res) {
    try {
      const { quizId } = req.params;
      const { answers, timeSpent } = req.body;

      // Get quiz details
      const quizzes = await db.query("SELECT * FROM quizzes WHERE id = ?", [
        quizId,
      ]);
      if (quizzes.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Quiz not found",
        });
      }

      const quiz = quizzes[0];

      // Get questions with correct answers
      const questions = await db.query(
        `
        SELECT id, correct_answer, points
        FROM quiz_questions
        WHERE quiz_id = ?
        ORDER BY sort_order ASC
      `,
        [quizId]
      );

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;
      let correctAnswers = 0;

      questions.forEach((question, index) => {
        totalPoints += question.points;
        const userAnswer = answers[index];
        const correctAnswer = JSON.parse(question.correct_answer);

        if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
          earnedPoints += question.points;
          correctAnswers++;
        }
      });

      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const passed = score >= quiz.passing_score;

      // Calculate gamification points
      let gamificationPoints = 100; // Base points for completion
      if (score === 100) {
        gamificationPoints += 50; // Perfect score bonus
      } else if (score >= 90) {
        gamificationPoints += 25; // High score bonus
      }

      // Save quiz result
      const [resultId] = await db.transaction(async (connection) => {
        // Insert quiz result
        const [result] = await connection.execute(
          "INSERT INTO quiz_results (user_id, quiz_id, score, points_earned, time_spent, answers, passed) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            req.user.id,
            quizId,
            score,
            earnedPoints,
            timeSpent,
            JSON.stringify(answers),
            passed,
          ]
        );

        // Add gamification points
        await connection.execute(
          "INSERT INTO user_points (user_id, points, source, source_id, description) VALUES (?, ?, ?, ?, ?)",
          [
            req.user.id,
            gamificationPoints,
            "quiz_completion",
            quizId,
            `Quiz: ${quiz.title}`,
          ]
        );

        // Update learning streak
        await this.updateLearningStreak(connection, req.user.id);

        // Check for badge achievements
        await this.checkBadgeAchievements(connection, req.user.id);

        return result;
      });

      res.json({
        success: true,
        data: {
          id: resultId.insertId,
          score,
          passed,
          pointsEarned: earnedPoints,
          gamificationPoints,
          correctAnswers,
          totalQuestions: questions.length,
        },
      });
    } catch (error) {
      console.error("Submit quiz error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to submit quiz",
      });
    }
  }

  // Create quiz (admin only)
  async create(req, res) {
    try {
      const {
        destinationId,
        title,
        description,
        difficulty,
        passingScore,
        timeLimit,
        questions,
      } = req.body;

      const result = await db.transaction(async (connection) => {
        // Create quiz
        const [quizResult] = await connection.execute(
          "INSERT INTO quizzes (destination_id, title, description, difficulty, passing_score, time_limit, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            destinationId,
            title,
            description,
            difficulty,
            passingScore,
            timeLimit,
            req.user.id,
          ]
        );

        const quizId = quizResult.insertId;

        // Add questions
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          await connection.execute(
            "INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              quizId,
              question.questionText,
              question.questionType,
              JSON.stringify(question.options),
              JSON.stringify(question.correctAnswer),
              question.explanation,
              question.points || 1,
              i + 1,
            ]
          );
        }

        return quizId;
      });

      res.status(201).json({
        success: true,
        message: "Quiz created successfully",
        data: { id: result },
      });
    } catch (error) {
      console.error("Create quiz error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create quiz",
      });
    }
  }

  // Get user's quiz results
  async getUserResults(req, res) {
    try {
      const { userId } = req.params;

      // Check if user can access these results
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

      const results = await db.query(
        `
        SELECT qr.*, q.title as quiz_title, q.difficulty, d.name as destination_name
        FROM quiz_results qr
        JOIN quizzes q ON qr.quiz_id = q.id
        LEFT JOIN destinations d ON q.destination_id = d.id
        WHERE qr.user_id = ?
        ORDER BY qr.completed_at DESC
      `,
        [userId]
      );

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error("Get user results error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch quiz results",
      });
    }
  }

  // Helper method to update learning streak
  async updateLearningStreak(connection, userId) {
    const today = new Date().toISOString().split("T")[0];

    const [streakResult] = await connection.execute(
      "SELECT * FROM learning_streaks WHERE user_id = ?",
      [userId]
    );

    if (streakResult.length === 0) {
      // First activity
      await connection.execute(
        "INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES (?, ?, ?, ?)",
        [userId, 1, 1, today]
      );
    } else {
      const streak = streakResult[0];
      const lastActivity = new Date(streak.last_activity_date);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate - lastActivity);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStreak;
      if (diffDays === 1) {
        // Consecutive day
        newStreak = streak.current_streak + 1;
      } else if (diffDays === 0) {
        // Same day, no change
        return;
      } else {
        // Streak broken
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, streak.longest_streak);

      await connection.execute(
        "UPDATE learning_streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ? WHERE user_id = ?",
        [newStreak, longestStreak, today, userId]
      );
    }
  }

  // Helper method to check badge achievements
  async checkBadgeAchievements(connection, userId) {
    // Get user stats
    const [userStats] = await connection.execute(
      `
      SELECT 
        COUNT(qr.id) as quiz_count,
        AVG(qr.score) as avg_score,
        COUNT(CASE WHEN qr.score = 100 THEN 1 END) as perfect_scores,
        ls.current_streak
      FROM quiz_results qr
      LEFT JOIN learning_streaks ls ON ls.user_id = qr.user_id
      WHERE qr.user_id = ?
    `,
      [userId]
    );

    const stats = userStats[0];

    // Check for badge eligibility
    const badges = await connection.execute("SELECT * FROM badges");

    for (const badge of badges[0]) {
      const criteria = JSON.parse(badge.criteria);
      let eligible = false;

      switch (badge.name) {
        case "First Steps":
          eligible = stats.quiz_count >= 1;
          break;
        case "Perfectionist":
          eligible = stats.perfect_scores >= 1;
          break;
        case "Quiz Master":
          eligible = stats.quiz_count >= 5;
          break;
        case "High Performer":
          eligible = stats.avg_score >= 85;
          break;
        case "Streak Warrior":
          eligible = stats.current_streak >= 7;
          break;
      }

      if (eligible) {
        // Check if user already has this badge
        const [existingBadge] = await connection.execute(
          "SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?",
          [userId, badge.id]
        );

        if (existingBadge.length === 0) {
          // Award badge
          await connection.execute(
            "INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)",
            [userId, badge.id]
          );

          // Award points
          if (badge.points_reward > 0) {
            await connection.execute(
              "INSERT INTO user_points (user_id, points, source, source_id, description) VALUES (?, ?, ?, ?, ?)",
              [
                userId,
                badge.points_reward,
                "badge_earned",
                badge.id,
                `Badge: ${badge.name}`,
              ]
            );
          }
        }
      }
    }
  }
}

module.exports = new QuizController();
