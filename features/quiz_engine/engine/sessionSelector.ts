import { QuizQuestion } from "../../data/datasetLoader";
import { SessionConfig } from "../models/sessionTypes";
import { EngagementResult } from "./engagementEngine";
import { predictWeaknessProbability, WeaknessFeatures } from "../ml/weaknessModel";
import type { StatsMap, AttemptRecord, QuestionStat } from "./progressStore";

type CatAgg = {
  attempts: number;
  correct: number;
  totalTimeMs: number;
  totalHints: number;
  totalRepeats: number;
};

function normalizeAggToFeatures(a: CatAgg): WeaknessFeatures {
  const attempts = a.attempts || 0;
  const correctRatio = attempts > 0 ? a.correct / attempts : 0;
  const avgTimeSec = attempts > 0 ? a.totalTimeMs / attempts / 1000 : 0;
  const hintRate = attempts > 0 ? a.totalHints / attempts : 0;
  const repeatRate = attempts > 0 ? a.totalRepeats / attempts : 0;

  return {
    attempts,
    correct_ratio: correctRatio,
    avg_time_sec: avgTimeSec,
    hint_rate: hintRate,
    repeat_rate: repeatRate,
  };
}

function buildCategoryAggregates(statsMap: StatsMap): Map<string, CatAgg> {
  const catAgg = new Map<string, CatAgg>();

  for (const s of Object.values(statsMap ?? {})) {
    const category = (s.category ?? "Unknown").toString();

    const cur = catAgg.get(category) ?? {
      attempts: 0,
      correct: 0,
      totalTimeMs: 0,
      totalHints: 0,
      totalRepeats: 0,
    };

    const attempts = s.totalAttempts ?? 0;
    const correct = s.correctAttempts ?? 0;

    cur.attempts += attempts;
    cur.correct += correct;
    cur.totalTimeMs += s.totalTimeMs ?? 0;
    cur.totalHints += s.totalHints ?? 0;
    cur.totalRepeats += s.totalRepeats ?? 0;

    catAgg.set(category, cur);
  }

  return catAgg;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Compute category average confidence from attempt history.
 * Keyed by `${grade}::${category}` to avoid mixing grades.
 */
function buildCategoryConfidence(attemptHistory: AttemptRecord[]) {
  const map = new Map<string, { sum: number; n: number }>();

  for (const a of attemptHistory ?? []) {
    const k = `${a.grade}::${a.category}`;
    const cur = map.get(k) ?? { sum: 0, n: 0 };
    cur.sum += typeof a.confidence === "number" ? a.confidence : 0;
    cur.n += 1;
    map.set(k, cur);
  }

  const avg = (grade: number, category: string) => {
    const k = `${grade}::${category}`;
    const v = map.get(k);
    if (!v || v.n <= 0) return 0.6; // neutral default
    return clamp01(v.sum / v.n);
  };

  return { avg };
}

/**
 * Difficulty proxy per question from statsMap:
 * - correctRatio high => easier
 * - correctRatio low => harder
 * If no data => neutral 0.6 (moderately easy)
 */
function questionEaseFromStats(statsMap: StatsMap, q: QuizQuestion): number {
  const s: QuestionStat | undefined = statsMap?.[q.id];
  if (!s) return 0.6;

  const attempts = s.totalAttempts ?? 0;
  if (attempts <= 0) return 0.6;

  const correct = s.correctAttempts ?? 0;
  return clamp01(correct / attempts);
}

/**
 * ML-aware session question selector with confidence-aware difficulty adaptation.
 */
export function selectSessionQuestions(args: {
  all: QuizQuestion[];
  config: SessionConfig;
  statsMap: StatsMap;
  attemptHistory?: AttemptRecord[];
  difficulty: EngagementResult["difficulty"]; // "EASY" | "MEDIUM" | "HARD"
  weakCategories: string[];
}): QuizQuestion[] {
  const { all, config, statsMap, attemptHistory = [], weakCategories, difficulty } = args;

  const limit = Math.max(1, config.limit);

  // 1) Filter pool by config
  let pool = all;

  if (typeof config.grade === "number") {
    pool = pool.filter((q) => q.grade === config.grade);
  }

  if (config.type === "topic_drill" && config.category) {
    pool = pool.filter((q) => q.category === config.category);
  }

  if (pool.length === 0) return [];

  // 2) Aggregate stats by category for ML features
  const catAgg = buildCategoryAggregates(statsMap);

  const categoryWeakProb = (category: string) => {
    const a = catAgg.get(category);
    if (!a || a.attempts <= 0) return 0.25;
    return predictWeaknessProbability(normalizeAggToFeatures(a)); // 0..1
  };

  // 3) Confidence context
  const conf = buildCategoryConfidence(attemptHistory);

  // 4) Weight per question
  const alpha =
    config.type === "weak_area" ? 2.0 : config.type === "practice" ? 1.25 : 0.9;

  const weights = pool.map((q) => {
    const cat = (q.category ?? "Unknown").toString();
    const mlRisk = categoryWeakProb(cat); // 0..1
    const avgConf = conf.avg(q.grade, cat); // 0..1
    const ease = questionEaseFromStats(statsMap, q); // 0..1, higher = easier
    const hardness = 1 - ease;

    // Base weight
    let base = 1.0;

    // Boost weak categories from engagement engine heuristic
    if (weakCategories.includes(cat)) base *= 1.25;

    // Engagement difficulty (light touch)
    if (difficulty === "EASY") base *= 1.06;
    if (difficulty === "HARD") base *= 1.03;

    // ML influence
    let w = base * (1 + alpha * mlRisk);

    // Confidence-aware adaptation:
    // - Low confidence: prioritize easier questions in that category
    // - High confidence: allow harder questions (challenge)
    if (avgConf < 0.5) {
      // ranges approx 0.6 .. 1.4
      w *= 0.6 + 0.8 * ease;
    } else if (avgConf > 0.75) {
      // ranges approx 0.6 .. 1.4
      w *= 0.6 + 0.8 * hardness;
    } else {
      // medium confidence, neutral
      w *= 1.0;
    }

    // Extra behavior for weak_area: prefer low-confidence categories even more
    if (config.type === "weak_area" && avgConf < 0.6) {
      w *= 1.15;
    }

    return Math.max(0.05, w);
  });

  // 5) Weighted sample without replacement
  return weightedSampleWithoutReplacement(pool, weights, limit);
}

function weightedSampleWithoutReplacement<T>(
  pool: T[],
  weights: number[],
  k: number
): T[] {
  const items = pool.map((item, i) => ({ item, w: Math.max(0, weights[i] || 0) }));
  const out: T[] = [];

  for (let pick = 0; pick < k && items.length > 0; pick++) {
    const totalW = items.reduce((s, x) => s + x.w, 0);

    if (totalW <= 0) {
      const idx = Math.floor(Math.random() * items.length);
      out.push(items[idx].item);
      items.splice(idx, 1);
      continue;
    }

    let r = Math.random() * totalW;
    let chosenIdx = 0;

    for (let i = 0; i < items.length; i++) {
      r -= items[i].w;
      if (r <= 0) {
        chosenIdx = i;
        break;
      }
    }

    out.push(items[chosenIdx].item);
    items.splice(chosenIdx, 1);
  }

  return out;
}