const db = require("../db/connection");


// Save Bookmark
exports.saveBookmark = (req, res) => {

    try {

        const {
            fileName,
            startPage,
            endPage,
            scriptText
        } = req.body;

        const stmt = db.prepare(`
            INSERT INTO bookmarks
            (file_name, start_page, end_page, script_text)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run(
            fileName,
            startPage,
            endPage,
            JSON.stringify(scriptText)
        );

        res.json({
            success: true,
            message: "Bookmark saved"
        });

    } catch (error) {

        console.error("Bookmark Save Error:", error);

        res.status(500).json({
            success: false
        });
    }

};


// Get Bookmarks
exports.getBookmarks = (req, res) => {

    try {

        const rows = db
            .prepare("SELECT * FROM bookmarks ORDER BY id DESC")
            .all();

        res.json(rows);

    } catch (error) {

        console.error("Bookmark Fetch Error:", error);

        res.status(500).json({
            success: false
        });
    }

};


// Get One Bookmark
exports.getBookmarkById = (req, res) => {

    try {

        const id = req.params.id;

        const row = db
            .prepare("SELECT * FROM bookmarks WHERE id=?")
            .get(id);

        if (row) {

            row.script_text =
                JSON.parse(row.script_text);

            res.json(row);

        } else {

            res.status(404).json({
                message: "Not found"
            });
        }

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false
        });
    }

};