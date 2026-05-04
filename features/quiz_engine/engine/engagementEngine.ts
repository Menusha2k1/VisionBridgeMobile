import { QuestionStat } from "./progressStore";
import { loadWeakTopicModel, computeWeaknessScore } from "./weakTopicModel";

export type EngagementLevel = "LOW" | "MEDIUM" | "HIGH";
export type DifficultyBand = "EASY" | "MEDIUM" | "HARD";

export interface EngagementResult {
  level: EngagementLevel;
  difficulty: DifficultyBand;
  /**
   * Categories where learner is relatively weak
   * (lower accuracy with enough attempts).
   */
  weakCategories: string[];
}

/**
 * Compute a simple but meaningful engagement profile:
 * - overall accuracy
 * - average hints / repeats / time
 * - weak categories by accuracy
 */
export function computeEngagement(stats: QuestionStat[]): EngagementResult {
  if (!stats.length) {
    return {
      level: "MEDIUM",
      difficulty: "MEDIUM",
      weakCategories: [],
    };
  }

  let totalAttempts = 0;
  let totalCorrect = 0;
  let totalTime = 0;
  let totalHints = 0;
  let totalRepeats = 0;

  const categoryMap: Record<
    string,
    { attempts: number; correct: number }
  > = {};

  for (const s of stats) {
    totalAttempts += s.totalAttempts;
    totalCorrect += s.correctAttempts;
    totalTime += s.totalTimeMs;
    totalHints += s.totalHints;
    totalRepeats += s.totalRepeats;

    if (!categoryMap[s.category]) {
      categoryMap[s.category] = { attempts: 0, correct: 0 };
    }
    categoryMap[s.category].attempts += s.totalAttempts;
    categoryMap[s.category].correct += s.correctAttempts;
  }

  const accuracy = totalAttempts ? totalCorrect / totalAttempts : 0;
  const avgTime = totalAttempts ? totalTime / totalAttempts : 0;
  const avgHints = totalAttempts ? totalHints / totalAttempts : 0;
  const avgRepeats = totalAttempts ? totalRepeats / totalAttempts : 0;

  // Engagement level heuristic
  let level: EngagementLevel = "MEDIUM";

  if (accuracy < 0.5 || avgHints > 0.7 || avgRepeats > 0.7) {
    level = "LOW";
  } else if (accuracy > 0.8 && avgTime < 15000 && avgHints < 0.4) {
    level = "HIGH";
  }

  // Difficulty band suggestion
  let difficulty: DifficultyBand = "MEDIUM";
  if (level === "LOW") difficulty = "EASY";
  if (level === "HIGH") difficulty = "HARD";

  // Compute weak categories
  const weakCategories: string[] = [];
  for (const [cat, agg] of Object.entries(categoryMap)) {
    if (agg.attempts < 3) continue; // need enough data
    const catAccuracy = agg.correct / agg.attempts;
    if (catAccuracy < 0.6) {
      weakCategories.push(cat);
    }
  }

  return {
    level,
    difficulty,
    weakCategories,
  };
}
