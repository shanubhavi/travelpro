const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { auth, adminOnly } = require("../middleware/auth");

// Get all quizzes
router.get("/", auth, async (req, res) => {
  try {
    const quizzes = await db.query(`
      SELECT q.*, d.name as destination_name,
             COUNT(qq.id) as question_count
      FROM quizzes q
      LEFT JOIN destinations d ON q.destination_id = d.id
      LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
      WHERE q.status = 'active'
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `);

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    console.error("Get quizzes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch quizzes",
    });
  }
});

// Get quiz details with questions
router.get("/:id", auth, async (req, res) => {
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
});

module.exports = router;
