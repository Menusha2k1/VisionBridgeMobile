const express = require("express");
const router = express.Router();
const { saveLog } = require("../controllers/logController");
const { getReport } = require("../controllers/logController");

router.post("/logs", saveLog);
router.get("/reports/:student_id", getReport);

module.exports = router;
