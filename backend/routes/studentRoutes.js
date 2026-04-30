const express = require("express");
const router = express.Router();
const {
  getAllStudents,
  getStudent,
  registerStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

router.get("/students", getAllStudents);

router.get("/students/:id", getStudent);
router.post("/students", registerStudent);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);

module.exports = router;
