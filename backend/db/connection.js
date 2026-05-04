const Database = require("better-sqlite3");
const path = require("path");

// Create DB file in backend root folder
const dbPath = path.join(
  __dirname,
  "..",
  "visionbridge.db"
);

console.log("DB Path:", dbPath);

const db = new Database(dbPath, {
  timeout: 5000,
});

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");


// ==============================
// MAIN SCRIPT TABLE
// ==============================

db.exec(`

CREATE TABLE IF NOT EXISTS teacher_scripts (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  title TEXT NOT NULL,

  source_filename TEXT,

  script_text TEXT NOT NULL,

  start_page INTEGER,

  end_page INTEGER,

  created_at TEXT DEFAULT
  (datetime('now','localtime'))

);

`);


// ==============================
// PAGE RANGE HISTORY TABLE
// ==============================

db.exec(`

CREATE TABLE IF NOT EXISTS page_range_history (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  source_filename TEXT,

  start_page INTEGER,

  end_page INTEGER,

  created_at TEXT DEFAULT
  (datetime('now','localtime'))

);

`);

// ==============================
// BOOKMARKS TABLE
// ==============================

db.exec(`

CREATE TABLE IF NOT EXISTS bookmarks (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  source_filename TEXT,

  start_page INTEGER,

  end_page INTEGER,

  script_text TEXT NOT NULL,

  created_at TEXT DEFAULT
  (datetime('now','localtime'))

);

`);


console.log("✅ Database connected and tables verified.");

module.exports = db;