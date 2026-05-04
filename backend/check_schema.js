const db = require('./db/connection');
const info = db.prepare("PRAGMA table_info(bookmarks)").all();
console.log(JSON.stringify(info, null, 2));
process.exit();
