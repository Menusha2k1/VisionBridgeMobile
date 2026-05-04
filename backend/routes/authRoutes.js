const express = require("express");
const router = express.Router();
const { login, registerTeacher, teacherLogin } = require("../controllers/authController");

router.post("/login", login);
router.post("/teachers/register", registerTeacher);
router.post("/teachers/login", teacherLogin);

module.exports = router;
