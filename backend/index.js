const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");
const reportRoutes = require("./routes/reportRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api", authRoutes);
app.use("/api", logRoutes);
app.use("/api", reportRoutes);
app.use("/api/assessments", assessmentRoutes);

app.get("/", (req, res) => {
  res.json({ message: "VisionBridge API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
