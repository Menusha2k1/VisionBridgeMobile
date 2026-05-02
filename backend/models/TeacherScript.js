const mongoose = require("mongoose");

//The scheama of the teacher script collection. would not be required this collection most of the time
const TeacherScriptSchema = new mongoose.Schema(
  {
    scriptText: {
      type: String,
      required: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Document" // optional but recommended
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TeacherScript",
  TeacherScriptSchema,
  "teacherScripts"
);
