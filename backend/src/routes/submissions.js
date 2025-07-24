const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submissionController");
const { auth, adminOnly } = require("../middleware/auth");
const { validate, submissionSchema } = require("../utils/validation");

router.get("/", auth, submissionController.getAll);
router.post("/", auth, validate(submissionSchema), submissionController.create);
router.put("/:id/approve", auth, adminOnly, submissionController.approve);
router.put("/:id/reject", auth, adminOnly, submissionController.reject);

module.exports = router;
