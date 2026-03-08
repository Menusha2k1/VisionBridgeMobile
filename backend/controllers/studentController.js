const db = require("../db/connection");

exports.getAllStudents = (req, res) => {
  try {
    const students = db
      .prepare(
        "SELECT id, name, pin, grade, phone_number, impairment_type FROM students ORDER BY id DESC",
      )
      .all();

    res.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getStudent = (req, res) => {
  try {
    const { id } = req.params;

    const student = db
      .prepare(
        "SELECT id, name, pin, grade, phone_number, impairment_type FROM students WHERE id = ?",
      )
      .get(id);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ student });
  } catch (error) {
    console.error("Error fetching student:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.registerStudent = (req, res) => {
  try {
    const { name, grade, phone_number, impairment_type } = req.body;

    if (!name || !grade) {
      return res.status(400).json({ error: "Name and grade are required" });
    }

    // Auto-generate a unique 4-digit PIN
    let pin;
    let attempts = 0;
    do {
      pin = String(Math.floor(1000 + Math.random() * 9000));
      const existing = db
        .prepare("SELECT id FROM students WHERE pin = ?")
        .get(pin);
      if (!existing) break;
      attempts++;
    } while (attempts < 100);

    if (attempts >= 100) {
      return res
        .status(500)
        .json({ error: "Unable to generate a unique PIN. Please try again." });
    }

    const result = db
      .prepare(
        "INSERT INTO students (name, pin, grade, phone_number, impairment_type) VALUES (?, ?, ?, ?, ?)",
      )
      .run(name, pin, grade, phone_number || null, impairment_type || null);

    res.status(201).json({
      message: "Student registered successfully",
      studentId: result.lastInsertRowid,
      pin,
    });
  } catch (error) {
    console.error("Error registering student:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateStudent = (req, res) => {
  try {
    const { id } = req.params;
    const { name, pin, grade, phone_number, impairment_type } = req.body;

    const student = db.prepare("SELECT id FROM students WHERE id = ?").get(id);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (pin) {
      const pinConflict = db
        .prepare("SELECT id FROM students WHERE pin = ? AND id != ?")
        .get(pin, id);

      if (pinConflict) {
        return res
          .status(409)
          .json({ error: "A student with this PIN already exists" });
      }
    }

    const updates = [];
    const values = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (pin) {
      updates.push("pin = ?");
      values.push(pin);
    }
    if (grade) {
      updates.push("grade = ?");
      values.push(grade);
    }
    if (phone_number !== undefined) {
      updates.push("phone_number = ?");
      values.push(phone_number || null);
    }
    if (impairment_type !== undefined) {
      updates.push("impairment_type = ?");
      values.push(impairment_type || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    db.prepare(`UPDATE students SET ${updates.join(", ")} WHERE id = ?`).run(
      ...values,
    );

    const updated = db
      .prepare(
        "SELECT id, name, pin, grade, phone_number, impairment_type FROM students WHERE id = ?",
      )
      .get(id);

    res.json({ message: "Student updated successfully", student: updated });
  } catch (error) {
    console.error("Error updating student:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
