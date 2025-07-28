const express = require("express");
const router = express.Router();
const gamificationController = require("../controllers/gamificationController");
const { auth, adminOnly } = require("../middleware/auth");

router.get(
  "/leaderboard/:companyId",
  auth,
  gamificationController.getLeaderboard
);
router.get("/user-stats/:userId", auth, gamificationController.getUserStats);
router.get("/badges", auth, gamificationController.getBadges);
router.get(
  "/analytics/:companyId",
  auth,
  adminOnly,
  gamificationController.getCompanyAnalytics
);

module.exports = router;
