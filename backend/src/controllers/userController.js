// ============================================
// src/controllers/userController.js - Final Fixed User Controller
// ============================================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

class UserController {
  // Get company users (admin only)
  async getCompanyUsers(req, res) {
    try {
      const { companyId } = req.params;

      // Verify admin access and company ownership
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

      const users = await db.query(
        `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.status,
          u.last_login,
          u.created_at
        FROM users u
        WHERE u.company_id = ?
        ORDER BY u.created_at DESC
      `,
        [companyId]
      );

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Get company users error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch users",
      });
    }
  }

  // Invite new user (admin only) - Simplified version
  async inviteUser(req, res) {
    try {
      const { name, email, role = "employee" } = req.body;

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

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: "Name and email are required",
        });
      }

      // Check if email already exists
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

      // For now, just return success (email functionality is optional)
      console.log(
        `📧 User invitation would be sent to: ${email} (${name}) for company ${req.user.company_id}`
      );

      res.status(201).json({
        success: true,
        message:
          "User invitation prepared successfully (email service optional)",
        data: {
          email,
          name,
          role,
          companyId: req.user.company_id,
        },
      });
    } catch (error) {
      console.error("Invite user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send invitation",
      });
    }
  }

  // Accept user invitation
  async acceptInvite(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          error: "Token and password are required",
        });
      }

      // Verify invite token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { email, name, role, companyId } = decoded;

      // Check if user already exists
      const existingUser = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          error: "User already exists",
        });
      }

      // Create user account
      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await db.query(
        "INSERT INTO users (company_id, name, email, password_hash, role, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [companyId, name, email, hashedPassword, role, "active", true]
      );

      res.json({
        success: true,
        message: "Account created successfully. You can now login.",
      });
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid or expired invitation token",
        });
      }

      console.error("Accept invite error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create account",
      });
    }
  }

  // Create user directly (for testing without email)
  async createUser(req, res) {
    try {
      const { name, email, password, role = "employee" } = req.body;

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

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: "Name, email, and password are required",
        });
      }

      // Check if email already exists
      const existingUser = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Email already exists",
        });
      }

      // Create user account
      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await db.query(
        "INSERT INTO users (company_id, name, email, password_hash, role, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [req.user.company_id, name, email, hashedPassword, role, "active", true]
      );

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
          id: result.insertId,
          name,
          email,
          role,
        },
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create user",
      });
    }
  }

  // Update user (admin or self)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, status } = req.body;

      // Check if user can update this account
      const canUpdate =
        req.user.id === parseInt(id) ||
        req.user.role === "company_admin" ||
        req.user.role === "super_admin";

      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      // Get current user data
      const currentUser = await db.query("SELECT * FROM users WHERE id = ?", [
        id,
      ]);
      if (currentUser.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Build update query
      const updates = [];
      const params = [];

      if (name && name !== currentUser[0].name) {
        updates.push("name = ?");
        params.push(name);
      }

      if (email && email !== currentUser[0].email) {
        // Check if email is already taken
        const emailCheck = await db.query(
          "SELECT id FROM users WHERE email = ? AND id != ?",
          [email, id]
        );
        if (emailCheck.length > 0) {
          return res.status(400).json({
            success: false,
            error: "Email already in use",
          });
        }
        updates.push("email = ?");
        params.push(email);
      }

      // Only admins can update role and status
      if (
        (req.user.role === "company_admin" ||
          req.user.role === "super_admin") &&
        req.user.id !== parseInt(id)
      ) {
        if (role && role !== currentUser[0].role) {
          updates.push("role = ?");
          params.push(role);
        }

        if (status && status !== currentUser[0].status) {
          updates.push("status = ?");
          params.push(status);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No valid updates provided",
        });
      }

      // Update user
      params.push(id);
      await db.query(
        `UPDATE users SET ${updates.join(
          ", "
        )}, updated_at = NOW() WHERE id = ?`,
        params
      );

      res.json({
        success: true,
        message: "User updated successfully",
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user",
      });
    }
  }

  // Delete user (admin only)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

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

      // Prevent self-deletion
      if (req.user.id === parseInt(id)) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete your own account",
        });
      }

      // Check if user exists and belongs to same company (unless super admin)
      const user = await db.query("SELECT * FROM users WHERE id = ?", [id]);
      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      if (
        req.user.role !== "super_admin" &&
        user[0].company_id !== req.user.company_id
      ) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      // Soft delete user
      await db.query(
        "UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?",
        ["suspended", id]
      );

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete user",
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "Current password and new password are required",
        });
      }

      // Get user's current password
      const user = await db.query(
        "SELECT password_hash FROM users WHERE id = ?",
        [req.user.id]
      );
      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user[0].password_hash
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "Current password is incorrect",
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await db.query(
        "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
        [hashedNewPassword, req.user.id]
      );

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to change password",
      });
    }
  }
}

module.exports = new UserController();
