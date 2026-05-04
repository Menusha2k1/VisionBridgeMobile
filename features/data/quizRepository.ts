import {
  loadLessonDataset,
  loadLessonQuizIndex,
  LessonDataset,
  LessonQuizIndex,
  QuizQuestion,
} from "./datasetLoader";

export type QuizQuery = {
  grade?: 10 | 11;
  category?: string;
  limit?: number;
};

export class QuizRepository {
  private dataset: LessonDataset;
  private index: LessonQuizIndex;

  // Fast lookup: questionId -> question
  private questionById: Map<string, QuizQuestion>;

  constructor() {
    this.dataset = loadLessonDataset();
    this.index = loadLessonQuizIndex();

    this.questionById = new Map<string, QuizQuestion>();
    for (const q of this.dataset.quiz ?? []) {
      if (q?.id) this.questionById.set(q.id, q);
    }
  }

  getAllQuestions(): QuizQuestion[] {
    return this.dataset.quiz ?? [];
  }

  /**
   * Existing generic access (practice/mock/topic drill by category).
   */
  getQuestions(query: QuizQuery = {}): QuizQuestion[] {
    const { grade, category, limit = 10 } = query;

    let questions = this.dataset.quiz ?? [];

    if (grade) questions = questions.filter((q) => q.grade === grade);
    if (category) questions = questions.filter((q) => q.category === category);

    return questions.slice(0, Math.max(1, limit));
  }

  /**
   * NEW: Lesson-linked questions (Supervisor requirement)
   * Returns only questions that are mapped to that lesson_id via lesson_quiz_index.json.
   *
   * Guarantees:
   * - Returns up to `limit` questions
   * - Skips missing ids safely if index contains stale ids
   */
  getQuestionsForLesson(lessonId: string, limit = 5): QuizQuestion[] {
    const ids = this.index?.[lessonId] ?? [];
    if (!ids.length) return [];

    const out: QuizQuestion[] = [];
    const max = Math.max(1, limit);

    for (let i = 0; i < ids.length && out.length < max; i++) {
      const q = this.questionById.get(ids[i]);
      if (q) out.push(q);
    }

    return out;
  }

  /**
   * Optional helper: check quickly whether a lesson is properly mapped.
   */
  hasLessonQuizMapping(lessonId: string, min = 5): boolean {
    const ids = this.index?.[lessonId] ?? [];
    return Array.isArray(ids) && ids.length >= min;
  }
}
