import { View, Text, StyleSheet, PanResponder } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { quizData, QuizQuestion } from "./quizData";
import { useNavigation } from "@react-navigation/native";

const DOUBLE_TAP_DELAY = 350;
const TRIPLE_TAP_DELAY = 600;

const Quizes = () => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const quiz: QuizQuestion | undefined = quizData[index];

  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);

  const navigation = useNavigation();

  const focused = useRef<string | null>(null);
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const questionRef = useRef<View>(null);
  const optionRefs = useRef<Record<string, View | null>>({});
  const layouts = useRef<Record<string, any>>({});

  // Speak question when it changes
  useEffect(() => {
    if (!quiz) return;

    setTimeout(() => {
      Speech.speak(
        `Question ${index + 1} of ${quizData.length}. ${
          quiz.question
        }. Swipe to hear answers.`
      );

      // Measure question
      questionRef.current?.measure(
        (
          x: number,
          y: number,
          w: number,
          h: number,
          px: number,
          py: number
        ) => {
          layouts.current[quiz.question] = { x: px, y: py, w, h };
        }
      );

      // Measure options
      quiz.options.forEach((opt) => {
        optionRefs.current[opt.text]?.measure(
          (
            x: number,
            y: number,
            w: number,
            h: number,
            px: number,
            py: number
          ) => {
            layouts.current[opt.text] = { x: px, y: py, w, h };
          }
        );
      });
    }, 500);
  }, [index]);

  // Speak on focus
  const speak = (text: string) => {
    if (focused.current !== text) {
      focused.current = text;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Speech.speak(text, { rate: 0.9 });
    }
  };

  // Save answer
  const saveAnswer = () => {
    if (!quiz || !focused.current) return;

    setAnswers((prev) => ({
      ...prev,
      [quiz.id]: focused.current!,
    }));

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Speech.speak("Your answer is saved. Triple tap to answer next question.");
  };

  // Next question or finish
  const nextQuestion = () => {
    if (index + 1 < quizData.length) {
      focused.current = null;
      layouts.current = {};
      setIndex(index + 1);
    } else {
      finishQuiz();
    }
  };

  // Calculate and speak result
  const finishQuiz = () => {
    let total = 0;

    quizData.forEach((q) => {
      const selectedText = answers[q.id];
      const correct = q.options.find((o) => o.correct)?.text;
      if (selectedText === correct) total++;
    });

    setScore(total);
    setQuizFinished(true);

    if (total < 1) {
      Speech.speak(
        `You have got ${total} out of ${quizData.length}. You need to retry. Triple tap to face the quiz again.`
      );
    } else {
      Speech.speak(
        `You have passed the quiz with ${total} out of ${quizData.length}. Double tap to go home.`
      );
    }
    console.log("fdsfsdfsdfdsfdsf", total);
  };

  const restartQuiz = () => {
    setIndex(0);
    setAnswers({});
    setQuizFinished(false);
    setScore(0);
    focused.current = null;
    layouts.current = {};

    Speech.speak("Quiz restarted. Question 1.");
  };
  const goHome = () => {
    Speech.speak("Going back to home");
    navigation.navigate("Home" as never);
  };

  // Tap logic (double & triple tap)
  const handleTap = () => {
    tapCount.current += 1;

    if (tapTimer.current) clearTimeout(tapTimer.current);

    tapTimer.current = setTimeout(() => {
      // 👉 After quiz finished
      if (quizFinished) {
        if (score < 5 && tapCount.current === 3) {
          restartQuiz();
        } else if (score >= 5 && tapCount.current === 2) {
          goHome();
        }
      }
      // 👉 During quiz
      else {
        if (tapCount.current === 2) {
          saveAnswer();
        } else if (tapCount.current === 3) {
          nextQuestion();
        }
      }

      tapCount.current = 0;
    }, TRIPLE_TAP_DELAY);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onPanResponderGrant: () => {
      handleTap();
    },

    onPanResponderMove: (_, { moveX, moveY }) => {
      for (const key in layouts.current) {
        const b = layouts.current[key];
        if (
          moveX > b.x &&
          moveX < b.x + b.w &&
          moveY > b.y &&
          moveY < b.y + b.h
        ) {
          speak(key);
          return;
        }
      }
      focused.current = null;
    },
  });

  if (!quiz) return null;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Question */}
      <View ref={questionRef} style={styles.questionBox}>
        <Text style={styles.questionText}>{quiz.question}</Text>
      </View>

      {/* Options */}
      {quiz.options.map((opt) => (
        <View
          key={opt.id}
          ref={(ref) => {
            optionRefs.current[opt.text] = ref;
          }}
          style={styles.option}
        >
          <Text style={styles.optionText}>{opt.text}</Text>
        </View>
      ))}
      {quizFinished && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            Your Score: {score}/{quizData.length}
          </Text>

          {score < 1 ? (
            <Text style={styles.retryText}>Triple tap to retry quiz</Text>
          ) : (
            <Text style={styles.passText}>Double tap to go home</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default Quizes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  questionBox: {
    backgroundColor: "#1e3a8a",
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
    width: "100%",
  },
  questionText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  option: {
    width: "100%",
    height: 70,
    backgroundColor: "#a51818ff",
    borderRadius: 16,
    marginVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  resultBox: {
    backgroundColor: "#0f172a",
    padding: 30,
    borderRadius: 20,
    marginBottom: 40,
    width: "100%",
    alignItems: "center",
  },
  resultText: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
  },
  retryText: {
    marginTop: 15,
    fontSize: 18,
    color: "#f87171",
  },
  passText: {
    marginTop: 15,
    fontSize: 18,
    color: "#4ade80",
  },
});
