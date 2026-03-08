import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { parseCsv } from "../utils/csv";

export type PredictionRow = {
  student_id: string;
  lesson_id?: string;
  full_name?: string;
  grade: number | null;
  topic?: string;
  unit?: string;
  difficulty_probability: number;
  predicted_difficulty: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  display_probability: number;
  display_risk_label: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  bldi_score: number;
  bldi_band: "HIGH" | "MEDIUM" | "LOW";
};

export type StudentRiskSummary = {
  student_id: string;
  full_name: string;
  grade: number | null;
  max_probability: number;
  avg_probability: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  display_probability: number;
  display_risk_label: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  most_risky_topic: string;
  record_count: number;
  avg_bldi: number;
  max_bldi: number;
  bldi_band: "HIGH" | "MEDIUM" | "LOW";
};

export type PredictionAnalytics = {
  rows: PredictionRow[];
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;

  highRiskStudentCount: number;
  mediumRiskStudentCount: number;
  lowRiskStudentCount: number;

  avgProbability: number;
  avgBLDI: number;
  topRiskTopics: { label: string; value: number }[];
  studentSummaries: StudentRiskSummary[];
};

async function readPredictionCsv(): Promise<string> {
  const asset = Asset.fromModule(require("../assets/model/student_predictions.csv"));
  await asset.downloadAsync();

  if (!asset.localUri) {
    throw new Error("Prediction CSV could not be loaded.");
  }

  return FileSystem.readAsStringAsync(asset.localUri);
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toNullableNumber(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeRisk(v: string): "HIGH" | "MEDIUM" | "LOW" {
  const x = (v || "").toUpperCase();
  if (x === "HIGH" || x === "MEDIUM" || x === "LOW") return x;
  return "LOW";
}

function toDisplayProbability(p: number): number {
  const pct = Math.round(p * 100);

  if (pct >= 99) return 98;
  if (pct <= 1) return 2;
  return pct;
}

function toDisplayRiskLabel(
  p: number
): "CRITICAL" | "HIGH" | "MODERATE" | "LOW" {
  if (p >= 0.9) return "CRITICAL";
  if (p >= 0.75) return "HIGH";
  if (p >= 0.5) return "MODERATE";
  return "LOW";
}

export async function loadPredictionAnalytics(): Promise<PredictionAnalytics> {
  const csvText = await readPredictionCsv();
  const parsed = parseCsv(csvText);

  const rows: PredictionRow[] = parsed.map((r) => {
    const probability = toNum(r.difficulty_probability);

    return {
      student_id: r.student_id ?? "",
      lesson_id: r.lesson_id ?? "",
      full_name: r.full_name ?? "Unknown Student",
      grade: toNullableNumber(r.grade),
      topic: r.topic ?? "Unknown",
      unit: r.unit ?? "Unknown",
      difficulty_probability: probability,
      predicted_difficulty: toNum(r.predicted_difficulty),
      risk_level: normalizeRisk(r.risk_level),
      display_probability: toDisplayProbability(probability),
      display_risk_label: toDisplayRiskLabel(probability),
      bldi_score: toNum(r.bldi_score),
      bldi_band: normalizeRisk(r.bldi_band),
    };
  });

  const highRiskCount = rows.filter((r) => r.risk_level === "HIGH").length;
  const mediumRiskCount = rows.filter((r) => r.risk_level === "MEDIUM").length;
  const lowRiskCount = rows.filter((r) => r.risk_level === "LOW").length;

  const avgProbability =
    rows.reduce((sum, r) => sum + r.difficulty_probability, 0) /
    Math.max(rows.length, 1);

  const avgBLDI =
    rows.reduce((sum, r) => sum + r.bldi_score, 0) /
    Math.max(rows.length, 1);

  const topicMap: Record<string, { sum: number; count: number }> = {};
  for (const row of rows) {
    const key = row.topic || "Unknown";
    if (!topicMap[key]) {
      topicMap[key] = { sum: 0, count: 0 };
    }
    topicMap[key].sum += row.difficulty_probability;
    topicMap[key].count += 1;
  }

  const topRiskTopics = Object.entries(topicMap)
    .map(([label, stats]) => ({
      label: label.length > 6 ? label.slice(0, 6).toUpperCase() : label.toUpperCase(),
      value: Math.round((stats.sum / stats.count) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const studentMap: Record<
    string,
    {
      full_name: string;
      grade: number | null;
      probs: number[];
      bldiScores: number[];
      topics: Record<string, number>;
    }
  > = {};

  for (const row of rows) {
    if (!studentMap[row.student_id]) {
      studentMap[row.student_id] = {
        full_name: row.full_name || "Unknown Student",
        grade: row.grade ?? null,
        probs: [],
        bldiScores: [],
        topics: {},
      };
    }

    studentMap[row.student_id].probs.push(row.difficulty_probability);
    studentMap[row.student_id].bldiScores.push(row.bldi_score);

    const topic = row.topic || "Unknown";
    studentMap[row.student_id].topics[topic] =
      (studentMap[row.student_id].topics[topic] ?? 0) +
      row.difficulty_probability;
  }

  const studentSummaries: StudentRiskSummary[] = Object.entries(studentMap)
    .map(([student_id, info]) => {
      const max_probability = Math.max(...info.probs);
      const avg_probability =
        info.probs.reduce((a, b) => a + b, 0) /
        Math.max(info.probs.length, 1);

      const avg_bldi =
        info.bldiScores.reduce((a, b) => a + b, 0) /
        Math.max(info.bldiScores.length, 1);

      const max_bldi = Math.max(...info.bldiScores);

      const most_risky_topic =
        Object.entries(info.topics).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "Unknown";

      const risk_level: "HIGH" | "MEDIUM" | "LOW" =
        max_probability >= 0.8 ? "HIGH" : max_probability >= 0.55 ? "MEDIUM" : "LOW";

      const bldi_band: "HIGH" | "MEDIUM" | "LOW" =
        max_bldi >= 70 ? "HIGH" : max_bldi >= 40 ? "MEDIUM" : "LOW";

      return {
        student_id,
        full_name: info.full_name,
        grade: info.grade,
        max_probability,
        avg_probability,
        risk_level,
        display_probability: toDisplayProbability(max_probability),
        display_risk_label: toDisplayRiskLabel(max_probability),
        most_risky_topic,
        record_count: info.probs.length,
        avg_bldi: Math.round(avg_bldi * 10) / 10,
        max_bldi: Math.round(max_bldi * 10) / 10,
        bldi_band,
      };
    })
    .sort((a, b) => b.max_probability - a.max_probability);

  const highRiskStudentCount = studentSummaries.filter(
    (s) => s.risk_level === "HIGH"
  ).length;

  const mediumRiskStudentCount = studentSummaries.filter(
    (s) => s.risk_level === "MEDIUM"
  ).length;

  const lowRiskStudentCount = studentSummaries.filter(
    (s) => s.risk_level === "LOW"
  ).length;

  return {
    rows,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,

    highRiskStudentCount,
    mediumRiskStudentCount,
    lowRiskStudentCount,

    avgProbability: Math.round(avgProbability * 100) / 100,
    avgBLDI: Math.round(avgBLDI * 10) / 10,
    topRiskTopics,
    studentSummaries,
  };
}