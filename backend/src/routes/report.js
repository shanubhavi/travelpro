// ============================================
// src/routes/users.js - Updated User Routes
// ============================================
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth, adminOnly } = require("../middleware/auth");

// User management routes
router.get(
  "/company/:companyId",
  auth,
  adminOnly,
  userController.getCompanyUsers
);
router.post("/invite", auth, adminOnly, userController.inviteUser);
router.post("/create", auth, adminOnly, userController.createUser); // Direct user creation without email
router.put("/:id", auth, userController.updateUser);
router.delete("/:id", auth, adminOnly, userController.deleteUser);
router.post("/change-password", auth, userController.changePassword);

module.exports = router;
