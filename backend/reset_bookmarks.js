const db = require('./db/connection');
try {
    console.log("Dropping bookmarks table...");
    db.exec("DROP TABLE IF EXISTS bookmarks");
    console.log("✅ Table dropped. Re-running connection logic to recreate...");
    // Re-run the connection script logic
    require('./db/connection');
    console.log("✅ Table recreated with correct schema.");
} catch (err) {
    console.error("Reset Error:", err.message);
}
process.exit();
