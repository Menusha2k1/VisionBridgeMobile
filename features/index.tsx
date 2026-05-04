import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  PanResponder,
  GestureResponderEvent,
} from "react-native";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

import { LessonPlayerController } from "./lesson_player/controller/lessonPlayerController";
import {
  QuizController,
  ActiveQuestionView,
  AnswerStatus,
} from "./quiz_engine/controller/quizController";
import type { LessonSummary } from "./data/lessonRepository";

type Mode = "lesson" | "quiz";
type ScreenStep = "grade_select" | "lesson_list" | "lesson_player" | "quiz";

type KarunarathneScreenProps = {
  initialMode?: Mode; // "lesson" | "quiz"
  hideModeToggle?: boolean;
};

/**
 * UI speech helper:
 * - Stops any ongoing speech
 * - Speaks short instruction/feedback text
 */
function uiSpeak(text: string) {
  if (!text) return;
  try {
    Speech.stop();
  } catch {}
  Speech.speak(text, {
    language: "en-US",
    rate: 0.82,
    pitch: 0.98,
  });
}

export default function KarunarathneLessonQuizScreen(
  props: KarunarathneScreenProps,
) {
  const { initialMode = "lesson" } = props;
  // Router removed - component manages state internally

  // NEW: quiz button must be unlocked only after end-of-lesson speech finishes
  const [quizReady, setQuizReady] = useState(false);

  // NEW: pass unlock callback into controller
  const lesson = useMemo(
    () => new LessonPlayerController((unlocked) => setQuizReady(unlocked)),
    [],
  );

  const [activeQuestion, setActiveQuestion] =
    useState<ActiveQuestionView | null>(null);
  const quiz = useMemo(() => new QuizController(setActiveQuestion), []);

  // Track entry mode so quiz-back behaves correctly for m4 (quiz-only).
  const [entryMode] = useState<Mode>(initialMode);

  const [screen, setScreen] = useState<ScreenStep>(
    initialMode === "quiz" ? "quiz" : "grade_select",
  );

  const [currentSessionLabel, setCurrentSessionLabel] = useState<string | null>(
    null,
  );

  /* ---------------- LESSON MODE STATE ---------------- */

  const [grades, setGrades] = useState<number[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [lessonList, setLessonList] = useState<LessonSummary[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonObjective, setLessonObjective] = useState("");
  const [segmentText, setSegmentText] = useState("");

  // Timer for active quiz question
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  /* ------------ (A) Entry screen behavior (m3 vs m4) ------------- */
  useEffect(() => {
    if (initialMode === "quiz") {
      setScreen("quiz");
      uiSpeak(
        "Quiz mode. Choose a session. Swipe up or down to explore options. Double tap to start.",
      );
    } else {
      setScreen("grade_select");
      uiSpeak(
        "Lessons mode. Select grade 10 or grade 11. Double tap to confirm.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  /* ------------ initial load of grades ------------- */
  useEffect(() => {
    const g = lesson.getAvailableGrades();
    setGrades(g);

    if (g.length && selectedGrade === null) {
      const firstGrade = g[0];
      setSelectedGrade(firstGrade);

      const list = lesson.getLessonsForGrade(firstGrade);
      setLessonList(list);

      if (list.length) {
        const first = list[0];
        setSelectedLessonId(first.lessonId);
        setLessonTitle(first.title);
        setLessonObjective(first.objective);
        lesson.selectLesson(first.lessonId);
        setSegmentText(lesson.getCurrentSegmentText());
        setQuizReady(false);
      }
    }
  }, [lesson, selectedGrade]);

  // Helper: refresh visible lesson segment & quiz-ready flag
  const refreshSegmentState = useCallback(() => {
    const txt = lesson.getCurrentSegmentText();
    setSegmentText(txt);
  }, [lesson]);

  /* ---------------- TIMER FOR ACTIVE QUESTION ---------------- */

  useEffect(() => {
    if (!activeQuestion?.startedAt || activeQuestion.done) {
      setElapsedSeconds(0);
      return;
    }
    const id = setInterval(() => {
      setElapsedSeconds(
        Math.max(
          0,
          Math.floor((Date.now() - (activeQuestion.startedAt || 0)) / 1000),
        ),
      );
    }, 1000);
    return () => clearInterval(id);
  }, [activeQuestion?.startedAt, activeQuestion?.done]);

  /* ---------------- Screen guidance announcements ----------------
   * IMPORTANT FIX:
   * - Do NOT repeat long gesture instructions over and over.
   * - Announce quiz screen guidance only once per entry to quiz screen.
   */
  const spokeQuizScreenHintRef = useRef(false);

  useEffect(() => {
    if (screen === "grade_select") {
      spokeQuizScreenHintRef.current = false;
      uiSpeak("Grade selection. Double tap grade 10 or grade 11 to continue.");
    } else if (screen === "lesson_list") {
      spokeQuizScreenHintRef.current = false;
      uiSpeak(
        "Lesson list. Swipe up or down to change lessons. Double tap to open. Swipe left to go back.",
      );
    } else if (screen === "lesson_player") {
      spokeQuizScreenHintRef.current = false;
      uiSpeak(
        "Lesson player. Double tap start. Swipe right for next. Swipe left for previous. Double tap to repeat. Swipe down to stop.",
      );
    } else if (screen === "quiz") {
      if (!spokeQuizScreenHintRef.current) {
        spokeQuizScreenHintRef.current = true;
        uiSpeak(
          "Quiz. Choose a session to begin. Swipe up or down to explore quiz types. Double tap to start.",
        );
      }
    }
  }, [screen]);

  /* ---------------- LESSON HANDLERS ---------------- */

  const handleSelectGrade = useCallback(
    (grade: number) => {
      setSelectedGrade(grade);
      const list = lesson.getLessonsForGrade(grade);
      setLessonList(list);

      const first = list[0];
      if (first) {
        setSelectedLessonId(first.lessonId);
        setLessonTitle(first.title);
        setLessonObjective(first.objective);
        lesson.selectLesson(first.lessonId);
        setSegmentText(lesson.getCurrentSegmentText());
        setQuizReady(false);
      }
      setScreen("lesson_list");
    },
    [lesson],
  );

  const handleSelectLesson = useCallback(
    (id: string) => {
      setSelectedLessonId(id);
      const meta = lessonList.find((l) => l.lessonId === id);
      if (meta) {
        setLessonTitle(meta.title);
        setLessonObjective(meta.objective);
      }
      lesson.selectLesson(id);
      setSegmentText(lesson.getCurrentSegmentText());
      setQuizReady(false);
      setScreen("lesson_player");
    },
    [lesson, lessonList],
  );

  const handleLessonStart = useCallback(() => {
    lesson.start();
    refreshSegmentState();
  }, [lesson, refreshSegmentState]);

  const handleLessonPrev = useCallback(() => {
    lesson.prev();
    refreshSegmentState();
  }, [lesson, refreshSegmentState]);

  const handleLessonNext = useCallback(() => {
    lesson.next();
    refreshSegmentState();
  }, [lesson, refreshSegmentState]);

  const handleLessonRepeat = useCallback(() => {
    lesson.repeat();
    refreshSegmentState();
  }, [lesson, refreshSegmentState]);

  const handleLessonStop = useCallback(() => {
    lesson.stop();
  }, [lesson]);

  const handleStartLessonQuiz = useCallback(() => {
    if (!selectedLessonId) return;
    const meta = lesson.getCurrentLessonMeta();
    if (!meta) return;

    setScreen("quiz");
    const label = `Lesson Evaluation: ${meta.title}`;
    setCurrentSessionLabel(label);

    quiz.startSession({
      type: "lesson_quiz",
      lessonId: meta.lessonId,
      lessonTitle: meta.title,
      category: meta.category, // optional but ok to keep
      limit: 5, // supervisor requirement: at least 5
    });
  }, [lesson, quiz, selectedLessonId]);

  /* ---------------- QUIZ SESSION HANDLERS ---------------- */

  const handlePractice = useCallback(() => {
    setScreen("quiz");
    setCurrentSessionLabel("Practice session – 10 questions, Grade 10");
    quiz.startSession({ type: "practice", grade: 10, limit: 10 });
  }, [quiz]);

  const handleTopicDrill = useCallback(() => {
    setScreen("quiz");
    setCurrentSessionLabel("Topic drill – Health & Security, 10 questions");
    quiz.startSession({
      type: "topic_drill",
      grade: 11,
      category: "Health/Security",
      limit: 10,
    });
  }, [quiz]);

  const handleQuickRevision = useCallback(() => {
    setScreen("quiz");
    setCurrentSessionLabel("Quick revision – 5 questions");
    quiz.startSession({ type: "quick_revision", limit: 5 });
  }, [quiz]);

  const handleMockExam = useCallback(() => {
    setScreen("quiz");
    setCurrentSessionLabel("Mock exam – 40 questions");
    quiz.startSession({ type: "mock_exam", grade: 11, limit: 40 });
  }, [quiz]);

  const handleWeakArea = useCallback(() => {
    setScreen("quiz");
    setCurrentSessionLabel("Weak area practice – focusing on mistakes");
    quiz.startSession({ type: "weak_area", limit: 10 });
  }, [quiz]);

  const selectedIndex = activeQuestion?.selectedIndex ?? -1;
  const answerStatus: AnswerStatus = activeQuestion?.answerStatus ?? "idle";

  /* ---------------- TOP-LEVEL RENDER ---------------- */

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <View style={styles.header}>
          {/* <Text style={styles.appTitle}>Gesture-Enabled Learning Platform</Text>
          <Text style={styles.appSubtitle}>
            For Sri Lankan visually impaired students in ICT O/L education
          </Text> */}

          {/* {screen === "grade_select" && (
            // <Text style={styles.sessionHint}>
            //   Double-tap Grade 10 or Grade 11 to continue.
            // </Text>
          )} */}

          {screen === "lesson_list" && (
            <Text style={styles.sessionHint}>
              Swipe up/down to change lessons. Double-tap to open. Swipe left to
              go back.
            </Text>
          )}
          {screen === "lesson_player" && (
            <Text style={styles.sessionHint}>
              Double-tap Start. Swipe right next, left previous. Double-tap
              repeat. Swipe down stop.
            </Text>
          )}
          {screen === "quiz" && (
            <Text style={styles.sessionHint}>
              Swipe up/down to choose. Double-tap to start or answer. Long press
              for hint. Triple-tap repeat question.
            </Text>
          )}
        </View>

        <View style={styles.main}>
          {screen === "grade_select" && (
            <GradeSelectScreen
              grades={grades}
              selectedGrade={selectedGrade}
              onSelectGrade={handleSelectGrade}
            />
          )}

          {screen === "lesson_list" && (
            <LessonListScreen
              selectedGrade={selectedGrade}
              lessonList={lessonList}
              onBack={() => setScreen("grade_select")}
              onSelectLesson={handleSelectLesson}
            />
          )}

          {screen === "lesson_player" && (
            <LessonPlayerScreen
              lessonTitle={lessonTitle}
              lessonObjective={lessonObjective}
              segmentText={segmentText}
              quizReady={quizReady}
              onBack={() => setScreen("lesson_list")}
              onStart={handleLessonStart}
              onPrev={handleLessonPrev}
              onNext={handleLessonNext}
              onRepeat={handleLessonRepeat}
              onStop={handleLessonStop}
              onStartLinkedQuiz={handleStartLessonQuiz}
            />
          )}

          {screen === "quiz" && (
            <QuizScreen
              currentSessionLabel={currentSessionLabel}
              activeQuestion={activeQuestion}
              elapsedSeconds={elapsedSeconds}
              answerStatus={answerStatus}
              selectedIndex={selectedIndex}
              onBackToLessons={() => {
                // If entered from m4 (quiz-only), go back to lessons
                setScreen("lesson_player");
              }}
              onPractice={handlePractice}
              onTopicDrill={handleTopicDrill}
              onQuickRevision={handleQuickRevision}
              onMockExam={handleMockExam}
              onWeakArea={handleWeakArea}
              onAnswer={(idx) => quiz.answer(idx)}
              onRepeatQuestion={() => quiz.repeatQuestion()}
              onHint={() => quiz.speakHint()}
              onEndSession={() => quiz.stop()}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Sub-screen components ---------- */

type GradeSelectProps = {
  grades: number[];
  selectedGrade: number | null;
  onSelectGrade: (grade: number) => void;
};

function GradeSelectScreen({
  grades,
  selectedGrade,
  onSelectGrade,
}: GradeSelectProps) {
  const [focusIdx, setFocusIdx] = useState(0);
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Announce current grade when focus changes
  useEffect(() => {
    if (!grades.length) return;
    const g = grades[focusIdx];
    if (g === 10) {
      uiSpeak("Grade 10 O/L ICT. Double tap to continue.");
    } else {
      uiSpeak("Grade 11 O/L ICT. Double tap to continue.");
    }
  }, [focusIdx, grades]);

  const moveFocus = (delta: number) => {
    if (!grades.length) return;
    setFocusIdx((prev) =>
      Math.max(0, Math.min(grades.length - 1, prev + delta)),
    );
    Haptics.selectionAsync().catch(() => {});
  };

  const selectFocused = () => {
    const g = grades[focusIdx];
    if (!g) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    uiSpeak(g === 10 ? "Opening Grade 10" : "Opening Grade 11");
    onSelectGrade(g);
  };

  // Handle double-tap for selection
  const handleScreenTap = () => {
    tapCountRef.current += 1;
    if (tapCountRef.current === 2) {
      selectFocused();
      tapCountRef.current = 0;
    }
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 500);
  };

  // PanResponder for swipe gestures
  const panResponderRef = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: () => {},
      onPanResponderEnd: (evt, { dx, dy, vy, vx }) => {
        // Swipe up: dy < -50 or vy < -0.5
        if (dy < -50 || vy < -0.5) {
          moveFocus(-1);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          uiSpeak("Swiped up");
        }
        // Swipe down: dy > 50 or vy > 0.5
        else if (dy > 50 || vy > 0.5) {
          moveFocus(1);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          uiSpeak("Swiped down");
        }
      },
    }),
  ).current;

  const focusedGrade = grades[focusIdx];

  return (
    <View
      style={styles.screenContainer}
      {...panResponderRef.panHandlers}
      onTouchEnd={handleScreenTap}
    >
      <Text style={styles.screenTitle}>Select Grade</Text>
      <Text style={styles.screenDescription}>
        Double-tap a grade to continue to the lessons of that grade.
      </Text>

      <View style={styles.largeButtonColumn}>
        {grades.map((g, idx) => {
          const isFocused = focusedGrade === g;
          return (
            <Pressable
              key={g}
              style={[
                styles.largeChoiceBtn,
                isFocused && styles.largeChoiceBtnActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setFocusIdx(idx);
              }}
              accessibilityRole="button"
              accessibilityLabel={
                g === 10 ? "Grade 10 O L ICT" : "Grade 11 O L ICT"
              }
            >
              <Text style={styles.largeChoiceText}>
                {g === 10 ? "Grade 10 – O/L ICT" : "Grade 11 – O/L ICT"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type LessonListProps = {
  selectedGrade: number | null;
  lessonList: LessonSummary[];
  onBack: () => void;
  onSelectLesson: (id: string) => void;
};

/**
 * Non-scrolling, blind-first lesson picker:
 * - Swipe up/down: change focused lesson
 * - Double tap: open focused lesson
 * - Swipe left: back
 */
function LessonListScreen({
  selectedGrade,
  lessonList,
  onBack,
  onSelectLesson,
}: LessonListProps) {
  const [focusIdx, setFocusIdx] = useState(0);
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lessonList.length) return;
    const l = lessonList[focusIdx];
    if (!l) return;
    uiSpeak(`${l.title}. Category ${l.category}. Double tap to open.`);
  }, [focusIdx, lessonList]);

  const moveFocus = (delta: number) => {
    if (!lessonList.length) return;
    setFocusIdx((prev) =>
      Math.max(0, Math.min(lessonList.length - 1, prev + delta)),
    );
    Haptics.selectionAsync().catch(() => {});
  };

  const openFocused = () => {
    const l = lessonList[focusIdx];
    if (!l) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelectLesson(l.lessonId);
  };

  // Handle double-tap for opening
  const handleScreenTap = () => {
    tapCountRef.current += 1;
    if (tapCountRef.current === 2) {
      openFocused();
      tapCountRef.current = 0;
    }
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 500);
  };

  // PanResponder for swipe gestures
  const panResponderRef = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: () => {},
      onPanResponderEnd: (evt, { dx, dy, vy, vx }) => {
        // Swipe up: dy < -50 or vy < -0.5
        if (dy < -50 || vy < -0.5) {
          moveFocus(-1);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          uiSpeak("Swiped up");
        }
        // Swipe down: dy > 50 or vy > 0.5
        else if (dy > 50 || vy > 0.5) {
          moveFocus(1);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          uiSpeak("Swiped down");
        }
        // Swipe left: dx < -50 or vx < -0.5
        else if (dx < -50 || vx < -0.5) {
          onBack();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          uiSpeak("Going back");
        }
      },
    }),
  ).current;

  const focused = lessonList[focusIdx];

  return (
    <View
      style={styles.screenContainer}
      {...panResponderRef.panHandlers}
      onTouchEnd={handleScreenTap}
    >
      <View style={styles.topRow}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>
          {selectedGrade ? `Grade ${selectedGrade} Lessons` : "Lessons"}
        </Text>
      </View>

      <Text style={styles.screenDescription}>
        Swipe up/down to change lessons. Double-tap to open. Swipe left to go
        back.
      </Text>

      {!focused ? (
        <Text style={styles.sessionHint}>No lessons found for this grade.</Text>
      ) : (
        <View style={[styles.lessonRow, { paddingVertical: 28 }]}>
          <Text style={[styles.lessonRowTitle, { fontSize: 22 }]}>
            {focused.title}
          </Text>
          <Text style={[styles.lessonRowMeta, { fontSize: 16, marginTop: 8 }]}>
            {focused.category} · Grade {focused.grade}
          </Text>
          <Text style={[styles.sessionHint, { marginTop: 12 }]}>
            Lesson {focusIdx + 1} of {lessonList.length}
          </Text>

          <Text style={[styles.sessionHint, { marginTop: 8 }]}>
            Double-tap to open this lesson.
          </Text>
        </View>
      )}
    </View>
  );
}

type LessonPlayerProps = {
  lessonTitle: string;
  lessonObjective: string;
  segmentText: string;
  quizReady: boolean;
  onBack: () => void;
  onStart: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRepeat: () => void;
  onStop: () => void;
  onStartLinkedQuiz: () => void;
};

function LessonPlayerScreen({
  lessonTitle,
  lessonObjective,
  segmentText,
  quizReady,
  onBack,
  onStart,
  onPrev,
  onNext,
  onRepeat,
  onStop,
  onStartLinkedQuiz,
}: LessonPlayerProps) {
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle 2-tap (repeat) and 3-tap (start)
  const handleScreenTap = () => {
    tapCountRef.current += 1;
    if (tapCountRef.current === 2) {
      onRepeat();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      uiSpeak("Repeat");
    } else if (tapCountRef.current === 3) {
      onStart();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      uiSpeak("Starting lesson");
      tapCountRef.current = 0;
    }

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 500);
  };

  // PanResponder for swipe gestures
  const panResponderRef = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: () => {},
      onPanResponderEnd: (evt, { dx, dy, vx, vy }) => {
        // Swipe right: dx > 50 or vx > 0.5
        if (dx > 50 || vx > 0.5) {
          onNext();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          uiSpeak("Next");
        }
        // Swipe left: dx < -50 or vx < -0.5
        else if (dx < -50 || vx < -0.5) {
          onPrev();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          uiSpeak("Previous");
        }
        // Swipe down: dy > 50 or vy > 0.5
        else if (dy > 50 || vy > 0.5) {
          onStop();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          uiSpeak("Stopping lesson");
        }
      },
    }),
  ).current;

  return (
    <View
      style={styles.screenContainer}
      {...panResponderRef.panHandlers}
      onTouchEnd={handleScreenTap}
    >
      <View style={styles.topRow}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Lesson Player</Text>
      </View>

      <View style={styles.lessonHeaderBox}>
        <Text style={styles.lessonBodyTitle}>{lessonTitle}</Text>
        {!!lessonObjective && (
          <Text style={styles.lessonBodyObjective}>{lessonObjective}</Text>
        )}
      </View>

      <View style={styles.lessonBodyTextBox}>
        <Text style={styles.lessonBodyText}>
          {segmentText || "Triple-tap to Start Lesson. Double-tap to Repeat."}
        </Text>
      </View>

      <View style={styles.controlRow}>
        <PrimaryButton
          label="Start Lesson"
          description="Triple-tap also works"
          onPress={onStart}
        />
      </View>

      <View style={styles.controlRow}>
        <SecondaryButton label="Previous" onPress={onPrev} />
        <SecondaryButton label="Repeat" onPress={onRepeat} />
        <SecondaryButton label="Next" onPress={onNext} />
      </View>

      <View style={styles.controlRow}>
        <DangerButton label="Stop Lesson" onPress={onStop} />
      </View>

      {quizReady && (
        <View style={styles.quizEntry}>
          <Text style={styles.quizEntryLabel}>
            End of lesson. Double-tap below to start the linked quiz.
          </Text>
          <PrimaryButton
            label="Start Quiz for this Lesson"
            description="Lesson evaluation (minimum 5 questions)"
            onPress={onStartLinkedQuiz}
          />
        </View>
      )}
    </View>
  );
}

type QuizScreenProps = {
  currentSessionLabel: string | null;
  activeQuestion: ActiveQuestionView | null;
  elapsedSeconds: number;
  answerStatus: AnswerStatus;
  selectedIndex: number;
  onBackToLessons: () => void;
  onPractice: () => void;
  onTopicDrill: () => void;
  onQuickRevision: () => void;
  onMockExam: () => void;
  onWeakArea: () => void;
  onAnswer: (idx: number) => void;
  onRepeatQuestion: () => void;
  onHint: () => void;
  onEndSession: () => void;
};

/**
 * Blind-first quiz interaction:
 * - Session selection mode: swipe up/down to choose quiz type, double tap to start
 * - Question mode: swipe up/down to focus options, double tap to answer
 * - Long press: hint (question mode only)
 * - Triple tap: repeat question (question mode only)
 *
 * IMPORTANT FIX:
 * - Gesture usage guidance is spoken ONCE when the session starts (first question),
 *   not for every new question.
 */
function QuizScreen({
  currentSessionLabel,
  activeQuestion,
  elapsedSeconds,
  answerStatus,
  selectedIndex,
  onBackToLessons,
  onPractice,
  onTopicDrill,
  onQuickRevision,
  onMockExam,
  onWeakArea,
  onAnswer,
  onRepeatQuestion,
  onHint,
  onEndSession,
}: QuizScreenProps) {
  const isDone = !!activeQuestion?.done;

  // When there is no active question AND not done, we are in "session selection" mode.
  const inSessionSelectMode = !activeQuestion?.question && !isDone;

  // Session picker (single-card, no overlap, no scroll)
  const SESSIONS = useMemo(
    () => [
      {
        key: "practice",
        title: "Practice",
        subtitle: "10 questions (Grade 10)",
        announce: "Practice. Ten questions. Grade ten. Double tap to start.",
        run: onPractice,
      },
      {
        key: "topic_drill",
        title: "Topic Drill",
        subtitle: "Health and Security",
        announce:
          "Topic drill. Health and Security. Ten questions. Double tap to start.",
        run: onTopicDrill,
      },
      {
        key: "quick_revision",
        title: "Quick Revision",
        subtitle: "5 questions",
        announce: "Quick revision. Five questions. Double tap to start.",
        run: onQuickRevision,
      },
      {
        key: "mock_exam",
        title: "Mock Exam",
        subtitle: "40 questions (Grade 11)",
        announce:
          "Mock exam. Forty questions. Grade eleven. Double tap to start.",
        run: onMockExam,
      },
      {
        key: "weak_area",
        title: "Weak Area Practice",
        subtitle: "Focus on mistakes",
        announce: "Weak area practice. Focus on mistakes. Double tap to start.",
        run: onWeakArea,
      },
    ],
    [onPractice, onTopicDrill, onQuickRevision, onMockExam, onWeakArea],
  );

  const [sessionIdx, setSessionIdx] = useState(0);

  // Option focus for answering questions
  const [focusOpt, setFocusOpt] = useState(0);
  const focusOptRef = useRef(0);

  // Announce session when entering selection mode or changing index
  useEffect(() => {
    if (!inSessionSelectMode) return;
    const s = SESSIONS[sessionIdx];
    if (!s) return;
    uiSpeak(s.announce);
  }, [inSessionSelectMode, sessionIdx, SESSIONS]);

  /**
   * FIX: Speak “how to use gestures” ONLY ONCE at session start (first question),
   * and NOT per question.
   */
  const spokeControlsOnceRef = useRef(false);
  const lastQuestionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // If user returns to selection mode or finishes session, reset the flag.
    if (inSessionSelectMode || isDone) {
      spokeControlsOnceRef.current = false;
      lastQuestionIdRef.current = null;
      return;
    }

    const q = activeQuestion?.question;
    if (!q) return;

    // Keep resetting focus when a new question arrives (good UX)
    if (q.id !== lastQuestionIdRef.current) {
      lastQuestionIdRef.current = q.id;
      focusOptRef.current = 0;
      setFocusOpt(0);
    }

    // Speak controls only once per session
    if (!spokeControlsOnceRef.current) {
      spokeControlsOnceRef.current = true;
      uiSpeak(
        "Quiz started. Swipe up or down to hear answer options. Double tap to answer. Long press for hint. Triple tap to repeat the question.",
      );
    }
  }, [activeQuestion?.question, inSessionSelectMode, isDone]);

  /* ---------------- Session picker interactions ---------------- */

  const moveSession = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    setSessionIdx((prev) => {
      const next = Math.max(0, Math.min(SESSIONS.length - 1, prev + delta));
      const s = SESSIONS[next];
      if (s) uiSpeak(s.announce);
      return next;
    });
  };

  const startFocusedSession = () => {
    const s = SESSIONS[sessionIdx];
    if (!s) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    uiSpeak(`Starting ${s.title}.`);
    s.run();
  };

  /* ---------------- Answer option interactions ---------------- */

  const moveOption = (delta: number) => {
    const q = activeQuestion?.question;
    if (!q) return;
    const total = q.options.length;

    setFocusOpt((prev) => {
      const next = Math.max(0, Math.min(total - 1, prev + delta));
      focusOptRef.current = next;
      const opt = q.options[next];
      Haptics.selectionAsync().catch(() => {});
      uiSpeak(`Option ${String.fromCharCode(65 + next)}. ${opt}`);
      return next;
    });
  };

  const confirmFocusedOption = () => {
    if (!activeQuestion?.question) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onAnswer(focusOptRef.current);
  };

  /* --------- Gesture Refs & Handlers using PanResponder --------- */

  // Gesture tracking
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isLongPressingRef = useRef(false);

  // Handle 2-tap and 3-tap
  const handleScreenTap = () => {
    tapCountRef.current += 1;
    if (tapCountRef.current === 2) {
      if (inSessionSelectMode) {
        startFocusedSession();
      } else {
        confirmFocusedOption();
      }
      tapCountRef.current = 0;
    } else if (tapCountRef.current === 3) {
      onRepeatQuestion();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      uiSpeak("Repeating question");
      tapCountRef.current = 0;
    }

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 500);
  };

  // Handle long press for hint
  const handleLongPressStart = () => {
    if (inSessionSelectMode || isDone) return;
    isLongPressingRef.current = true;
    longPressTimeoutRef.current = setTimeout(() => {
      if (isLongPressingRef.current) {
        onHint();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        uiSpeak("Hint");
      }
    }, 450);
  };

  const handleLongPressEnd = () => {
    isLongPressingRef.current = false;
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  // PanResponder for swipe gestures
  const panResponderRef = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: () => {},
      onPanResponderEnd: (evt, { dx, dy, vx, vy }) => {
        // Cancel long press if swiping
        isLongPressingRef.current = false;
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
        }

        // Swipe up: dy < -50 or vy < -0.5
        if (dy < -50 || vy < -0.5) {
          if (inSessionSelectMode) {
            moveSession(-1);
          } else {
            moveOption(-1);
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
        }
        // Swipe down: dy > 50 or vy > 0.5
        else if (dy > 50 || vy > 0.5) {
          if (inSessionSelectMode) {
            moveSession(1);
          } else {
            moveOption(1);
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
        }
        // Swipe left: dx < -50 or vx < -0.5
        else if (dx < -50 || vx < -0.5) {
          onBackToLessons();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          uiSpeak("Going back");
        }
      },
    }),
  ).current;

  /* ---------------- Render ---------------- */

  return (
    <View
      style={styles.screenContainer}
      {...panResponderRef.panHandlers}
      onTouchStart={handleLongPressStart}
      onTouchEnd={(evt) => {
        handleLongPressEnd();
        handleScreenTap();
      }}
    >
      <View style={styles.topRow}>
        <Pressable style={styles.backBtn} onPress={onBackToLessons}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Quiz</Text>
      </View>

      {currentSessionLabel && (
        <View style={styles.sessionBanner}>
          <Text style={styles.sessionBannerLabel}>Active Session</Text>
          <Text style={styles.sessionBannerText}>{currentSessionLabel}</Text>
        </View>
      )}

      {/* ---------- Session Picker (single card; no overlap; no scroll) ---------- */}
      {inSessionSelectMode && (
        <View style={styles.quizQuestionBox}>
          <Text style={styles.cardTitle}>Choose a Quiz Type</Text>
          <Text style={styles.cardSubtitle}>
            Swipe up/down to change. Double-tap to start.
          </Text>

          <View
            style={[
              styles.lessonRow,
              {
                paddingVertical: 26,
                backgroundColor: "#151826",
                borderColor: "#375EFF",
              },
            ]}
          >
            <Text style={[styles.lessonRowTitle, { fontSize: 22 }]}>
              {SESSIONS[sessionIdx]?.title}
            </Text>
            <Text
              style={[styles.lessonRowMeta, { fontSize: 16, marginTop: 8 }]}
            >
              {SESSIONS[sessionIdx]?.subtitle}
            </Text>

            <Text style={[styles.sessionHint, { marginTop: 14 }]}>
              Quiz {sessionIdx + 1} of {SESSIONS.length}
            </Text>

            <View style={[styles.controlRow, { marginTop: 14 }]}>
              <PrimaryButton
                label="Start Selected Quiz"
                description="Double-tap anywhere also works"
                onPress={startFocusedSession}
              />
            </View>
          </View>
        </View>
      )}

      {/* ---------- Question / summary area ---------- */}
      {!inSessionSelectMode && (
        <View style={styles.quizQuestionBox}>
          {isDone ? (
            <>
              <Text style={styles.cardTitle}>Session Summary</Text>
              <Text style={styles.cardSubtitle}>
                You answered {activeQuestion?.correctCount} out of{" "}
                {activeQuestion?.totalCount} questions correctly.
              </Text>

              {typeof activeQuestion?.correctCount === "number" &&
                typeof activeQuestion?.totalCount === "number" &&
                activeQuestion.totalCount > 0 && (
                  <Text style={styles.questionText}>
                    Score:{" "}
                    {Math.round(
                      (activeQuestion.correctCount /
                        activeQuestion.totalCount) *
                        100,
                    )}
                    %
                  </Text>
                )}

              <Text style={styles.sessionHint}>
                Swipe left to go back. You can start another session from the
                quiz menu.
              </Text>
            </>
          ) : activeQuestion?.question ? (
            <>
              <View style={styles.questionHeaderRow}>
                <Text style={styles.questionBadge}>
                  Question {activeQuestion.index + 1} of {activeQuestion.total}
                </Text>
                <Text style={styles.questionMeta}>
                  G{activeQuestion.question.grade} ·{" "}
                  {activeQuestion.question.category}
                </Text>
              </View>

              <Text style={styles.questionText}>
                {activeQuestion.question.question}
              </Text>

              {activeQuestion.lastHint && (
                <Text style={styles.questionHint}>
                  Hint: {activeQuestion.lastHint}
                </Text>
              )}

              {activeQuestion.startedAt && (
                <Text style={styles.questionTimer}>
                  Time on question: {elapsedSeconds}s
                </Text>
              )}

              <View style={styles.answerList}>
                {activeQuestion.question.options.map((opt, i) => {
                  const isSelected = selectedIndex === i;
                  const isFocused = focusOpt === i;

                  let rowStyle = styles.answerRow;

                  if (isSelected && answerStatus === "correct") {
                    rowStyle = styles.answerRowCorrect;
                  } else if (isSelected && answerStatus === "wrong") {
                    rowStyle = styles.answerRowWrong;
                  } else if (isFocused) {
                    rowStyle = styles.answerRowSelected;
                  }

                  return (
                    <Pressable
                      key={i}
                      style={rowStyle}
                      onPressIn={() => {
                        focusOptRef.current = i; // IMPORTANT
                        setFocusOpt(i);
                      }}
                      onPress={() => {
                        uiSpeak(
                          `Option ${String.fromCharCode(65 + i)}. ${opt}`,
                        );
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Option ${String.fromCharCode(65 + i)}. ${opt}`}
                    >
                      <Text style={styles.answerRowLabel}>
                        {String.fromCharCode(65 + i)}.
                      </Text>
                      <Text style={styles.answerRowText}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sessionHint, { marginTop: 8 }]}>
                Swipe up/down to focus options. Double-tap to answer. Long press
                for hint. Triple-tap to repeat question.
              </Text>
            </>
          ) : (
            <Text style={styles.sessionHint}>Preparing quiz…</Text>
          )}
        </View>
      )}

      {/* Controls (fallback buttons) */}
      <View style={styles.controlRow}>
        <SecondaryButton label="Repeat Question" onPress={onRepeatQuestion} />
        <SecondaryButton label="Hint" onPress={onHint} />
        <DangerButton label="End Session" onPress={onEndSession} />
      </View>
    </View>
  );
}

/* ---------- Reusable buttons ---------- */

type ButtonProps = {
  label: string;
  description?: string;
  onPress: () => void;
};

function PrimaryButton({ label, description, onPress }: ButtonProps) {
  return (
    <Pressable style={styles.primaryBtn} onPress={onPress}>
      <Text style={styles.primaryBtnLabel}>{label}</Text>
      {description ? (
        <Text style={styles.primaryBtnDesc}>{description}</Text>
      ) : null}
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: ButtonProps) {
  return (
    <Pressable style={styles.secondaryBtn} onPress={onPress}>
      <Text style={styles.secondaryBtnLabel}>{label}</Text>
    </Pressable>
  );
}

function DangerButton({ label, onPress }: ButtonProps) {
  return (
    <Pressable style={styles.dangerBtn} onPress={onPress}>
      <Text style={styles.dangerBtnLabel}>{label}</Text>
    </Pressable>
  );
}

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#020308",
  },
  root: {
    flex: 1,
    backgroundColor: "#020308",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#22252f",
  },
  appTitle: {
    color: "#f5f5f7",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  appSubtitle: {
    color: "#a0a3b1",
    fontSize: 14,
    marginBottom: 8,
  },
  sessionHint: {
    color: "#7b7f8f",
    fontSize: 13,
    marginTop: 4,
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  screenContainer: {
    flex: 1,
    justifyContent: "flex-start",
    gap: 12,
  },
  screenTitle: {
    color: "#f5f5f7",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  screenDescription: {
    color: "#a0a3b1",
    fontSize: 14,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  backBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2e3244",
    backgroundColor: "#10121a",
  },
  backBtnText: {
    color: "#f5f5f7",
    fontSize: 14,
  },
  largeButtonColumn: {
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
  },
  largeChoiceBtn: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#181b26",
    borderWidth: 1,
    borderColor: "#2e3244",
  },
  largeChoiceBtnActive: {
    backgroundColor: "#a51818",
    borderColor: "#a51818",
  },
  largeChoiceText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
  lessonRow: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#151826",
    borderWidth: 1,
    borderColor: "#25283b",
  },
  lessonRowTitle: {
    color: "#f5f5f7",
    fontSize: 18,
    fontWeight: "600",
  },
  lessonRowMeta: {
    color: "#9ea1b4",
    fontSize: 13,
    marginTop: 4,
  },
  lessonHeaderBox: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#10121a",
    borderWidth: 1,
    borderColor: "#202335",
  },
  lessonBodyTitle: {
    color: "#f5f5f7",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  lessonBodyObjective: {
    color: "#a0a3b1",
    fontSize: 14,
  },
  lessonBodyTextBox: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#080b14",
    borderWidth: 1,
    borderColor: "#272a3c",
    marginTop: 10,
  },
  lessonBodyText: {
    color: "#f5f5f7",
    fontSize: 18,
    lineHeight: 26,
  },
  controlRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 60,
    borderRadius: 14,
    backgroundColor: "#375EFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  primaryBtnLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryBtnDesc: {
    color: "#d6dbff",
    fontSize: 12,
    marginTop: 2,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2e3244",
    backgroundColor: "#181b26",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnLabel: {
    color: "#f5f5f7",
    fontSize: 14,
    fontWeight: "500",
  },
  dangerBtn: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#b3213b",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerBtnLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  quizEntry: {
    marginTop: 16,
    gap: 8,
  },
  quizEntryLabel: {
    color: "#c3c6ff",
    fontSize: 14,
  },
  sessionBanner: {
    marginTop: 8,
  },
  sessionBannerLabel: {
    color: "#8d93ff",
    fontSize: 12,
    marginBottom: 2,
  },
  sessionBannerText: {
    color: "#f5f5f7",
    fontSize: 14,
  },
  sessionButtonColumn: {
    flexDirection: "column",
    gap: 8,
    marginTop: 8,
  },
  quizQuestionBox: {
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#10121a",
    borderWidth: 1,
    borderColor: "#202335",
    flexGrow: 1,
  },
  cardTitle: {
    color: "#f5f5f7",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: "#a0a3b1",
    fontSize: 13,
    marginBottom: 8,
  },
  questionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  questionBadge: {
    color: "#c5c8ff",
    fontSize: 13,
    fontWeight: "600",
  },
  questionMeta: {
    color: "#8d91aa",
    fontSize: 13,
  },
  questionText: {
    color: "#f5f5f7",
    fontSize: 18,
    marginBottom: 8,
  },
  questionHint: {
    color: "#ffd666",
    fontSize: 14,
    marginTop: 4,
  },
  questionTimer: {
    color: "#8d93ff",
    fontSize: 13,
    marginTop: 4,
  },
  answerList: {
    marginTop: 10,
    gap: 8,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#181b26",
    borderWidth: 1,
    borderColor: "#2f3246",
  },
  answerRowSelected: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#202744",
    borderWidth: 1,
    borderColor: "#5b7cff",
  },
  answerRowCorrect: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#1DB954",
    borderWidth: 1,
    borderColor: "#1DB954",
  },
  answerRowWrong: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#b3213b",
    borderWidth: 1,
    borderColor: "#b3213b",
  },
  answerRowLabel: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginRight: 10,
  },
  answerRowText: {
    color: "#ffffff",
    fontSize: 18,
    flexShrink: 1,
  },
});
