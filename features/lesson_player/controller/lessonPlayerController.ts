import { LessonRepository, LessonSummary } from "../../data/lessonRepository";
import { AudioTtsEngine } from "../engine/audioTtsEngine";
import { LessonSequencer } from "../engine/lessonSequencer";
import { LessonContentSegment } from "../../data/datasetLoader";

type QuizUnlockListener = (unlocked: boolean) => void;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export class LessonPlayerController {
  private repo = new LessonRepository();
  private tts = new AudioTtsEngine();
  private sequencer: LessonSequencer | null = null;
  private currentLesson: LessonSummary | null = null;

  // Quiz unlock state
  private quizUnlocked = false;
  private onQuizUnlockedChange: QuizUnlockListener;

  constructor(onQuizUnlockedChange?: QuizUnlockListener) {
    this.onQuizUnlockedChange = onQuizUnlockedChange ?? (() => {});

    const def = this.repo.getDefaultLesson();
    if (def) {
      this.loadLesson(def.lessonId);
    }
  }

  // --------- metadata for UI ----------

  getAvailableGrades(): number[] {
    return this.repo.getGrades();
  }

  getLessonsForGrade(grade: number): LessonSummary[] {
    return this.repo.getLessonSummariesForGrade(grade);
  }

  getCurrentLessonMeta(): LessonSummary | null {
    return this.currentLesson;
  }

  // --------- quiz unlock API ----------

  isQuizUnlocked(): boolean {
    return this.quizUnlocked;
  }

  private setQuizUnlocked(value: boolean) {
    if (this.quizUnlocked === value) return;
    this.quizUnlocked = value;
    this.onQuizUnlockedChange(value);
  }

  // --------- lesson selection ----------

  selectLesson(lessonId: string) {
    this.loadLesson(lessonId);
  }

  private loadLesson(lessonId: string) {
    this.setQuizUnlocked(false);

    const allForGrade10 = this.repo.getLessonSummariesForGrade(10);
    const allForGrade11 = this.repo.getLessonSummariesForGrade(11);
    const all = [...allForGrade10, ...allForGrade11];

    this.currentLesson = all.find((l) => l.lessonId === lessonId) ?? null;

    const segments = this.repo.getSegmentsForLesson(lessonId);
    this.sequencer = new LessonSequencer(segments);
  }

  private getCurrentSegment(): LessonContentSegment | null {
    if (!this.sequencer) return null;
    return this.sequencer.current();
  }

  private isLastSegment(): boolean {
    if (!this.sequencer) return false;
    return this.sequencer.index() >= this.sequencer.total() - 1;
  }

  /**
   * Build audio registry key in the format:
   * LESSONID_SEGMENTID
   *
   * Example:
   * L_G10_01_ICT_ROLE_S1
   */
  private buildSegmentAudioKey(segment: LessonContentSegment | null): string | null {
    if (!segment || !this.currentLesson?.lessonId) return null;
    return `${this.currentLesson.lessonId}_${segment.id}`;
  }

  /**
   * Speak a lesson segment using hybrid narration:
   * 1. play pre-generated offline audio if available
   * 2. otherwise fallback to TTS
   */
  private async speakSegment(segment: LessonContentSegment | null) {
    if (!segment) return;

    const audioKey = this.buildSegmentAudioKey(segment);

    await this.tts.speakAsync(segment.text, {
      audioKey,
    });
  }

  // --------- playback controls ----------

  async start() {
    const seg = this.getCurrentSegment();
    if (!seg) return;

    this.setQuizUnlocked(false);

    await this.speakSegment(seg);

    if (this.isLastSegment()) {
      await this.handleEndOfLessonFlow();
    }
  }

  /**
   * Move to next segment.
   *
   * Required behavior:
   * - when last segment audio ends, wait ~1 to 2 seconds
   * - speak completion + quiz guidance
   * - only after that finishes, unlock quiz
   */
  async next() {
    if (!this.sequencer) return;

    const beforeIndex = this.sequencer.index();
    const seg = this.sequencer.next();
    const afterIndex = this.sequencer.index();

    // If there was no actual forward movement and we are already at the end,
    // trigger end flow only once.
    if (beforeIndex === afterIndex && this.isLastSegment()) {
      if (!this.quizUnlocked) {
        await this.handleEndOfLessonFlow();
      }
      return;
    }

    this.setQuizUnlocked(false);

    await this.speakSegment(seg);

    if (this.isLastSegment()) {
      await this.handleEndOfLessonFlow();
    }
  }

  async prev() {
    if (!this.sequencer) return;

    const seg = this.sequencer.prev();
    if (!seg) return;

    this.setQuizUnlocked(false);

    await this.speakSegment(seg);
  }

  async repeat() {
    const seg = this.getCurrentSegment();
    if (!seg) return;

    await this.speakSegment(seg);

    if (this.isLastSegment()) {
      await this.handleEndOfLessonFlow();
    }
  }

  stop() {
    this.tts.stop();
  }

  // --------- end of lesson flow ----------

  private async handleEndOfLessonFlow() {
    if (this.quizUnlocked) return;

    const title = this.currentLesson?.title ?? "this lesson";

    this.tts.stop();

    await sleep(1200);

    await this.tts.speakAsync(
      `You have completed the lesson, ${title}. ` +
        `Now we will evaluate the knowledge you gained with a short quiz. ` +
        `Please use the Start Quiz for this Lesson button below. ` +
        `Gesture reminder: double tap the button to start the quiz.`
    );

    this.setQuizUnlocked(true);
  }

  // --------- helpers for UI ----------

  getCurrentSegmentText(): string {
    const seg = this.getCurrentSegment();
    return seg?.text ?? "";
  }

  getCurrentSegmentIndex(): number {
    if (!this.sequencer) return 0;
    return this.sequencer.index();
  }

  getSegmentCount(): number {
    if (!this.sequencer) return 0;
    return this.sequencer.total();
  }
}