const mongoose = require("mongoose");


//The schema of the document collection
const DocumentSchema = new mongoose.Schema(
  {
    name: String,
    filePath: String,
    scriptText: String,
    scriptId: mongoose.Schema.Types.ObjectId
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", DocumentSchema);