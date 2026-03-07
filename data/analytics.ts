import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { parseCsv } from "../utils/csv";

export type Student = {
  student_id: string;
  full_name: string;
  grade: number;
  visually_impaired_type: string;
};

export type StudentLesson = {
  student_id: string;
  lesson_id: string;
  grade: number;
  topic: string;
  unit: string;
  total_listen_time_sec: number;
  pause_count: number;
  replay_count: number;
  seek_back_seconds: number;
  completion_rate: number;
};

export type DashboardStats = {
  totalStudents: number;
  activeThisWeek: number;
  avgCompletionRate: number;     // 0..1
  avgListenTimeMin: number;      // minutes
};

export type TopicBar = { label: string; value: number };
export type LinePoint = { label: string; value: number };

export type AnalyticsResult = {
  students: Student[];
  lessons: StudentLesson[];
  stats: DashboardStats;
  topicWeakness: TopicBar[];
  weakTopicsByStudent: Record<string, TopicBar[]>;
};

// 1) Register CSV assets here (Expo requires static require)
const assets = {
  students: require("../assets/datasets/students_dataset.csv"),
  studentLesson: require("../assets/datasets/student_lesson.csv"),
  studentLessonFeatures: require("../assets/datasets/student_lesson_features.csv"),
};

async function readAssetText(assetModule: number): Promise<string> {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error("Asset has no localUri");
  return FileSystem.readAsStringAsync(asset.localUri);
}

function toInt(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function toFloat(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Weakness heuristic (panel-friendly):
// High pauses + high seeks + low completion => weak topic
function weaknessScore(r: StudentLesson): number {
  const completionPenalty = (1 - r.completion_rate) * 60; // 0..60
  const pausePenalty = Math.min(r.pause_count * 4, 30);   // capped
  const seekPenalty = Math.min(r.seek_back_seconds / 5, 30);
  const replayPenalty = Math.min(r.replay_count * 6, 18);
  return Math.round(completionPenalty + pausePenalty + seekPenalty + replayPenalty);
}

export async function loadAnalytics(): Promise<AnalyticsResult> {
  // Load CSV text
  const studentsCsv = await readAssetText(assets.students);
  const lessonCsv = await readAssetText(assets.studentLesson);

  const studentsRows = parseCsv(studentsCsv);
  const lessonRows = parseCsv(lessonCsv);

  const students: Student[] = studentsRows.map((r) => ({
    student_id: r.student_id,
    full_name: r.full_name,
    grade: toInt(r.grade),
    visually_impaired_type: r.visually_impaired_type,
  }));

  const lessons: StudentLesson[] = lessonRows.map((r) => ({
    student_id: r.student_id,
    lesson_id: r.lesson_id,
    grade: toInt(r.grade),
    topic: r.topic,
    unit: r.unit,
    total_listen_time_sec: toInt(r.total_listen_time_sec),
    pause_count: toInt(r.pause_count),
    replay_count: toInt(r.replay_count),
    seek_back_seconds: toInt(r.seek_back_seconds),
    completion_rate: toFloat(r.completion_rate),
  }));

  // Dashboard stats
  const totalStudents = students.length;

  // “Active this week” is not in dataset, so for now:
  // Active = students with at least 2 lesson records.
  const lessonCountByStudent: Record<string, number> = {};
  lessons.forEach((l) => {
    lessonCountByStudent[l.student_id] = (lessonCountByStudent[l.student_id] ?? 0) + 1;
  });
  const activeThisWeek = Object.values(lessonCountByStudent).filter((c) => c >= 2).length;

  const avgCompletionRate =
    lessons.reduce((s, l) => s + l.completion_rate, 0) / Math.max(lessons.length, 1);

  const avgListenTimeMin =
    lessons.reduce((s, l) => s + l.total_listen_time_sec, 0) / Math.max(lessons.length, 1) / 60;

  const stats: DashboardStats = {
    totalStudents,
    activeThisWeek,
    avgCompletionRate,
    avgListenTimeMin: Math.round(avgListenTimeMin * 10) / 10,
  };

  // Weakness by topic (overall)
  const topicAgg: Record<string, { sum: number; n: number }> = {};
  lessons.forEach((l) => {
    const k = shortTopic(l.unit); // short label for chart
    const w = weaknessScore(l);
    if (!topicAgg[k]) topicAgg[k] = { sum: 0, n: 0 };
    topicAgg[k].sum += w;
    topicAgg[k].n += 1;
  });

  const topicWeakness: TopicBar[] = Object.entries(topicAgg)
    .map(([label, v]) => ({ label, value: Math.round(v.sum / v.n) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Weak topics by student (top 5 per student)
  const perStudentUnit: Record<string, Record<string, { sum: number; n: number }>> = {};
  lessons.forEach((l) => {
    const sid = l.student_id;
    const unit = shortTopic(l.unit);
    const w = weaknessScore(l);

    if (!perStudentUnit[sid]) perStudentUnit[sid] = {};
    if (!perStudentUnit[sid][unit]) perStudentUnit[sid][unit] = { sum: 0, n: 0 };
    perStudentUnit[sid][unit].sum += w;
    perStudentUnit[sid][unit].n += 1;
  });

  const weakTopicsByStudent: Record<string, TopicBar[]> = {};
  Object.keys(perStudentUnit).forEach((sid) => {
    weakTopicsByStudent[sid] = Object.entries(perStudentUnit[sid])
      .map(([label, v]) => ({ label, value: Math.round(v.sum / v.n) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  });

  return { students, lessons, stats, topicWeakness, weakTopicsByStudent };
}

// Shorten chart labels (units can be long)
function shortTopic(unit: string): string {
  const u = (unit || "").toLowerCase();
  if (u.includes("network")) return "NW";
  if (u.includes("operating")) return "OS";
  if (u.includes("program")) return "PRG";
  if (u.includes("security")) return "SEC";
  if (u.includes("database")) return "DB";
  if (u.includes("hardware")) return "HW";
  return unit.length > 6 ? unit.slice(0, 6).toUpperCase() : unit.toUpperCase();
}