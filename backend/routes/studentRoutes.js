const express = require("express");
const router = express.Router();
const {
  getAllStudents,
  getStudent,
  registerStudent,
  updateStudent,
} = require("../controllers/studentController");

router.get("/students", getAllStudents);

router.get("/students/:id", getStudent);
router.post("/students", registerStudent);
router.put("/students/:id", updateStudent);

module.exports = router;
