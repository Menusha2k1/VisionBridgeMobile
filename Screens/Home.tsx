import React, { useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, PanResponder, Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";

// Ensure this matches your App.tsx stack definitions
type RootStackParamList = {
  Home: undefined;
  Grades: undefined; // Navigation destination
  Marks: undefined;
  Quizes: undefined;
  Assessments: undefined;
  QuizList: { grade: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const DOUBLE_TAP_DELAY = 400;

// The display names for the buttons
const BUTTON_LABELS = ["Lessons", "Quizes", "Marks", "Assessments"] as const;

export default function Home({ navigation }: Props) {
  const focused = useRef<string | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    async function loadSound() {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/tick.mp3")
      );
      soundRef.current = sound;
    }
    loadSound();
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const playFeedback = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (soundRef.current) await soundRef.current.replayAsync();
  }, []);

  const speak = useCallback(
    (label: string) => {
      if (focused.current !== label) {
        focused.current = label;
        playFeedback();
        Speech.stop();
        Speech.speak(label, { volume: 1, rate: 1.0 });
      }
    },
    [playFeedback]
  );

  const navigateFocused = () => {
    if (!focused.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // CLEANED NAVIGATION LOGIC
    if (focused.current === "Lessons") {
      navigation.navigate("Grades");
    } else if (focused.current === "Quizes") {
      // For now, we pass a default grade or you can pull this
      // from a global user state / context
      navigation.navigate("QuizList", { grade: "Grade 10" });
    } else {
      // Fallback for Marks and Assessments
      navigation.navigate(focused.current as any);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const now = Date.now();
        const { pageX, pageY } = evt.nativeEvent;

        // Check which button is under the initial touch
        let touchedLabel: string | null = null;
        for (const label of BUTTON_LABELS) {
          const b = layouts.current[label];
          if (
            b &&
            pageX >= b.x &&
            pageX <= b.x + b.w &&
            pageY >= b.y &&
            pageY <= b.y + b.h
          ) {
            touchedLabel = label;
            break;
          }
        }

        // Double tap detection on the SAME button
        if (
          now - lastTap.current < DOUBLE_TAP_DELAY &&
          touchedLabel === focused.current
        ) {
          navigateFocused();
        }

        if (touchedLabel) {
          speak(touchedLabel);
        }

        lastTap.current = now;
      },

      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;
        let foundMatch = false;

        for (const label of BUTTON_LABELS) {
          const b = layouts.current[label];
          if (
            b &&
            moveX >= b.x &&
            moveX <= b.x + b.w &&
            moveY >= b.y &&
            moveY <= b.y + b.h
          ) {
            speak(label);
            foundMatch = true;
            break;
          }
        }
        if (!foundMatch) focused.current = null;
      },
    })
  ).current;

  // Measurement logic for home screen buttons
  const handleLayout = (label: string) => {
    const tryMeasure = () => {
      viewRefs.current[label]?.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0) {
          layouts.current[label] = { x: pageX, y: pageY, w: width, h: height };
        } else {
          setTimeout(tryMeasure, 100);
        }
      });
    };
    tryMeasure();
  };

  // Dynamically create refs for the labels
  const viewRefs = useRef<Record<string, View | null>>({});

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {BUTTON_LABELS.map((label) => (
        <View
          key={label}
          ref={(el) => {
            if (el) viewRefs.current[label] = el;
          }}
          onLayout={() => handleLayout(label)}
          style={styles.button}
        >
          <Text style={styles.text}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: Dimensions.get("window").width * 0.85,
    height: 110,
    marginVertical: 10,
    borderRadius: 25,
    backgroundColor: "#a51818",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  text: { fontSize: 30, color: "#fff", fontWeight: "bold" },
});
