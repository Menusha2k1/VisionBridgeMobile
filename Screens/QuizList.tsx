import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, View, PanResponder } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { QUIZZES_DATA } from "../data/syllabusData";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const DOUBLE_TAP_DELAY = 400;

const QuizList = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const { grade } = route.params || { grade: "Grade 10" };
  const availableQuizzes = QUIZZES_DATA[grade] || [];

  const [activeId, setActiveId] = useState<string | null>(null);
  const focusedIdRef = useRef<string | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<Record<string, any>>({});
  const viewRefs = useRef<Record<string, View | null>>({});

  // --- INITIAL ANNOUNCEMENT ---
  useFocusEffect(
    useCallback(() => {
      Speech.stop();
      const count = availableQuizzes.length;
      const quizPlural = count === 1 ? "quiz" : "quizzes";

      const announcement =
        count > 0
          ? `You are now on the Quizzes page. There are ${count} ${quizPlural} available. Swipe to explore. Double tap to start a quiz.`
          : `No quizzes available for ${grade} at the moment.`;

      Speech.speak(announcement, { rate: 0.9 });

      return () => {
        Speech.stop();
      };
    }, [availableQuizzes, grade])
  );

  const announce = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 1.0 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const now = Date.now();
        const { pageX, pageY } = evt.nativeEvent;
        const timeSinceLastTap = now - lastTap.current;

        // DOUBLE TAP NAVIGATION
        if (timeSinceLastTap < DOUBLE_TAP_DELAY && focusedIdRef.current) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Speech.speak("Starting Quiz");
          navigation.navigate("Quizes", {
            quizId: focusedIdRef.current,
            grade,
          });
          lastTap.current = 0;
          return;
        }
        lastTap.current = now;

        // CHECK FOR INITIAL TOUCH FOCUS
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

        if (touchedId) {
          focusedIdRef.current = touchedId;
          setActiveId(touchedId);
          const quiz = availableQuizzes.find((q) => q.id === touchedId);
          announce(
            `${quiz?.lessonName} Quiz, ${quiz?.questionsCount} questions`
          );
        }
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

      onPanResponderRelease: () => {
        setActiveId(null);
      },
    })
  ).current;

  const measureView = (id: string) => {
    setTimeout(() => {
      viewRefs.current[id]?.measure((x, y, w, h, px, py) => {
        if (w > 0) layouts.current[id] = { x: px, y: py, w, h };
      });
    }, 500);
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
                activeId === quiz.id ? styles.activeCard : styles.unfocusedCard,
              ]}
            >
              <Text style={styles.quizTitle}>{quiz.lessonName}</Text>
              <Text
                style={[
                  styles.quizInfo,
                  activeId === quiz.id && { color: "white" },
                ]}
              >
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
  container: { flex: 1, backgroundColor: "#121212", paddingTop: 60 },
  header: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  list: { flex: 1, paddingHorizontal: 20 },
  quizCard: {
    padding: 25,
    borderRadius: 25,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "transparent",
  },
  unfocusedCard: { backgroundColor: "#444444" },
  activeCard: {
    backgroundColor: "#a51818",
    borderColor: "white",
    transform: [{ scale: 1.03 }],
  },
  quizTitle: { color: "white", fontSize: 22, fontWeight: "bold" },
  quizInfo: { color: "#ccc", fontSize: 16, marginTop: 5, fontWeight: "600" },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
  },
});

export default QuizList;
