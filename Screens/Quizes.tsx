import { View, Text, StyleSheet, PanResponder, Dimensions } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { quizData, QuizQuestion } from "../data/quizData";
import { useNavigation } from "@react-navigation/native";

const TRIPLE_TAP_DELAY = 600;

const Quizes = () => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  const navigation = useNavigation();
  const quiz: QuizQuestion | undefined = quizData[index];

  // Logic Refs
  const focused = useRef<string | null>(null);
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Layout Refs
  const questionRef = useRef<View>(null);
  const optionRefs = useRef<Record<string, View | null>>({});
  const layouts = useRef<Record<string, any>>({});

  // 1. TIMER LOGIC
  useEffect(() => {
    startTime.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 2. MEASURE AND ANNOUNCE (Updated for Question Changes)
  useEffect(() => {
    if (!quiz || quizFinished) return;

    // Reset local focus states
    setActiveId(null);
    focused.current = null;
    layouts.current = {}; // CRITICAL: Clear old measurements

    Speech.stop();
    Speech.speak(
      `Question ${index + 1}. ${quiz.question}. Swipe to hear answers.`,
      { rate: 0.9 }
    );

    // Use a slightly longer delay to ensure the new UI is rendered
    const timer = setTimeout(() => {
      // Measure Question
      questionRef.current?.measure((x, y, w, h, px, py) => {
        if (w > 0)
          layouts.current["QUESTION_TEXT"] = {
            x: px,
            y: py,
            w,
            h,
            text: quiz.question,
          };
      });

      // Measure Options
      quiz.options.forEach((opt) => {
        optionRefs.current[opt.text]?.measure((x, y, w, h, px, py) => {
          if (w > 0)
            layouts.current[opt.text] = { x: px, y: py, w, h, text: opt.text };
        });
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [index, quizFinished]);

  const announceItem = (id: string, text: string) => {
    if (focused.current !== id) {
      focused.current = id;
      setActiveId(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Speech.stop();
      Speech.speak(text, { rate: 1.0 });
    }
  };

  const finishQuiz = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let total = 0;
    quizData.forEach((q) => {
      const userAnswer = answers[q.id];
      const correctAnswer = q.options.find((o) => o.correct)?.text;
      if (userAnswer === correctAnswer) total++;
    });
    setScore(total);
    setQuizFinished(true);
    Speech.stop();
    Speech.speak(
      `Quiz finished. Total time: ${formatTime(
        elapsedTime
      )}. Your score is ${total}. Double tap to go home.`,
      { rate: 0.9 }
    );
  };

  // 3. REFACTORED TAP HANDLER
  const handleTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);

    tapTimer.current = setTimeout(() => {
      // FINISHED STATE
      if (quizFinished) {
        if (tapCount.current === 2) {
          navigation.navigate("Home" as never);
        }
      }
      // ACTIVE QUIZ STATE
      else {
        if (tapCount.current === 2) {
          // Double Tap: Save Answer
          if (focused.current && focused.current !== "QUESTION_TEXT") {
            setAnswers((prev) => ({ ...prev, [quiz!.id]: focused.current! }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Speech.speak("Answer saved. Triple tap for next question.");
          } else {
            Speech.speak("Please select an answer first.");
          }
        } else if (tapCount.current === 3) {
          // Triple Tap: Move to Next
          if (index + 1 < quizData.length) {
            setIndex(index + 1);
          } else {
            finishQuiz();
          }
        }
      }
      tapCount.current = 0;
    }, TRIPLE_TAP_DELAY);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => handleTap(),
    onPanResponderMove: (_, { moveX, moveY }) => {
      if (quizFinished) return;
      let found = false;
      for (const key in layouts.current) {
        const layout = layouts.current[key];
        if (
          moveX > layout.x &&
          moveX < layout.x + layout.w &&
          moveY > layout.y &&
          moveY < layout.y + layout.h
        ) {
          announceItem(key, layout.text);
          found = true;
          break;
        }
      }
      if (!found) {
        setActiveId(null);
        focused.current = null;
      }
    },
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>TIME: {formatTime(elapsedTime)}</Text>
      </View>

      {!quizFinished ? (
        <>
          <View
            ref={questionRef}
            style={[
              styles.questionBox,
              activeId === "QUESTION_TEXT"
                ? styles.activeQuestion
                : styles.inactiveQuestion,
            ]}
          >
            <Text style={styles.questionText}>{quiz?.question}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {quiz?.options.map((opt) => (
              <View
                key={opt.id}
                ref={(ref) => {
                  optionRefs.current[opt.text] = ref;
                }}
                style={[
                  styles.option,
                  activeId === opt.text
                    ? styles.activeOption
                    : styles.inactiveOption,
                ]}
              >
                <Text style={styles.optionText}>{opt.text}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.resultBox}>
          <Text style={styles.resultHeader}>Quiz Finished!</Text>
          <Text style={styles.resultScore}>
            Score: {score} / {quizData.length}
          </Text>
          <Text style={styles.homeHint}>Double Tap to Go Home</Text>
        </View>
      )}
    </View>
  );
};

export default Quizes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  timerContainer: {
    alignSelf: "center",
    backgroundColor: "#222",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#4ade80",
  },
  timerText: {
    color: "#4ade80",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  questionBox: {
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 3,
  },
  inactiveQuestion: { backgroundColor: "#1e3a8a", borderColor: "transparent" },
  activeQuestion: { backgroundColor: "#3b82f6", borderColor: "white" },
  questionText: {
    fontSize: 22,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  optionsContainer: { flex: 1 },
  option: {
    width: "100%",
    padding: 25,
    borderRadius: 20,
    marginVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  inactiveOption: { backgroundColor: "#444", borderColor: "transparent" },
  activeOption: { backgroundColor: "#a51818", borderColor: "white" },
  optionText: { fontSize: 22, color: "white", fontWeight: "bold" },
  resultBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  resultHeader: {
    fontSize: 30,
    color: "white",
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultScore: { fontSize: 40, color: "white", fontWeight: "bold" },
  homeHint: {
    fontSize: 22,
    color: "#4ade80",
    marginTop: 40,
    fontWeight: "bold",
  },
});
