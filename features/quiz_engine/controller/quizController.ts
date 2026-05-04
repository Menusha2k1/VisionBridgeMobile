import { QuizRepository } from "../../data/quizRepository";
import { QuizQuestion } from "../../data/datasetLoader";
import { AudioTtsEngine } from "../../lesson_player/engine/audioTtsEngine";
import { evaluateAnswer } from "../engine/answerEvaluator";
import { SessionConfig } from "../models/sessionTypes";
import {
  getStatsMap,
  getAttemptHistory,
  upsertAttempt,
  appendAttemptHistory,
} from "../engine/progressStore";
import {
  computeEngagement,
  EngagementResult,
} from "../engine/engagementEngine";
import { selectSessionQuestions } from "../engine/sessionSelector";
import { callGemini } from "../../services/geminiClient";
import {
  computeConfidenceScore,
  confidenceLabel,
} from "../engine/confidenceEngine";
import { getEncouragementMessage } from "../engine/encouragementEngine";

export type AnswerStatus = "idle" | "correct" | "wrong";

export type ActiveQuestionView = {
  question: QuizQuestion | null;
  index: number;
  total: number;
  startedAt: number | null;
  lastHint?: string | null;
  selectedIndex?: number | null;
  answerStatus?: AnswerStatus;
  done?: boolean;
  correctCount?: number;
  totalCount?: number;
};

type ActiveQuestionListener = (view: ActiveQuestionView | null) => void;

export class QuizController {
  private repo = new QuizRepository();
  private tts = new AudioTtsEngine();

  private sessionQuestions: QuizQuestion[] = [];
  private idx = 0;

  private activeQuestionStartedAt = 0;
  private hintUsedThisQuestion = 0;
  private repeatUsedThisQuestion = 0;

  private correctStreak = 0;
  private wrongStreak = 0;

  private lastEngagement: EngagementResult | null = null;
  private sessionCorrect = 0;

  private onActiveChange: ActiveQuestionListener;

  // Spaced repetition queue
  private wrongQueue: QuizQuestion[] = [];
  private stepsSinceLastRepeat = 0;
  private readonly REPEAT_GAP = 2;

  // One-time gesture guidance per session
  private spokeGestureGuidanceThisSession = false;

  // Prevent double-start overlaps
  private startingSession = false;

  // One-submit lock per question
  private answerLocked = false;

  // Professional default: do not speak confidence labels automatically
  private speakConfidenceFeedback = false;

  constructor(onActiveChange?: ActiveQuestionListener) {
    this.onActiveChange = onActiveChange ?? (() => {});
  }

  /**
   * Optional: if you later add a settings toggle, you can enable this.
   * Default remains OFF to avoid repeated speech.
   */
  setSpeakConfidence(enabled: boolean) {
    this.speakConfidenceFeedback = !!enabled;
  }

  private buildActive(extra?: Partial<ActiveQuestionView>): ActiveQuestionView {
    const q = this.sessionQuestions[this.idx] ?? null;

    return {
      question: q,
      index: this.idx,
      total: this.sessionQuestions.length,
      startedAt: this.activeQuestionStartedAt || null,
      ...extra,
    };
  }

  private notifyActive(extra?: Partial<ActiveQuestionView>) {
    if (extra?.done) {
      const view: ActiveQuestionView = {
        question: null,
        index: this.sessionQuestions.length,
        total: this.sessionQuestions.length,
        startedAt: null,
        ...extra,
      };
      this.onActiveChange(view);
      return;
    }

    this.onActiveChange(this.buildActive(extra));
  }

  async startSession(config: SessionConfig) {
    if (this.startingSession) return;
    this.startingSession = true;

    this.tts.stop();

    try {
      const all =
        config.type === "lesson_quiz" ? [] : this.repo.getAllQuestions();

      const statsMap = await getStatsMap();
      const attemptHistory = await getAttemptHistory();
      const statsList = Object.values(statsMap);

      const engagement = computeEngagement(statsList);
      this.lastEngagement = engagement;

      const limit =
        engagement.level === "LOW"
          ? Math.min(5, config.limit)
          : engagement.level === "HIGH"
            ? Math.min(config.limit + 5, 40)
            : config.limit;

      const effectiveConfig: SessionConfig = { ...config, limit };

      if (effectiveConfig.type === "lesson_quiz") {
        const lessonId = effectiveConfig.lessonId;

        if (!lessonId) {
          await this.tts.speakAsync(
            "Lesson quiz could not start because the lesson identifier is missing."
          );
          this.onActiveChange(null);
          return;
        }

        this.sessionQuestions = this.repo.getQuestionsForLesson(
          lessonId,
          effectiveConfig.limit
        );
      } else {
        this.sessionQuestions = selectSessionQuestions({
          all,
          config: effectiveConfig,
          statsMap,
          attemptHistory,
          difficulty: engagement.difficulty,
          weakCategories: engagement.weakCategories,
        });
      }

      this.idx = 0;
      this.sessionCorrect = 0;
      this.correctStreak = 0;
      this.wrongStreak = 0;

      this.wrongQueue = [];
      this.stepsSinceLastRepeat = 0;
      this.spokeGestureGuidanceThisSession = false;

      if (this.sessionQuestions.length === 0) {
        await this.tts.speakAsync("No questions available for this session.");
        this.onActiveChange(null);
        return;
      }

      this.activeQuestionStartedAt = 0;
      this.hintUsedThisQuestion = 0;
      this.repeatUsedThisQuestion = 0;
      this.answerLocked = false;

      this.notifyActive({
        answerStatus: "idle",
        selectedIndex: null,
        lastHint: null,
      });

      const intro = this.sessionIntroText(effectiveConfig, engagement);
      await this.tts.speakAsync(intro);

      if (!this.spokeGestureGuidanceThisSession) {
        this.spokeGestureGuidanceThisSession = true;
        await this.tts.speakAsync(
          "Swipe up, right, down, or left to choose an option. Double tap to repeat the question. Long press for hint."
        );
      }

      await this.speakCurrentAsync();
    } finally {
      this.startingSession = false;
    }
  }

  private sessionIntroText(
    config: SessionConfig,
    engagement: EngagementResult
  ) {
    const base =
      config.type === "lesson_quiz"
        ? `Now we will evaluate your knowledge of the lesson${
            config.lessonTitle ? `, ${config.lessonTitle}` : ""
          }.`
        : config.type === "practice"
          ? "Starting practice session."
          : config.type === "topic_drill"
            ? `Starting topic drill on ${config.category ?? "selected topic"}.`
            : config.type === "quick_revision"
              ? "Starting quick revision."
              : config.type === "mock_exam"
                ? "Starting mock exam."
                : "Starting weak area practice.";

    const adapt =
      engagement.level === "LOW"
        ? "I will keep it short and provide extra hints."
        : engagement.level === "HIGH"
          ? "You are doing well. I will include more challenging questions."
          : "Let us begin.";

    return `${base} This session has ${config.limit} questions. ${adapt}`;
  }

  private async speakCurrentAsync() {
    if (
      this.idx >= this.sessionQuestions.length &&
      this.wrongQueue.length > 0
    ) {
      this.sessionQuestions.push(...this.wrongQueue);
      this.wrongQueue = [];
      this.stepsSinceLastRepeat = 0;
    }

    if (
      this.wrongQueue.length > 0 &&
      this.stepsSinceLastRepeat >= this.REPEAT_GAP &&
      this.idx < this.sessionQuestions.length
    ) {
      const repeatQ = this.wrongQueue.shift()!;
      this.sessionQuestions.splice(this.idx, 0, repeatQ);
      this.stepsSinceLastRepeat = 0;

      await this.tts.speakAsync(
        "Let us revisit a question you found difficult earlier."
      );
    }

    const q = this.sessionQuestions[this.idx];

    if (!q) {
      this.finishSession();
      return;
    }

    this.activeQuestionStartedAt = Date.now();
    this.hintUsedThisQuestion = 0;
    this.repeatUsedThisQuestion = 0;
    this.answerLocked = false;

    const optionsSpoken = q.options
      .map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`)
      .join(". ");

    this.notifyActive({
      startedAt: this.activeQuestionStartedAt,
      answerStatus: "idle",
      selectedIndex: null,
      lastHint: null,
    });

    await this.tts.speakAsync(
      `Question ${this.idx + 1}. ${q.question}. Options. ${optionsSpoken}.`
    );
  }

  private speakCurrent() {
    void this.speakCurrentAsync();
  }

  repeatQuestion() {
    const q = this.sessionQuestions[this.idx];
    if (!q) return;

    this.repeatUsedThisQuestion += 1;

    this.tts.stop();
    void this.speakCurrentAsync();
  }

  async speakHint() {
    const q = this.sessionQuestions[this.idx];
    if (!q) return;

    if (this.answerLocked) {
      this.tts.stop();
      await this.tts.speakAsync("Answer already submitted. Moving on.");
      return;
    }

    if (this.hintUsedThisQuestion >= 2) {
      const msg =
        "You already used the maximum number of hints for this question. Try to answer using what you know.";
      this.tts.speak(msg);
      this.notifyActive({
        lastHint: "Maximum hints reached for this question.",
      });
      return;
    }

    this.hintUsedThisQuestion += 1;

    let hintText: string;

    try {
      const ai = await callGemini(
        `
You are helping a visually impaired Grade ${q.grade} ICT student.
Give a short, step-by-step hint for this question WITHOUT saying the answer.

Question: ${q.question}

Options:
${q.options.join("\n")}
`.trim()
      );

      hintText = ai;
    } catch {
      hintText =
        q.hint_topic ??
        "Think about the core concept in the question and eliminate clearly wrong options.";
    }

    this.tts.stop();
    await this.tts.speakAsync("Hint. " + hintText);

    this.notifyActive({ lastHint: hintText });
  }

  async answer(optionIndex: number) {
    const q = this.sessionQuestions[this.idx];
    if (!q) return;

    if (this.answerLocked) return;

    const isValidPick =
      Number.isInteger(optionIndex) &&
      optionIndex >= 0 &&
      optionIndex < q.options.length;

    if (!isValidPick) {
      this.tts.stop();
      await this.tts.speakAsync(
        "Invalid selection. Swipe to choose an option."
      );
      this.notifyActive({ selectedIndex: null, answerStatus: "wrong" });
      return;
    }

    this.answerLocked = true;

    const selected = q.options[optionIndex];
    const letter = String.fromCharCode(65 + optionIndex);

    this.tts.stop();
    await this.tts.speakAsync(
      `Your selected answer is ${letter}. ${selected}.`
    );

    const startedAt =
      this.activeQuestionStartedAt > 0
        ? this.activeQuestionStartedAt
        : Date.now();

    const timeTakenMs = Math.max(0, Date.now() - startedAt);
    const isRepeatedQuestion = this.wrongQueue.some((x) => x.id === q.id);

    const ok = await evaluateAnswer(q, selected);

    if (ok) {
      this.correctStreak += 1;
      this.wrongStreak = 0;
    } else {
      this.wrongStreak += 1;
      this.correctStreak = 0;
    }

    const encouragement = getEncouragementMessage({
      isCorrect: ok,
      topic: q.category,
      correctStreak: this.correctStreak,
      wrongStreak: this.wrongStreak,
      usedHint: this.hintUsedThisQuestion > 0,
      isRepeatedQuestion,
      improvedTopic: ok && isRepeatedQuestion,
    });

    const confidence = computeConfidenceScore({
      isCorrect: ok,
      timeTakenMs,
      hintUsed: this.hintUsedThisQuestion,
      repeatUsed: this.repeatUsedThisQuestion,
    });

    await appendAttemptHistory({
      questionId: q.id,
      category: q.category,
      grade: q.grade,
      isCorrect: ok,
      timeTakenMs,
      hintUsed: this.hintUsedThisQuestion,
      repeatUsed: this.repeatUsedThisQuestion,
      confidence,
      answeredAt: Date.now(),
    });

    if (this.speakConfidenceFeedback) {
      const label = confidenceLabel(confidence);
      await this.tts.speakAsync(`Confidence ${label}.`);
    }

    await upsertAttempt({
      id: q.id,
      category: q.category,
      grade: q.grade,
      isCorrect: ok,
      timeTakenMs,
      hintUsed: this.hintUsedThisQuestion,
      repeatUsed: this.repeatUsedThisQuestion,
    });

    if (ok) {
      this.wrongQueue = this.wrongQueue.filter((x) => x.id !== q.id);
      this.sessionCorrect += 1;

      this.tts.stop();
      await this.tts.speakAsync(`${encouragement} Next question.`);

      this.notifyActive({
        selectedIndex: optionIndex,
        answerStatus: "correct",
      });

      setTimeout(() => {
        this.idx += 1;
        this.stepsSinceLastRepeat += 1;
        this.speakCurrent();
      }, 1200);

      return;
    }

    if (!this.wrongQueue.find((x) => x.id === q.id)) {
      this.wrongQueue.push(q);
    }

    this.tts.stop();
    await this.tts.speakAsync(`${encouragement} Next question.`);

    this.notifyActive({
      selectedIndex: optionIndex,
      answerStatus: "wrong",
    });

    setTimeout(() => {
      this.idx += 1;
      this.stepsSinceLastRepeat += 1;
      this.speakCurrent();
    }, 1200);
  }

  private finishSession() {
    const total = this.sessionQuestions.length;
    const correct = this.sessionCorrect;

    this.tts.stop();
    this.tts.speak(
      `Session completed. You answered ${correct} out of ${total} questions correctly.`
    );

    this.notifyActive({
      done: true,
      correctCount: correct,
      totalCount: total,
      lastHint: null,
      selectedIndex: null,
      answerStatus: "idle",
    });
  }

  stop() {
    this.tts.stop();
  }
}