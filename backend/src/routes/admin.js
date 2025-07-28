const express = require("express");
const router = express.Router();
const { auth, adminOnly, superAdminOnly } = require("../middleware/auth");
const db = require("../config/database");

// Get admin dashboard stats
router.get("/dashboard", auth, adminOnly, async (req, res) => {
  try {
    const companyId =
      req.user.role === "super_admin" ? null : req.user.company_id;

    let companyFilter = "";
    let params = [];

    if (companyId) {
      companyFilter = "WHERE u.company_id = ?";
      params = [companyId, companyId, companyId, companyId];
    }

    const [stats] = await db.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM users u ${companyFilter}) as total_users,
        (SELECT COUNT(*) FROM users u ${companyFilter} AND u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as active_users,
        (SELECT COUNT(*) FROM quiz_results qr JOIN users u ON qr.user_id = u.id ${companyFilter}) as total_quiz_attempts,
        (SELECT AVG(qr.score) FROM quiz_results qr JOIN users u ON qr.user_id = u.id ${companyFilter}) as average_score
    `,
      params
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch dashboard data" });
  }
});

// Get all companies (super admin only)
router.get("/companies", auth, superAdminOnly, async (req, res) => {
  try {
    const companies = await db.query(`
      SELECT c.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id END) as active_users
      FROM companies c
      LEFT JOIN users u ON c.id = u.company_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json({ success: true, data: companies });
  } catch (error) {
    console.error("Get companies error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch companies" });
  }
});

// Approve company (super admin only)
router.put("/companies/:id/approve", auth, superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    await db.transaction(async (connection) => {
      // Update company status
      await connection.execute(
        "UPDATE companies SET status = ?, updated_at = NOW() WHERE id = ?",
        ["active", id]
      );

      // Update all pending users in the company
      await connection.execute(
        "UPDATE users SET status = ?, updated_at = NOW() WHERE company_id = ? AND status = ?",
        ["active", id, "pending"]
      );
    });

    res.json({ success: true, message: "Company approved successfully" });
  } catch (error) {
    console.error("Approve company error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to approve company" });
  }
});

// Reject company (super admin only)
router.put("/companies/:id/reject", auth, superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "UPDATE companies SET status = ?, updated_at = NOW() WHERE id = ?",
      ["suspended", id]
    );

    res.json({ success: true, message: "Company rejected successfully" });
  } catch (error) {
    console.error("Reject company error:", error);
    res.status(500).json({ success: false, error: "Failed to reject company" });
  }
});

module.exports = router;
