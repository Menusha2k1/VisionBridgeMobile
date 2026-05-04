const db = require('./db/connection');

try {
    // Check if source_filename already exists
    const info = db.prepare("PRAGMA table_info(bookmarks)").all();
    const hasSourceFilename = info.some(c => c.name === 'source_filename');
    
    if (!hasSourceFilename) {
        console.log("Renaming file_name to source_filename...");
        db.exec("ALTER TABLE bookmarks RENAME COLUMN file_name TO source_filename");
        console.log("✅ Table altered successfully.");
    } else {
        console.log("Column source_filename already exists.");
    }
} catch (err) {
    console.error("Migration Error:", err.message);
}

process.exit();
