// app/features/karunarathne_lesson_quiz/quiz_engine/models/quizStats.ts
import { GradedAnswer } from "./quizModels";

/**
 * Aggregated statistics for a single quiz session.
 */
export interface QuizStats {
  totalQuestions: number;
  answered: number;
  correct: number;
  incorrect: number;
  /** 0-1 ratio of correct answers. */
  accuracy: number;
  /** Longest streak of correct answers in this session. */
  bestStreak: number;
  /** Simple engagement score (0-1) - can be tuned by the engagement engine. */
  engagementScore: number;
}

/**
 * Utility to compute stats from answer history.
 * Can be reused by analytics or by the adaptive session selector.
 */
export function computeQuizStats(
  totalQuestions: number,
  graded: GradedAnswer[]
): QuizStats {
  const answered = graded.length;
  const correct = graded.filter((a) => a.isCorrect).length;
  const incorrect = answered - correct;

  let bestStreak = 0;
  let currentStreak = 0;
  graded.forEach((a) => {
    if (a.isCorrect) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const accuracy = totalQuestions > 0 ? correct / totalQuestions : 0;
  // EngagementScore is a very simple heuristic for now
  const engagementScore =
    answered === 0 ? 0 : Math.min(1, (answered + bestStreak) / (2 * totalQuestions));

  return {
    totalQuestions,
    answered,
    correct,
    incorrect,
    accuracy,
    bestStreak,
    engagementScore,
  };
}

/**
 * Feature vector for the weak-topic model.
 * Each row represents performance for a given (question/category).
 * We will aggregate or average per category when computing weakness.
 */
export interface CategoryFeatureRow {
  category: string;
  grade: number;
  attempts: number;
  correctRatio: number; // 0..1
  avgTimeSec: number;
  hintRate: number;     // hints per attempt
  repeatRate: number;   // repeats per attempt
}
