// ============================================
// src/middleware/auth.js - Authentication Middleware
// ============================================
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No valid token provided.",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const users = await db.query(
      `SELECT u.*, c.name as company_name, c.status as company_status 
       FROM users u 
       JOIN companies c ON u.company_id = c.id 
       WHERE u.id = ? AND u.status = 'active'`,
      [decoded.userId]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid token. User not found.",
      });
    }

    const user = users[0];

    if (user.company_status !== "active") {
      return res.status(401).json({
        success: false,
        error: "Company account is not active.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired.",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed.",
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "company_admin" && req.user.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Admin privileges required.",
    });
  }
  next();
};

const superAdminOnly = (req, res, next) => {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Super admin privileges required.",
    });
  }
  next();
};

const companyIsolation = (req, res, next) => {
  if (req.user.role === "super_admin") {
    return next();
  }

  req.companyFilter = req.user.company_id;
  next();
};

module.exports = {
  auth,
  adminOnly,
  superAdminOnly,
  companyIsolation,
};
