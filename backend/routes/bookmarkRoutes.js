const express = require("express");

const router = express.Router();

const bookmarkController =
    require("../controllers/bookmarkController");


// Save
router.post(
    "/save",
    bookmarkController.saveBookmark
);


// Get All
router.get(
    "/all",
    bookmarkController.getBookmarks
);


// Get Single
router.get(
    "/:id",
    bookmarkController.getBookmarkById
);

module.exports = router;