const db = require("../db/connection");

exports.login = (req, res) => {
  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({ error: "PIN is required" });
  }

  const student = db
    .prepare("SELECT id, name, grade FROM students WHERE pin = ?")
    .get(pin);

  if (!student) {
    return res.status(401).json({ error: "Invalid PIN" });
  }

  res.json({
    message: "Login successful",
    student,
  });
};
