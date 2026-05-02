const path = require("path");
const { spawn } = require("child_process");
const db = require("../db/connection");


// ==============================
// GENERATE SCRIPT
// ==============================

exports.generateTeacherScript = (req, res) => {

  try {

    if (!req.file) {

      return res.status(400).json({
        error: "No file uploaded"
      });

    }

    const startPage =
      parseInt(req.body.startPage) || 1;

    const endPage =
      parseInt(req.body.endPage) || 5;

    console.log(
      "Running Python with pages:",
      startPage,
      "to",
      endPage
    );

    const uploadedPath =
      req.file.path;

    const scriptPath =
      path.join(
        __dirname,
        "..",
        "pythonTeacherScriptGenerator",
        "techerScriptWIthMl.py"
      );

    const python = spawn(

      "C:\\Users\\EX BOOK\\nlp_env310\\Scripts\\python.exe",

      [
        scriptPath,
        uploadedPath,
        startPage.toString(),
        endPage.toString()
      ]

    );

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {

      output += data.toString();

    });

    python.stderr.on("data", (data) => {

      errorOutput += data.toString();

    });

    python.on("close", (code) => {

      if (code !== 0) {

        console.error(
          "Python error:",
          errorOutput
        );

        return res.status(500).json({
          error: "Python script failed"
        });

      }

      try {

        const parsed =
          JSON.parse(output);

        res.json({

          status: "success",

          script:
            parsed.scriptText,

          chunks:
            parsed.chunks

        });

      } catch (e) {

        console.error(
          "JSON parse error:",
          output
        );

        res.status(500).json({
          error:
            "Failed to parse Python output."
        });

      }

    });

  } catch (error) {

    console.error(
      "Controller error:",
      error.message
    );

    res.status(500).json({
      error: "Internal Server Error"
    });

  }

};



// ==============================
// SAVE SCRIPT
// ==============================

exports.saveTeacherScript = (req, res) => {

  try {

    const {
      title,
      scriptText,
      sourceFilename
    } = req.body;

    if (!title || !scriptText) {

      return res.status(400).json({
        error:
          "Title and scriptText required"
      });

    }

    const stmt = db.prepare(

      `INSERT INTO teacher_scripts
       (title, source_filename, script_text)
       VALUES (?, ?, ?)`

    );

    const result = stmt.run(

      title,
      sourceFilename || null,
      scriptText

    );

    res.json({

      status: "saved",

      id: result.lastInsertRowid

    });

  } catch (error) {

    console.error(
      "Save error:",
      error.message
    );

    res.status(500).json({
      error: "Failed to save script"
    });

  }

};



// ==============================
// LIST SCRIPTS
// ==============================

exports.listTeacherScripts = (req, res) => {

  try {

    const rows = db.prepare(

      `SELECT id,
              title,
              source_filename,
              created_at
       FROM teacher_scripts
       ORDER BY id DESC`

    ).all();

    res.json({

      scripts: rows

    });

  } catch (error) {

    console.error(
      "List error:",
      error.message
    );

    res.status(500).json({
      error:
        "Failed to list scripts"
    });

  }

};