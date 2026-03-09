const express = require("express");
const router = express.Router();
const multer = require("multer");
const assessmentController = require("../controllers/assessmentController");
const upload = multer({ storage: multer.memoryStorage() });

// Route එක: POST /api/assessments/upload
router.post(
  "/upload",
  upload.single("image"),
  assessmentController.uploadAssessment,
);

router.get("/", assessmentController.getAssessments);
router.get("/:id", assessmentController.getAssessmentById);

module.exports = router;
