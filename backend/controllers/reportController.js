const db = require("../db/connection");

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
