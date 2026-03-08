const express = require("express");
const router = express.Router();
const {
  getReport,
  getAllReports,
  saveLog,
} = require("../controllers/logController");

router.post("/logs", saveLog);
router.get("/reports/:student_id", getReport);
router.get("/reports", getAllReports);

module.exports = router;
