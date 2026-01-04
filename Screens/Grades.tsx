import React, { useRef, useEffect, useCallback, useState } from "react";
import { StyleSheet, Text, View, PanResponder } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech"; // Added for Text-to-Speech

type RootStackParamList = {
  Grades: undefined;
  Lessons: { grade: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "Grades">;

const DOUBLE_TAP_DELAY = 400;
const GRADES = ["Grade 10", "Grade 11"];

const Grades = ({ navigation }: Props) => {
  const [activeGrade, setActiveGrade] = useState<string | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});

  // 1. Speak the grade name when focused
  const announceGrade = (grade: string) => {
    Speech.stop(); // Stop any current speech
    Speech.speak(grade, { rate: 1.0 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const navigateFocused = (grade: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Speech.speak(`Entering ${grade}`);
    navigation.navigate("Lessons", { grade });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        const now = Date.now();
        // Check if double tap happened on a focused item
        if (now - lastTap.current < DOUBLE_TAP_DELAY && activeGrade) {
          navigateFocused(activeGrade);
        }
        lastTap.current = now;
      },

      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;
        let foundGrade: string | null = null;

        for (const grade of GRADES) {
          const layout = layouts.current[grade];
          if (
            layout &&
            moveX >= layout.x &&
            moveX <= layout.x + layout.w &&
            moveY >= layout.y &&
            moveY <= layout.y + layout.h
          ) {
            foundGrade = grade;
            break;
          }
        }

        // Only trigger if we moved onto a NEW grade
        if (foundGrade && foundGrade !== activeGrade) {
          setActiveGrade(foundGrade);
          announceGrade(foundGrade);
        } else if (!foundGrade && activeGrade !== null) {
          setActiveGrade(null);
        }
      },
      onPanResponderRelease: () => {
        // Optional: clear active state on release
      },
    })
  ).current;

  // 2. Measure absolute coordinates (crucial for PanResponder)
  const updateLayout = (grade: string) => {
    viewRefs.current[grade]?.measure((x, y, width, height, pageX, pageY) => {
      layouts.current[grade] = { x: pageX, y: pageY, w: width, h: height };
    });
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {GRADES.map((grade) => (
        <View
          key={grade}
          ref={(ref) => {
            viewRefs.current[grade] = ref;
          }}
          onLayout={() => updateLayout(grade)}
          style={[
            styles.gradeContainer,
            activeGrade === grade && styles.activeGradeContainer, // Visual feedback
          ]}
        >
          <Text style={styles.gradeText}>{grade}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
  },
  gradeContainer: {
    backgroundColor: "#333",
    height: 150,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeGradeContainer: {
    backgroundColor: "#711a1a",
    borderColor: "#fff",
    transform: [{ scale: 1.02 }],
  },
  gradeText: {
    color: "white",
    fontSize: 40,
    fontWeight: "700",
  },
});

export default Grades;
