export type SessionType =
  | "practice"
  | "topic_drill"
  | "quick_revision"
  | "mock_exam"
  | "weak_area"
  | "lesson_quiz"; // NEW

export type SessionConfig = {
  type: SessionType;
  limit: number;
  grade?: 10 | 11;
  category?: string;

  // NEW: strict lesson mapping
  lessonId?: string;
  lessonTitle?: string; // optional but useful for intro speech
};
