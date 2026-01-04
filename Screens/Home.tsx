import React, { useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, PanResponder, Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";

type RootStackParamList = {
  Home: undefined;
  Modules: undefined;
  Marks: undefined;
  Quizes: undefined;
  Assessments: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const DOUBLE_TAP_DELAY = 400;
const BUTTON_KEYS = ["Modules", "Quizes", "Marks", "Assessments"] as const;

export default function Home({ navigation }: Props) {
  const focused = useRef<string | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const soundRef = useRef<Audio.Sound | null>(null);
  const navSoundRef = useRef<Audio.Sound | null>(null);

  // 1. Load sound on mount
  useEffect(() => {
    async function loadSound() {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/tick.mp3") // Ensure you have a short mp3 here
      );
      soundRef.current = sound;
    }
    loadSound();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const playFeedback = useCallback(async () => {
    // Play Haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Play Sound
    if (soundRef.current) {
      await soundRef.current.replayAsync();
    }
  }, []);

  const speak = useCallback(
    (label: string) => {
      if (focused.current !== label) {
        focused.current = label;

        playFeedback(); // Trigger Sound + Haptic

        Speech.stop();
        Speech.speak(label, { volume: 1, rate: 1.0 });
      }
    },
    [playFeedback]
  );

  const navigateFocused = () => {
    if (!focused.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate(focused.current as keyof RootStackParamList);
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

        for (const key of BUTTON_KEYS) {
          const b = layouts.current[key];
          if (
            b &&
            moveX >= b.x &&
            moveX <= b.x + b.w &&
            moveY >= b.y &&
            moveY <= b.y + b.h
          ) {
            speak(key);
            foundMatch = true;
            break;
          }
        }
        if (!foundMatch) focused.current = null;
      },
    })
  ).current;

  const refs: Record<string, React.RefObject<View | null>> = {
    Modules: useRef<View>(null),
    Quizes: useRef<View>(null),
    Marks: useRef<View>(null),
    Assessments: useRef<View>(null),
  };

  const handleLayout = (key: string) => {
    refs[key].current?.measureInWindow((x, y, width, height) => {
      layouts.current[key] = { x, y, w: width, h: height };
    });
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {BUTTON_KEYS.map((key) => (
        <View
          key={key}
          ref={refs[key]}
          onLayout={() => handleLayout(key)}
          style={styles.button}
        >
          <Text style={styles.text}>{key}</Text>
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
