// app/features/karunarathne_lesson_quiz/quiz_engine/engine/learnerProfile.ts
//
// Builds a learner profile (per-topic aggregation) from progressStore.getStatsMap().
// STRICT TypeScript friendly and matches progressStore field names.

import type { StatsMap, QuestionStat } from "./progressStore";

export type TopicProfile = {
  key: string; // `${grade}::${category}`
  grade: number;
  category: string;

  attempts: number;
  correct: number;
  wrong: number;

  totalTimeMs: number;
  hintUsed: number;
  repeatUsed: number;

  // Derived metrics
  correctRatio: number; // 0..1
  avgTimeSec: number;
  hintRate: number; // 0..1
  repeatRate: number; // 0..1

  // Heuristic weakness score (0..1)
  weaknessScore: number;
};

export type LearnerProfile = {
  topics: TopicProfile[];
  totalAttempts: number;
  overallCorrectRatio: number; // 0..1
  weakestTopics: TopicProfile[]; // sorted (weakest first)
  topWeakCategories: { grade: number; category: string; weaknessScore: number }[];
};

type AnyStats = Record<string, unknown>;
type NormalizableStats = QuestionStat | AnyStats;

/**
 * Coerce unknown values safely into numbers for arithmetic.
 */
function num(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

/**
 * Normalizes a stored question stat object into a consistent shape.
 * Supports:
 * - current progressStore QuestionStat (totalAttempts, correctAttempts, totalHints, totalRepeats...)
 * - legacy/other shapes (attempts, correct, hintUsed, repeatUsed...)
 */
function normalizeQuestionStats(s: NormalizableStats) {
  const attempts =
    num((s as any).attempts) ||
    num((s as any).totalAttempts) ||
    num((s as any).total) ||
    num((s as any).count) ||
    0;

  const correct =
    num((s as any).correct) ||
    num((s as any).correctCount) ||
    num((s as any).corrects) ||
    num((s as any).correctAttempts) ||
    0;

  // Wrong may be explicitly stored in some versions; otherwise derive it.
  const hasWrong =
    typeof (s as any).wrong === "number" || typeof (s as any).wrongCount === "number";

  const wrongExplicit = hasWrong
    ? num((s as any).wrong) || num((s as any).wrongCount)
    : 0;

  const wrong = hasWrong ? wrongExplicit : Math.max(0, attempts - correct);

  const totalTimeMs =
    num((s as any).totalTimeMs) ||
    num((s as any).totalTimeTakenMs) ||
    num((s as any).timeTakenMs) ||
    num((s as any).timeMs) ||
    0;

  // progressStore uses totalHints/totalRepeats
  const hintUsed =
    num((s as any).hintUsed) ||
    num((s as any).hints) ||
    num((s as any).totalHints) ||
    0;

  const repeatUsed =
    num((s as any).repeatUsed) ||
    num((s as any).repeats) ||
    num((s as any).totalRepeats) ||
    0;

  const category = str((s as any).category, "") || str((s as any).topic, "") || "General";

  const gradeRaw = ((s as any).grade ?? (s as any).gradeLevel ?? (s as any).g) as unknown;
  const grade = num(gradeRaw);

  return {
    attempts,
    correct,
    wrong,
    totalTimeMs,
    hintUsed,
    repeatUsed,
    category,
    grade,
  };
}

/**
 * Aggregate question stats into per-topic profiles.
 */
export function buildTopicProfiles(statsMap: StatsMap): TopicProfile[] {
  const agg = new Map<string, TopicProfile>();

  for (const v of Object.values(statsMap ?? {})) {
    const s = normalizeQuestionStats(v);

    if (!s.category) continue;

    const key = `${s.grade}::${s.category}`;

    const cur: TopicProfile =
      agg.get(key) ?? {
        key,
        grade: s.grade,
        category: s.category,

        attempts: 0,
        correct: 0,
        wrong: 0,

        totalTimeMs: 0,
        hintUsed: 0,
        repeatUsed: 0,

        correctRatio: 0,
        avgTimeSec: 0,
        hintRate: 0,
        repeatRate: 0,

        weaknessScore: 0,
      };

    cur.attempts += s.attempts;
    cur.correct += s.correct;
    cur.wrong += s.wrong;
    cur.totalTimeMs += s.totalTimeMs;
    cur.hintUsed += s.hintUsed;
    cur.repeatUsed += s.repeatUsed;

    agg.set(key, cur);
  }

  const topics: TopicProfile[] = [];

  for (const t of agg.values()) {
    const attempts = Math.max(0, t.attempts);

    t.correctRatio = attempts > 0 ? t.correct / attempts : 0;
    t.avgTimeSec = attempts > 0 ? t.totalTimeMs / 1000 / attempts : 0;
    t.hintRate = attempts > 0 ? t.hintUsed / attempts : 0;
    t.repeatRate = attempts > 0 ? t.repeatUsed / attempts : 0;

    // Weakness heuristic (0..1)
    const wrongRate = attempts > 0 ? t.wrong / attempts : 0;
    const timePenalty = Math.min(1, t.avgTimeSec / 25);
    const hintPenalty = Math.min(1, t.hintRate);
    const repeatPenalty = Math.min(1, t.repeatRate);

    t.weaknessScore =
      0.65 * wrongRate +
      0.2 * hintPenalty +
      0.1 * repeatPenalty +
      0.05 * timePenalty;

    t.weaknessScore = Math.max(0, Math.min(1, t.weaknessScore));

    topics.push(t);
  }

  // Sort: weakest first
  topics.sort((a, b) => {
    if (b.weaknessScore !== a.weaknessScore) return b.weaknessScore - a.weaknessScore;
    return b.attempts - a.attempts;
  });

  return topics;
}

/**
 * Return top weak categories (unique by grade+category).
 */
export function getTopWeakCategories(
  profiles: TopicProfile[],
  limit = 5,
): { grade: number; category: string; weaknessScore: number }[] {
  const out: { grade: number; category: string; weaknessScore: number }[] = [];
  const seen = new Set<string>();

  for (const p of profiles) {
    const k = `${p.grade}::${p.category}`;
    if (seen.has(k)) continue;
    seen.add(k);

    out.push({ grade: p.grade, category: p.category, weaknessScore: p.weaknessScore });
    if (out.length >= limit) break;
  }

  return out;
}

/**
 * Builds a full profile object from statsMap.
 */
export function buildLearnerProfile(statsMap: StatsMap): LearnerProfile {
  const topics = buildTopicProfiles(statsMap);

  const totalAttempts = topics.reduce((sum, t) => sum + t.attempts, 0);
  const totalCorrect = topics.reduce((sum, t) => sum + t.correct, 0);

  const overallCorrectRatio = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  const weakestTopics = [...topics].sort((a, b) => {
    if (b.weaknessScore !== a.weaknessScore) return b.weaknessScore - a.weaknessScore;
    return b.attempts - a.attempts;
  });

  const topWeakCategories = getTopWeakCategories(weakestTopics, 5);

  return {
    topics,
    totalAttempts,
    overallCorrectRatio,
    weakestTopics,
    topWeakCategories,
  };
}

/**
 * Mastery percentage (100 = strong).
 */
export function masteryPercent(topic: TopicProfile): number {
  return Math.round((1 - topic.weaknessScore) * 100);
}