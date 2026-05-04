import {
  loadLessonBank,
  LessonBank,
  LessonContentSegment,
} from "./datasetLoader";

export type LessonSummary = {
  lessonId: string;
  title: string;
  category: string;
  grade: number;
  order: number;
  objective: string;
};

export class LessonRepository {
  private bank: LessonBank;

  constructor() {
    // Load the structured lesson bank from assets/data/lessons_ict_ol.json
    this.bank = loadLessonBank();
  }

  getCourseMeta() {
    return {
      courseId: this.bank.course_id,
      title: this.bank.title,
      grades: this.bank.grades,
    };
  }

  getGrades(): number[] {
    if (Array.isArray(this.bank.grades) && this.bank.grades.length > 0) {
      return [...this.bank.grades].sort();
    }
    const grades = new Set<number>();
    this.bank.lessons.forEach((l) => grades.add(l.grade));
    return Array.from(grades).sort();
  }

  getLessonSummariesForGrade(grade: number): LessonSummary[] {
    return this.bank.lessons
      .filter((l) => l.grade === grade)
      .sort((a, b) => a.order - b.order)
      .map((l) => ({
        lessonId: l.lesson_id,
        title: l.title,
        category: l.category,
        grade: l.grade,
        order: l.order,
        objective: l.objective,
      }));
  }

  getDefaultLesson(): LessonSummary | undefined {
    const grades = this.getGrades();
    if (!grades.length) return undefined;
    const firstGrade = grades[0];
    const list = this.getLessonSummariesForGrade(firstGrade);
    return list[0];
  }

  getSegmentsForLesson(id: string): LessonContentSegment[] {
    const lesson = this.bank.lessons.find((l) => l.lesson_id === id);
    return lesson?.segments ?? [];
  }
}
