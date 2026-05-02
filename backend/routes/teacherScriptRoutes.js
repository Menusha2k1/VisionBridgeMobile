const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

const teacherScriptController =
  require("../controllers/teacherScriptController");


// ==============================
// MULTER STORAGE
// ==============================

const storage = multer.diskStorage({

  destination: function (req, file, cb) {

    cb(
      null,
      path.join(
        __dirname,
        "..",
        "uploads"
      )
    );

  },

  filename: function (req, file, cb) {

    cb(
      null,
      Date.now() +
      "-" +
      file.originalname
    );

  }

});

const upload = multer({
  storage: storage
});


// ==============================
// ROUTES
// ==============================

// ⭐ FIXED FIELD NAME
router.post(

  "/teacher-script",

  upload.single("lessonFile"),

  teacherScriptController.generateTeacherScript

);


// Save script
router.post(

  "/save-teacher-script",

  teacherScriptController.saveTeacherScript

);


// List scripts
router.get(

  "/teacher-scripts",

  teacherScriptController.listTeacherScripts

);

module.exports = router;