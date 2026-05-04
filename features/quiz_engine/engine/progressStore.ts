import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CategoryFeatureRow } from "../models/quizStats";

const STORAGE_KEY = "vb_quiz_stats_v1";
const ATTEMPT_HISTORY_KEY = "vb_quiz_attempt_history_v1";
const ATTEMPT_HISTORY_LIMIT = 100;

export interface QuestionStat {
  id: string;
  category: string;
  grade: number;
  totalAttempts: number;
  correctAttempts: number;
  totalTimeMs: number;
  totalHints: number;
  totalRepeats: number;
  lastAnsweredAt: number;
}

export type StatsMap = Record<string, QuestionStat>;

interface UpsertAttemptInput {
  id: string;
  category: string;
  grade: number;
  isCorrect: boolean;
  timeTakenMs: number;
  hintUsed: number;
  repeatUsed: number;
}

export type AttemptRecord = {
  questionId: string;
  category: string;
  grade: number;
  isCorrect: boolean;
  timeTakenMs: number;
  hintUsed: number;
  repeatUsed: number;
  confidence: number; // 0..1
  answeredAt: number;
};

async function loadStats(): Promise<StatsMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as StatsMap;
  } catch {
    return {};
  }
}

async function saveStats(map: StatsMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // non-fatal
  }
}

/**
 * Returns full stats map (id -> QuestionStat).
 */
export async function getStatsMap(): Promise<StatsMap> {
  return await loadStats();
}

/**
 * Upserts a single attempt into the stats map.
 * Called from QuizController.answer().
 */
export async function upsertAttempt(input: UpsertAttemptInput): Promise<void> {
  const stats = await loadStats();
  const existing = stats[input.id];
  const now = Date.now();

  const updated: QuestionStat = existing
    ? {
        ...existing,
        category: input.category || existing.category,
        grade: typeof input.grade === "number" ? input.grade : existing.grade,
        totalAttempts: (existing.totalAttempts || 0) + 1,
        correctAttempts:
          (existing.correctAttempts || 0) + (input.isCorrect ? 1 : 0),
        totalTimeMs:
          (existing.totalTimeMs || 0) + Math.max(0, input.timeTakenMs || 0),
        totalHints:
          (existing.totalHints || 0) + Math.max(0, input.hintUsed || 0),
        totalRepeats:
          (existing.totalRepeats || 0) + Math.max(0, input.repeatUsed || 0),
        lastAnsweredAt: now,
      }
    : {
        id: input.id,
        category: input.category,
        grade: input.grade,
        totalAttempts: 1,
        correctAttempts: input.isCorrect ? 1 : 0,
        totalTimeMs: Math.max(0, input.timeTakenMs || 0),
        totalHints: Math.max(0, input.hintUsed || 0),
        totalRepeats: Math.max(0, input.repeatUsed || 0),
        lastAnsweredAt: now,
      };

  stats[input.id] = updated;
  await saveStats(stats);
}

/**
 * Convert per-question QuestionStat into a category feature row.
 * Used by learnerProfile and any category aggregation logic.
 */
export function toCategoryFeature(stat: QuestionStat): CategoryFeatureRow {
  const attempts = stat.totalAttempts || 0;
  const correctRatio = attempts > 0 ? stat.correctAttempts / attempts : 0;
  const avgTimeSec = attempts > 0 ? stat.totalTimeMs / attempts / 1000 : 0;
  const hintRate = attempts > 0 ? stat.totalHints / attempts : 0;
  const repeatRate = attempts > 0 ? stat.totalRepeats / attempts : 0;

  return {
    category: stat.category,
    grade: stat.grade,
    attempts,
    correctRatio,
    avgTimeSec,
    hintRate,
    repeatRate,
  };
}

/* ==============================
   Attempt history (last N answers)
   ============================== */

export async function getAttemptHistory(): Promise<AttemptRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(ATTEMPT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AttemptRecord[]) : [];
  } catch {
    return [];
  }
}

export async function appendAttemptHistory(row: AttemptRecord): Promise<void> {
  try {
    const history = await getAttemptHistory();
    const next = [row, ...history].slice(0, ATTEMPT_HISTORY_LIMIT);
    await AsyncStorage.setItem(ATTEMPT_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // non-fatal
  }
}

export async function resetAttemptHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ATTEMPT_HISTORY_KEY);
  } catch {
    // non-fatal
  }
}

/* ==============================
   Reset helpers
   ============================== */

// Clears only stored quiz stats
export async function resetStats(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // non-fatal
  }
}

// Clears everything related to learner progress in this module
export async function resetAllLearnerData(): Promise<void> {
  try {
    // Strong reset: remove known keys first
    await AsyncStorage.multiRemove([STORAGE_KEY, ATTEMPT_HISTORY_KEY]);

    // Also remove any legacy keys your app might have written
    const keys = await AsyncStorage.getAllKeys();
    const quizKeys = keys.filter(
      (k) =>
        k.startsWith("vb_") ||
        k.startsWith("visionbridge_") ||
        k.includes("quiz_stats") ||
        k.includes("attempt_history")
    );

    if (quizKeys.length > 0) {
      await AsyncStorage.multiRemove(quizKeys);
    }
  } catch {
    // non-fatal
  }
}