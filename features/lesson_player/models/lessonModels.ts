/**
 * Lesson domain models for the Lesson Player.
 * These are aligned with assets/lessons_ict_ol.json.
 */

export type LessonSegmentType =
  | "intro"
  | "definition"
  | "explanation"
  | "example"
  | "list"
  | "recap";

export interface LessonSegment {
  /** Local segment id inside a lesson (e.g. S1, S2). */
  id: string;
  /** Semantic type used to adjust how we narrate in the future. */
  type: LessonSegmentType | string;
  /** Plain text that will be spoken by TTS. */
  text: string;
}

export interface LessonUnit {
  /** Unique id such as L_NET_11_01. */
  lesson_id: string;
  /** High level grouping (Networking, Health/Security, etc.). */
  category: string;
  /** Grade 10 or 11. */
  grade: number;
  /** Sort order within the entire course. */
  order: number;
  /** Human-readable lesson title. */
  title: string;
  /** Short learning objective sentence. */
  objective: string;
  /** Sequence of speaking segments. */
  segments: LessonSegment[];
}

export interface LessonBank {
  /** Course code, e.g. ICT_OL_SRI_LANKA. */
  course_id: string;
  title: string;
  grades: number[];
  lessons: LessonUnit[];
}

/**
 * Cursor representing where the learner is inside the audio lesson stream.
 * Can be stored in AsyncStorage later to resume.
 */
export interface LessonCursor {
  lessonId: string;
  segmentIndex: number;
  /** Optional timestamp when this position was last visited. */
  updatedAt?: number;
}

/**
 * Summarised lesson progress for dashboards and analytics.
 */
export interface LessonProgressSummary {
  totalLessons: number;
  completedLessons: number;
  /** Percentage in 0-1 range. */
  completionRatio: number;
}
