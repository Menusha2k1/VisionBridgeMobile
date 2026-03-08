const db = require("../db/connection");

exports.saveLog = (req, res) => {
  try {
    const { student_id, screen_name, user_path, prediction_label } = req.body;

    if (!student_id || !screen_name || !user_path || !prediction_label) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const student = db
      .prepare("SELECT id FROM students WHERE id = ?")
      .get(student_id);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const result = db
      .prepare(
        "INSERT INTO struggle_logs (student_id, screen_name, user_path, prediction_label) VALUES (?, ?, ?, ?)",
      )
      .run(student_id, screen_name, user_path, prediction_label);

    return res.status(201).json({
      message: "Log saved successfully",
      logId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("Database Error Detail:", error.message);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

exports.getReport = (req, res) => {
  const { student_id } = req.params;

  const student = db
    .prepare("SELECT id, name, grade FROM students WHERE id = ?")
    .get(student_id);

  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  const logs = db
    .prepare(
      "SELECT id, screen_name, user_path, prediction_label, timestamp FROM struggle_logs WHERE student_id = ? ORDER BY timestamp DESC",
    )
    .all(student_id);

  res.json({
    student,
    totalLogs: logs.length,
    logs,
  });
};
exports.getAllReports = (req, res) => {
  const students = db.prepare("SELECT id, name, grade FROM students").all();

  const reports = students.map((student) => {
    const logs = db
      .prepare(
        "SELECT id, screen_name, user_path, prediction_label, timestamp FROM struggle_logs WHERE student_id = ? ORDER BY timestamp DESC",
      )
      .all(student.id);

    return {
      totalLogs: logs.length,
      logs,
    };
  });

  res.json({
    totalStudents: students.length,
    reports,
  });
};
