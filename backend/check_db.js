const db = require('./db/connection');
try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Tables in DB:", tables);
    const bookmarks = db.prepare("SELECT * FROM bookmarks").all();
    console.log("Bookmarks count:", bookmarks.length);
} catch (err) {
    console.error("DB Check Error:", err.message);
}
process.exit();
