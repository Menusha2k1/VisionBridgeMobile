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


// ==============================
// BOOKMARK SCRIPT
// ==============================

exports.bookmarkScript = (req, res) => {
  try {
    const { sourceFilename, startPage, endPage, scriptText } = req.body;

    if (!scriptText) {
      return res.status(400).json({ error: "Script text is required" });
    }

    const stmt = db.prepare(
      `INSERT INTO bookmarks 
       (source_filename, start_page, end_page, script_text) 
       VALUES (?, ?, ?, ?)`
    );

    const result = stmt.run(
      sourceFilename || null,
      startPage || null,
      endPage || null,
      scriptText
    );

    res.json({
      status: "success",
      id: result.lastInsertRowid,
      message: "Bookmark saved successfully",
    });
  } catch (error) {
    console.error("Bookmark error:", error.message);
    res.status(500).json({ error: "Failed to bookmark script" });
  }
};

// ==============================
// GET BOOKMARKS BY FILE
// ==============================

exports.getBookmarksByFile = (req, res) => {
  try {
    const { filename } = req.params;

    const rows = db.prepare(
      `SELECT * FROM bookmarks 
       WHERE source_filename = ? 
       ORDER BY id DESC`
    ).all(filename);

    res.json({ bookmarks: rows });
  } catch (error) {
    console.error("Fetch bookmarks error:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks", details: error.message });
  }
};

// ==============================
// GET ALL BOOKMARKS
// ==============================

exports.getAllBookmarks = (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT * FROM bookmarks 
       ORDER BY created_at DESC`
    ).all();

    res.json({ bookmarks: rows });
  } catch (error) {
    console.error("Fetch all bookmarks error:", error.message);
    res.status(500).json({ error: "Failed to fetch all bookmarks" });
  }
};

// ==============================
// DELETE BOOKMARK
// ==============================

exports.deleteBookmark = (req, res) => {
  try {
    const bookmarkId = req.params.id;

    const stmt = db.prepare("DELETE FROM bookmarks WHERE id = ?");
    stmt.run(bookmarkId);

    res.json({ status: "success", message: "Bookmark deleted" });
  } catch (error) {
    console.error("Delete bookmark error:", error.message);
    res.status(500).json({ error: "Failed to delete bookmark" });
  }
};