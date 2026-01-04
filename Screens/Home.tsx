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

    // LOGIC CHANGE: If the user double-taps "Lessons", go to "Grades"
    if (focused.current === "Lessons") {
      navigation.navigate("Grades");
    } else {
      // Cast to any to avoid strict TS errors for other routes while building
      navigation.navigate(focused.current as any);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const now = Date.now();
        if (now - lastTap.current < DOUBLE_TAP_DELAY && focused.current) {
          navigateFocused();
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

  // Dynamically create refs for the labels
  const viewRefs = useRef<Record<string, View | null>>({});

  const handleLayout = (label: string) => {
    viewRefs.current[label]?.measureInWindow((x, y, width, height) => {
      layouts.current[label] = { x, y, w: width, h: height };
    });
  };

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
