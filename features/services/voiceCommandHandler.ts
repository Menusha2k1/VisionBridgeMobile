import { LessonPlayerController } from "../lesson_player/controller/lessonPlayerController";
import { QuizController } from "../quiz_engine/controller/quizController";

export type VoiceMode = "lesson" | "quiz";

/**
 * Optional callbacks to keep VoiceCommandHandler decoupled from UI routing.
 * - onRequestStartQuizFromLesson: when user says "start quiz" while in lesson mode
 * - onRequestBackToLesson: when user says "go back" while in quiz mode
 * - speak: fallback speech output if controllers don't expose a speak method
 */
type VoiceCommandHandlerOptions = {
  onRequestStartQuizFromLesson?: () => void;
  onRequestBackToLesson?: () => void;
  speak?: (text: string) => void;
};

export class VoiceCommandHandler {
  private opts: VoiceCommandHandlerOptions;

  constructor(
    private lesson: LessonPlayerController,
    private quiz: QuizController,
    private getMode: () => VoiceMode,
    private setMode: (m: VoiceMode) => void,
    opts: VoiceCommandHandlerOptions = {}
  ) {
    this.opts = opts;
  }

  /**
   * Main entry point – call this when you receive recognized speech as text.
   */
  handleRaw(text: string) {
    if (!text) return;

    const cleaned = this.normalize(text);
    if (!cleaned) return;

    // Allow universal "switch mode" commands regardless of current mode
    if (this.matches(cleaned, ["lesson mode", "go to lesson", "open lesson"])) {
      this.setMode("lesson");
      this.speak("Lesson mode.");
      return;
    }
    if (this.matches(cleaned, ["quiz mode", "go to quiz", "open quiz"])) {
      this.setMode("quiz");
      this.speak("Quiz mode.");
      return;
    }

    const mode = this.getMode();
    if (mode === "lesson") {
      this.handleLessonCommand(cleaned);
    } else {
      this.handleQuizCommand(cleaned);
    }
  }

  // ---------------- LESSON COMMANDS ----------------

  private handleLessonCommand(cmd: string) {
    // Navigation
    if (this.matches(cmd, ["next", "next part", "next section", "forward"])) {
      this.lesson.next();
      return;
    }

    if (this.matches(cmd, ["previous", "back", "go back", "previous part"])) {
      this.lesson.prev();
      return;
    }

    if (this.matches(cmd, ["repeat", "repeat lesson", "say again", "repeat that"])) {
      this.lesson.repeat();
      return;
    }

    if (this.matches(cmd, ["stop", "stop lesson", "pause", "silence"])) {
      this.lesson.stop();
      return;
    }

    // Start quiz from lesson (UI decides if quizReady)
    if (this.matches(cmd, ["start quiz", "begin quiz", "quiz now"])) {
      this.setMode("quiz");
      if (this.opts.onRequestStartQuizFromLesson) {
        this.opts.onRequestStartQuizFromLesson();
      } else {
        this.speak(
          "Start quiz command received. Please use the Start Quiz for this Lesson button if it is available."
        );
      }
      return;
    }

    this.speak("Sorry, I did not understand that lesson command.");
  }

  // ---------------- QUIZ COMMANDS ----------------

  private handleQuizCommand(cmd: string) {
    // Answer selection
    if (this.matches(cmd, ["a", "option a", "answer a", "aye"])) {
      void this.quiz.answer(0);
      return;
    }
    if (this.matches(cmd, ["b", "option b", "answer b", "bee"])) {
      void this.quiz.answer(1);
      return;
    }
    if (this.matches(cmd, ["c", "option c", "answer c", "see"])) {
      void this.quiz.answer(2);
      return;
    }
    if (this.matches(cmd, ["d", "option d", "answer d", "dee"])) {
      void this.quiz.answer(3);
      return;
    }

    // Controls
    if (this.matches(cmd, ["repeat", "repeat question", "say again", "repeat that"])) {
      this.quiz.repeatQuestion();
      return;
    }

    if (this.matches(cmd, ["hint", "give me a hint", "help", "clue"])) {
      void this.quiz.speakHint();
      return;
    }

    if (this.matches(cmd, ["stop", "stop quiz", "end quiz", "pause"])) {
      this.quiz.stop();
      return;
    }

    if (this.matches(cmd, ["next", "next question", "skip", "pass"])) {
      // Prefer a real skip() API if you add it to QuizController
      const anyQuiz = this.quiz as any;

      if (typeof anyQuiz.skip === "function") {
        anyQuiz.skip();
        return;
      }

      // Fallback behaviour if skip() not implemented:
      // do NOT call answer(-1) because your QuizController.answer() treats it as invalid.
      // Instead, provide guidance so it never crashes and user understands.
      this.speak(
        "Skip is not available yet. Please answer A, B, C, or D. You can also say hint or repeat."
      );
      return;
    }

    if (this.matches(cmd, ["go back", "back to lesson", "lesson"])) {
      this.setMode("lesson");
      if (this.opts.onRequestBackToLesson) {
        this.opts.onRequestBackToLesson();
      } else {
        this.speak("Returning to lesson.");
      }
      return;
    }

    this.speak("Sorry, I did not understand that quiz command.");
  }

  // ---------------- helpers ----------------

  private normalize(text: string): string {
    // Lowercase, trim, collapse multiple spaces
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ") // keep letters/numbers/spaces (unicode-safe)
      .replace(/\s+/g, " ")
      .trim();
  }

  private matches(cmd: string, patterns: string[]) {
    return patterns.some((p) => cmd === p || cmd.includes(p));
  }

  private speak(text: string) {
    // Prefer injected speech function (UI can use expo-speech or your TTS wrapper)
    if (this.opts.speak) {
      this.opts.speak(text);
      return;
    }

    // If you later expose a public speak method on controllers, call it here.
    // For now: do nothing rather than using private field access like lesson["tts"].
    // This prevents fragile runtime behaviour.
  }
}
