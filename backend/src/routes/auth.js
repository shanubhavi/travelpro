const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { auth } = require("../middleware/auth");

// Register new company with admin user
router.post("/register-company", async (req, res) => {
  try {
    const {
      companyName,
      email,
      password,
      businessLicense,
      companySize,
      adminName,
    } = req.body;

    // Basic validation
    if (!companyName || !email || !password || !adminName) {
      return res.status(400).json({
        success: false,
        error: "All required fields must be provided",
      });
    }

    // Check if company email already exists
    const existingCompany = await db.query(
      "SELECT id FROM companies WHERE email = ?",
      [email]
    );

    if (existingCompany.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Company email already registered",
      });
    }

    // Check if user email already exists
    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    const result = await db.transaction(async (connection) => {
      // Create company
      const [companyResult] = await connection.execute(
        "INSERT INTO companies (name, email, business_license, company_size, status) VALUES (?, ?, ?, ?, ?)",
        [companyName, email, businessLicense, companySize, "pending"]
      );

      // Create admin user
      const hashedPassword = await bcrypt.hash(password, 12);
      const [userResult] = await connection.execute(
        "INSERT INTO users (company_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)",
        [
          companyResult.insertId,
          adminName,
          email,
          hashedPassword,
          "company_admin",
          "pending",
        ]
      );

      return { companyId: companyResult.insertId, userId: userResult.insertId };
    });

    res.status(201).json({
      success: true,
      message:
        "Company registration submitted successfully. Please wait for approval.",
      data: {
        companyId: result.companyId,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed. Please try again.",
    });
  }
});

// User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Get user with company info
    const users = await db.query(
      `
      SELECT u.*, c.name as company_name, c.status as company_status 
      FROM users u 
      JOIN companies c ON u.company_id = c.id 
      WHERE u.email = ?
    `,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check account status
    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        error: "Account is pending approval or has been suspended",
      });
    }

    if (user.company_status !== "active") {
      return res.status(401).json({
        success: false,
        error: "Company account is pending approval or has been suspended",
      });
    }

    // Update last login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    // Generate tokens
    const token = jwt.sign(
      {
        userId: user.id,
        companyId: user.company_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "24h" }
    );

    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company_name,
        companyId: user.company_id,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed. Please try again.",
    });
  }
});

// Get current user info
router.get("/me", auth, async (req, res) => {
  try {
    const user = await db.query(
      `
      SELECT u.id, u.name, u.email, u.role, u.company_id, c.name as company_name
      FROM users u 
      JOIN companies c ON u.company_id = c.id 
      WHERE u.id = ?
    `,
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        role: user[0].role,
        company: user[0].company_name,
        companyId: user[0].company_id,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user information",
    });
  }
});

// Refresh JWT token
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token required",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Get user info for new token
    const users = await db.query(
      'SELECT id, company_id, role FROM users WHERE id = ? AND status = "active"',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }

    const user = users[0];

    const newToken = jwt.sign(
      {
        userId: user.id,
        companyId: user.company_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "24h" }
    );

    res.json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid refresh token",
    });
  }
});

// Request password reset
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const users = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Store reset token in database
    await db.query(
      "UPDATE users SET password_reset_token = ?, password_reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?",
      [resetToken, user.id]
    );

    // TODO: Send reset email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: "Password reset instructions have been sent to your email.",
      // Remove this in production - only for testing
      resetToken:
        process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process password reset request",
    });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Token and new password are required",
      });
    }

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({
        success: false,
        error: "Invalid reset token",
      });
    }

    // Check if token is still valid in database
    const users = await db.query(
      "SELECT * FROM users WHERE id = ? AND password_reset_token = ? AND password_reset_expires > NOW()",
      [decoded.userId, token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await db.query(
      "UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?",
      [hashedPassword, decoded.userId]
    );

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
});

module.exports = router;
