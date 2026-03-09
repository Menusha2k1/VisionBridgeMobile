const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../db/connection");

const genAI = new GoogleGenerativeAI("AIzaSyCZgO8Sb7HVbzmrqhPt9FfIG3s3_GI1Q8A");

// 1. GET ALL
exports.getAssessments = (req, res) => {
  try {
    const stmt = db.prepare(
      "SELECT * FROM assessments ORDER BY created_at DESC",
    );
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// 2. GET BY ID
exports.getAssessmentById = (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM assessments WHERE id = ?");
    const row = stmt.get(req.params.id);
    if (!row) return res.status(404).send("Assessment not found");

    if (row.gate_data) row.gate_data = JSON.parse(row.gate_data);
    if (row.table_data) row.table_data = JSON.parse(row.table_data);

    res.json(row);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// 3. UPLOAD AND ANALYZE
exports.uploadAssessment = async (req, res) => {
  try {
    const { title, assessment_type } = req.body;
    if (!req.file) return res.status(400).send("No image provided.");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze this image. It is either a "Logic Gate Circuit" or a "Truth Table".
      Identify the type and return ONLY a JSON object with this exact structure:
      {
        "assessment_type": "Logic Gates" | "Truth Table", 
        "summary": "A 20-25 word overview explaining the circuit layout or table purpose.",
        "final_output": "A descriptive natural language explanation of the final result for a blind student.",
        "gate_data": null, 
        "table_data": null
      }

      Detailed Instructions for Logic Gates:
      1. If type is 'Logic Gates', populate 'gate_data': [{"id": "gate1", "type": "AND", "inputA": "val", "inputB": "val", "output": "result"}].
      2. If specific binary inputs (0, 1) are shown in the image, the 'final_output' must calculate and state the actual numeric result (e.g., "Given the inputs 1 and 0, the final output is 1").
      3. If variables (A, B) are used, 'final_output' must be a human-friendly Boolean description (e.g., "The result is A AND B, which is then inverted by a NOT gate, and finally ORed with C"). Avoid just saying 'A.B+C', explain it so it's clear when spoken.

      Detailed Instructions for Truth Table:
      1. If type is 'Truth Table', populate 'table_data': {"headers": ["A", "B", "F"], "rows": [{"values": [0, 1, 0], "explanation": "Row 1: When A is 0 and B is 1, the output F is 0"}]}.
      2. The 'explanation' for each row MUST be a full, clear sentence that a blind student can understand via text-to-speech.
      3. Use 'final_output' to identify what logic gate or function this table represents (e.g., "This table represents a 2-input NOR gate").

      Crucial: No matter the type, focus on high-clarity descriptions for a screen reader user. Return ONLY valid JSON.
    `;
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: req.file.mimetype,
        },
      },
    ]);

    const aiData = JSON.parse(
      result.response
        .text()
        .replace(/```json|```/g, "")
        .trim(),
    );

    const stmt = db.prepare(
      `INSERT INTO assessments (title, assessment_type, summary, gate_data, table_data, final_output) VALUES (?, ?, ?, ?, ?, ?)`,
    );

    const info = stmt.run(
      title || "Untitled",
      aiData.assessment_type,
      aiData.summary,
      aiData.gate_data ? JSON.stringify(aiData.gate_data) : null,
      aiData.table_data ? JSON.stringify(aiData.table_data) : null,
      aiData.final_output,
    );

    res.json({ message: "Success", id: info.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error: " + error.message);
  }
};
