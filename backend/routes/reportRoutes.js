const express = require("express");
const router = express.Router();
const { getReport } = require("../controllers/reportController");

router.get("/reports/:student_id", getReport);

module.exports = router;
