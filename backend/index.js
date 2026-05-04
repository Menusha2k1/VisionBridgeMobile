const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");
const reportRoutes = require("./routes/reportRoutes");

const assessmentRoutes = require("./routes/assessmentRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherScriptRoutes = require("./routes/teacherScriptRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", authRoutes);
app.use("/api", logRoutes);
app.use("/api", reportRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api", studentRoutes);
app.use("/api", teacherScriptRoutes);

const bookmarkRoutes =
  require("./routes/bookmarkRoutes");

app.use(
  "/api/bookmarks",
  bookmarkRoutes
);

app.get("/", (req, res) => {
  res.json({ message: "VisionBridge API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
