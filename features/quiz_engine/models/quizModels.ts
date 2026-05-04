/**
 * Core quiz data models. These are aligned with assets/data/large_lesson.json.
 */

export interface QuizQuestion {
  id: string;
  category: string; // e.g. "Networking", "Health/Security"
  question: string;
  options: string[];
  correct_answer: string;
  hint_topic?: string;
  grade: number; // 10 or 11
}

/**
 * A graded learner answer used by stats + engagement engine.
 */
export interface GradedAnswer {
  questionId: string;
  selectedOption: string | null;
  isCorrect: boolean;
  /** Unix timestamp (ms) when the answer was given. */
  answeredAt: number;
}

/**
 * Simple runtime representation of the current quiz state.
 * Controller and engine classes can use this shape internally.
 */
export interface QuizSessionStateModel {
  /** Unique id for this running session. Could be a timestamp string. */
  sessionId: string;
  /** Session configuration (type, limit, etc.). */
  config: any; // kept flexible; see sessionTypes.ts
  /** Index of the current question in the sessionQuestionIds list. */
  currentIndex: number;
  /** Ordered question ids for this session. */
  sessionQuestionIds: string[];
  /** History of graded answers. */
  answers: GradedAnswer[];
  /** True when session has finished (no more questions). */
  finished: boolean;
}
