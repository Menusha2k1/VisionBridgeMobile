const crypto = require("crypto");
const db = require("../db/connection");

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const passwordHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return `${salt}:${passwordHash}`;
};

const verifyPassword = (password, storedPassword) => {
  if (!storedPassword) {
    return false;
  }

  if (!storedPassword.includes(":")) {
    return storedPassword === password;
  }

  const [salt, expectedHash] = storedPassword.split(":");
  if (!salt || !expectedHash) {
    return false;
  }

  const passwordHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(passwordHash, "hex"),
    Buffer.from(expectedHash, "hex"),
  );
};

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

exports.registerTeacher = (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingTeacher = db
      .prepare("SELECT id FROM teachers WHERE email = ?")
      .get(normalizedEmail);

    if (existingTeacher) {
      return res.status(409).json({ error: "A teacher with this email already exists" });
    }

    const storedPassword = hashPassword(password.trim());
    const result = db
      .prepare(
        "INSERT INTO teachers (name, email, password) VALUES (?, ?, ?)",
      )
      .run(name.trim(), normalizedEmail, storedPassword);

    res.status(201).json({
      message: "Teacher registered successfully",
      teacher: {
        id: result.lastInsertRowid,
        name: name.trim(),
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error("Error registering teacher:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.teacherLogin = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const teacher = db
      .prepare(
        "SELECT id, name, email, password FROM teachers WHERE email = ?",
      )
      .get(normalizedEmail);

    if (!teacher) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = verifyPassword(password.trim(), teacher.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
      },
    });
  } catch (error) {
    console.error("Error logging in teacher:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
