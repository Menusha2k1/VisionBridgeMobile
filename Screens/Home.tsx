import React, { useEffect, useRef, useCallback, useState } from "react";
import { View, Text, StyleSheet, PanResponder, Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";

type RootStackParamList = {
  Home: undefined;
  Grades: undefined;
  Marks: undefined;
  Quizes: undefined;
  Assessments: undefined;
  QuizList: { grade: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const DOUBLE_TAP_DELAY = 400;
const BUTTON_LABELS = ["Lessons", "Quizes", "Marks", "Assessments"] as const;

export default function Home({ navigation }: Props) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const focused = useRef<string | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});
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
        setActiveLabel(label);
        playFeedback();
        Speech.stop();
        Speech.speak(label, { volume: 1, rate: 1.0 });
      }
    },
    [playFeedback]
  );

  const navigateFocused = () => {
    if (!focused.current) {
      Speech.speak("Select an option first");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Using a temporary variable to avoid ref-clearing issues during transition
    const destination = focused.current;

    if (destination === "Lessons") navigation.navigate("Grades");
    else if (destination === "Quizes")
      navigation.navigate("QuizList", { grade: "Grade 10" });
    else navigation.navigate(destination as any);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTap.current;

        // --- GLOBAL DOUBLE TAP LOGIC ---
        // If user double taps ANYWHERE, navigate to whatever is currently focused
        if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
          navigateFocused();
          lastTap.current = 0;
          return; // STOP execution here so we don't focus a new button
        }

        lastTap.current = now;

        // --- SINGLE TAP / FOCUS LOGIC ---
        const { pageX, pageY } = evt.nativeEvent;
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

        if (touchedLabel) {
          speak(touchedLabel);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;
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
            break;
          }
        }
      },
    })
  ).current;

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

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {BUTTON_LABELS.map((label) => (
        <View
          key={label}
          ref={(el) => {
            viewRefs.current[label] = el;
          }}
          onLayout={() => handleLayout(label)}
          style={[
            styles.button,
            activeLabel === label
              ? styles.buttonFocused
              : styles.buttonUnfocused,
          ]}
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
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  buttonUnfocused: {
    backgroundColor: "#444444",
  },
  buttonFocused: {
    backgroundColor: "#a51818", // Red when focused
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  text: { fontSize: 30, color: "#fff", fontWeight: "bold" },
});
