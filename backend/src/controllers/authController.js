const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
// const emailService = require("../services/emailService");
// const { registerValidation, loginValidation } = require("../utils/validation");

class AuthController {
  async registerCompany(req, res) {
    try {
      const { error } = registerValidation(req.body);
      if (error) {
        return res
          .status(400)
          .json({ success: false, error: error.details[0].message });
      }

      const { companyName, email, password, businessLicense, companySize } =
        req.body;

      // Check if company email already exists
      const existingCompany = await db.query(
        "SELECT id FROM companies WHERE email = ?",
        [email]
      );
      if (existingCompany.length > 0) {
        return res
          .status(400)
          .json({ success: false, error: "Company email already registered" });
      }

      await db.transaction(async (connection) => {
        // Create company
        const [companyResult] = await connection.execute(
          "INSERT INTO companies (name, email, business_license, company_size, status) VALUES (?, ?, ?, ?, ?)",
          [companyName, email, businessLicense, companySize, "pending"]
        );

        // Create admin user
        const hashedPassword = await bcrypt.hash(password, 12);
        await connection.execute(
          "INSERT INTO users (company_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)",
          [
            companyResult.insertId,
            "Admin User",
            email,
            hashedPassword,
            "company_admin",
            "pending",
          ]
        );
      });

      // Send welcome email
      await emailService.sendCompanyRegistrationEmail(email, companyName);

      res.status(201).json({
        success: true,
        message: "Company registration submitted. Please wait for approval.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ success: false, error: "Registration failed" });
    }
  }

  async login(req, res) {
    try {
      const { error } = loginValidation(req.body);
      if (error) {
        return res
          .status(400)
          .json({ success: false, error: error.details[0].message });
      }

      const { email, password } = req.body;

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
        return res
          .status(401)
          .json({ success: false, error: "Invalid credentials" });
      }

      const user = users[0];

      // Check password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid credentials" });
      }

      // Check account status
      if (user.status !== "active" || user.company_status !== "active") {
        return res.status(401).json({
          success: false,
          error: "Account pending approval or suspended",
        });
      }

      // Update last login
      await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [
        user.id,
      ]);

      // Generate tokens
      const token = jwt.sign(
        { userId: user.id, companyId: user.company_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE }
      );

      res.json({
        success: true,
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
      res.status(500).json({ success: false, error: "Login failed" });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res
          .status(401)
          .json({ success: false, error: "Refresh token required" });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      const newToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.json({ success: true, token: newToken });
    } catch (error) {
      res.status(401).json({ success: false, error: "Invalid refresh token" });
    }
  }
}

module.exports = new AuthController();
