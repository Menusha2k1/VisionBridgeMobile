import React, { useRef, useState } from "react";
import { StyleSheet, Text, View, PanResponder } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { QUIZZES_DATA } from "../data/syllabusData";

const DOUBLE_TAP_DELAY = 400;

const QuizList = ({ route, navigation }: any) => {
  // We assume the student's grade is passed during navigation
  const { grade } = route.params || { grade: "Grade 10" };
  const availableQuizzes = QUIZZES_DATA[grade] || [];

  const [activeId, setActiveId] = useState<string | null>(null);
  const focusedIdRef = useRef<string | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<Record<string, any>>({});
  const viewRefs = useRef<Record<string, View | null>>({});

  const announce = (text: string) => {
    Speech.stop();
    Speech.speak(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const now = Date.now();
        const { pageX, pageY } = evt.nativeEvent;

        let touchedId: string | null = null;
        for (const quiz of availableQuizzes) {
          const l = layouts.current[quiz.id];
          if (
            l &&
            pageX >= l.x &&
            pageX <= l.x + l.w &&
            pageY >= l.y &&
            pageY <= l.y + l.h
          ) {
            touchedId = quiz.id;
            break;
          }
        }

        if (
          now - lastTap.current < DOUBLE_TAP_DELAY &&
          touchedId === focusedIdRef.current
        ) {
          if (touchedId) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Speech.speak("Starting Quiz");
            // navigation.navigate("QuizDetail", { quizId: touchedId });
          }
        }

        if (touchedId) {
          focusedIdRef.current = touchedId;
          setActiveId(touchedId);
          const quiz = availableQuizzes.find((q) => q.id === touchedId);
          announce(`${quiz?.lessonName} Quiz`);
        }
        lastTap.current = now;
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;
        let foundId: string | null = null;

        for (const quiz of availableQuizzes) {
          const l = layouts.current[quiz.id];
          if (
            l &&
            moveX >= l.x &&
            moveX <= l.x + l.w &&
            moveY >= l.y &&
            moveY <= l.y + l.h
          ) {
            foundId = quiz.id;
            break;
          }
        }

        if (foundId && foundId !== focusedIdRef.current) {
          focusedIdRef.current = foundId;
          setActiveId(foundId);
          const quiz = availableQuizzes.find((q) => q.id === foundId);
          announce(quiz?.lessonName || "");
        }
      },
      onPanResponderRelease: () => setActiveId(null),
    })
  ).current;

  const measureView = (id: string) => {
    setTimeout(() => {
      viewRefs.current[id]?.measure((x, y, w, h, px, py) => {
        if (w > 0) layouts.current[id] = { x: px, y: py, w, h };
      });
    }, 300);
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Text style={styles.header}>{grade} Quizzes</Text>

      {availableQuizzes.length === 0 ? (
        <Text style={styles.emptyText}>No quizzes active for this grade.</Text>
      ) : (
        <View style={styles.list}>
          {availableQuizzes.map((quiz) => (
            <View
              key={quiz.id}
              ref={(el) => {
                viewRefs.current[quiz.id] = el;
              }}
              onLayout={() => measureView(quiz.id)}
              style={[
                styles.quizCard,
                activeId === quiz.id && styles.activeCard,
              ]}
            >
              <Text style={styles.quizTitle}>{quiz.lessonName}</Text>
              <Text style={styles.quizInfo}>
                {quiz.questionsCount} Questions
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", paddingTop: 50 },
  header: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  list: { flex: 1, paddingHorizontal: 20 },
  quizCard: {
    backgroundColor: "#1E1E1E",
    padding: 25,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeCard: {
    backgroundColor: "#711a1a",
    borderColor: "white",
    transform: [{ scale: 1.02 }],
  },
  quizTitle: { color: "white", fontSize: 20, fontWeight: "bold" },
  quizInfo: { color: "#aaa", fontSize: 14, marginTop: 5 },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
  },
});

export default QuizList;
