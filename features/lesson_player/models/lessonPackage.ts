import { LessonBank, LessonSegment, LessonUnit } from "./lessonModels";

/**
 * A prepared lesson package that the Lesson Player can consume directly.
 * This separates raw JSON from the playback shape.
 */
export interface LessonPlaybackPackage {
  courseId: string;
  courseTitle: string;
  /** Which lesson we are currently playing. */
  lessonId: string;
  lessonTitle: string;
  objective: string;
  /** Ordered segments to speak. */
  segments: LessonSegment[];
}

/**
 * Small helper to build a playback package from our LessonBank + LessonUnit.
 * You can use this later if you introduce per-lesson navigation.
 */
export function toPlaybackPackage(
  bank: LessonBank,
  unit: LessonUnit
): LessonPlaybackPackage {
  return {
    courseId: bank.course_id,
    courseTitle: bank.title,
    lessonId: unit.lesson_id,
    lessonTitle: unit.title,
    objective: unit.objective,
    segments: unit.segments,
  };
}
