import React, { useRef, useEffect, useCallback, useState } from "react";
import { StyleSheet, Text, View, PanResponder } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech"; // Added for Text-to-Speech
import { useFocusEffect } from "@react-navigation/native";

type RootStackParamList = {
  Grades: undefined;
  Lessons: { grade: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "Grades">;

const DOUBLE_TAP_DELAY = 400;
const GRADES = ["Grade 10", "Grade 11"];

// ... existing imports

const Grades = ({ navigation }: Props) => {
  // Use a Ref for the logic, State for the UI colors
  const focusedGradeRef = useRef<string | null>(null);
  const [uiActiveGrade, setUiActiveGrade] = useState<string | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});

  useFocusEffect(
    useCallback(() => {
      Speech.stop(); // stop previous speech
      Speech.speak("Choose your Grade", {
        rate: 0.9,
        pitch: 1,
        volume: 1.0,
      });

      return () => {};
    }, [])
  );

  const navigateFocused = (grade: string) => {
    Speech.stop();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Speech.speak(`Opening ${grade}`);
    navigation.navigate("Lessons", { grade });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTap.current;

        // Check if double tap happened while finger is over a grade
        if (timeSinceLastTap < DOUBLE_TAP_DELAY && focusedGradeRef.current) {
          navigateFocused(focusedGradeRef.current);
        }
        lastTap.current = now;
      },

      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;
        let foundGrade: string | null = null;

        for (const grade of GRADES) {
          const l = layouts.current[grade];
          if (
            l &&
            moveX >= l.x &&
            moveX <= l.x + l.w &&
            moveY >= l.y &&
            moveY <= l.y + l.h
          ) {
            foundGrade = grade;
            break;
          }
        }

        if (foundGrade !== focusedGradeRef.current) {
          focusedGradeRef.current = foundGrade; // Update Ref immediately
          setUiActiveGrade(foundGrade); // Update UI state for colors

          if (foundGrade) {
            Speech.stop();
            Speech.speak(foundGrade);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      },
    })
  ).current;

  const updateLayout = (grade: string) => {
    // We use a small delay to ensure the screen has finished rendering
    setTimeout(() => {
      viewRefs.current[grade]?.measure((x, y, width, height, pageX, pageY) => {
        layouts.current[grade] = { x: pageX, y: pageY, w: width, h: height };
      });
    }, 100);
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
            uiActiveGrade === grade && styles.activeGradeContainer,
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
