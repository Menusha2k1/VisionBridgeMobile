const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "visionbridge.db");
const db = new Database(dbPath, {
  verbose: console.log,
  timeout: 5000,
});

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

// db.exec(`
//   CREATE TABLE IF NOT EXISTS students (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT NOT NULL,
//     pin TEXT NOT NULL UNIQUE, -- PIN එක unique වීම වැදගත්
//     grade TEXT NOT NULL
//   );

//   CREATE TABLE IF NOT EXISTS struggle_logs (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     student_id INTEGER NOT NULL,
//     screen_name TEXT NOT NULL,
//     user_path TEXT NOT NULL,
//     prediction_label TEXT NOT NULL,
//     timestamp TEXT DEFAULT (datetime('now', 'localtime')),
//     FOREIGN KEY (student_id) REFERENCES students(id)
//   );
// `);

console.log("✅ Database connected and tables verified.");

module.exports = db;
