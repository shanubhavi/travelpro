const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth, adminOnly } = require("../middleware/auth");
const { validate, userInviteSchema } = require("../utils/validation");

// User management routes
router.get(
  "/company/:companyId",
  auth,
  adminOnly,
  userController.getCompanyUsers
);
router.post(
  "/invite",
  auth,
  adminOnly,
  validate(userInviteSchema),
  userController.inviteUser
);
router.post("/accept-invite", userController.acceptInvite);
router.put("/:id", auth, userController.updateUser);
router.delete("/:id", auth, adminOnly, userController.deleteUser);
router.post("/change-password", auth, userController.changePassword);

module.exports = router;
