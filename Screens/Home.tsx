import React, { useEffect, useRef, useCallback, useState } from "react";
import { View, Text, StyleSheet, PanResponder, Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";
import useStrugglePredictor from "../Hooks/useStrugglePredictor";
import commands from "../components/commands";
import { useSpeechSettings } from "../Context/SpeechContext";
import { apiSaveLog } from "../Services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RootStackParamList = {
  Home: undefined;
  Grades: undefined;
  Marks: undefined;
  Quizes: undefined;
  Assessments: undefined;
  Help: undefined;
  QuizList: { grade: string };
  StudentLogin: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const DOUBLE_TAP_DELAY = 400;
const BUTTON_LABELS = [
  "Lessons",
  "Quizes",
  "Marks",
  "Assessments",
  "Help",
  "Logout",
] as const;

export default function Home({ navigation }: Props) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const focused = useRef<string | null>(null);
  const lastTap = useRef<number>(0);
  const tapCount = useRef(0); // Random tap count
  const studentIdRef = useRef<number | null>(null);

  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});
  const soundRef = useRef<Audio.Sound | null>(null);

  // --- AI PREDICTOR SETUP ---
  const { predict } = useStrugglePredictor();
  const { globalRate, setGlobalRate } = useSpeechSettings();
  const gestureHistory = useRef<string[]>([]);
  const globalRateRef = useRef(globalRate); // To keep track of globalRate in gesture callbacks

  useEffect(() => {
    AsyncStorage.getItem("student_session").then((data) => {
      if (data) {
        const session = JSON.parse(data);
        studentIdRef.current = session.student.id;
      }
    });
  }, []);
  useEffect(() => {
    globalRateRef.current = globalRate;
  }, [globalRate]);

  const haddleLogout = () => {
    AsyncStorage.removeItem("student_session").then(() => {
      navigation.replace("StudentLogin");
    });
  };

  useFocusEffect(
    useCallback(() => {
      // Pro ද නැද්ද බලලා commands තෝරනවා
      const isPro = globalRate > 1.0;
      const message = isPro ? "Main Menu." : commands.Home.welcome;

      Speech.speak(message, {
        rate: globalRate,
        pitch: 1,
        volume: 1.0,
      });
    }, [globalRate]),
  );

  useEffect(() => {
    async function loadSound() {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/tick.mp3"),
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
        Speech.speak(label, { volume: 1, rate: globalRate });
      }
    },
    [playFeedback, globalRate],
  );

  const navigateFocused = () => {
    if (!focused.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const destination = focused.current;
    if (destination === "Lessons") navigation.navigate("Grades");
    else if (destination === "Quizes")
      navigation.navigate("QuizList", { grade: "Grade 10" });
    else if (destination === "Assessments")
      navigation.navigate("AssessmentList" as any);
    else if (destination === "Logout") {
      haddleLogout();
    } else navigation.navigate(destination as any);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTap.current;

        // 1. Double Tap Success
        if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
          navigateFocused();
          lastTap.current = 0;
          tapCount.current = 0;
          return;
        }

        if (timeSinceLastTap >= DOUBLE_TAP_DELAY && timeSinceLastTap < 1000) {
          if (focused.current) {
            Speech.stop();
            Speech.speak(
              `To enter ${focused.current}, please tap twice very quickly.`,
              { rate: globalRate },
            );
          }
        }

        // 3. Excessive Tapping on empty space
        if (!focused.current) {
          tapCount.current += 1;
          if (tapCount.current > 3) {
            Speech.stop();
            Speech.speak(
              "You are tapping on an empty area. Please slide your finger to find menu options.",
              { rate: globalRate },
            );
            tapCount.current = 0;
          }
        } else {
          tapCount.current = 0;
        }

        lastTap.current = now;
        gestureHistory.current = [];
      },

      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY, vx, vy } = gestureState;

        if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
          const dir =
            Math.abs(vx) > Math.abs(vy)
              ? vx > 0
                ? "R"
                : "L"
              : vy > 0
                ? "D"
                : "U";
          if (
            gestureHistory.current[gestureHistory.current.length - 1] !== dir
          ) {
            gestureHistory.current.push(dir);
          }
        }

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

      onPanResponderRelease: () => {
        // --- AI STRUGGLE PREDICTION (Gestures) ---
        if (gestureHistory.current.length > 2) {
          const userPath = gestureHistory.current.join("");
          const prediction = predict(userPath, "D");

          if (prediction.predictedIndex === 0) {
            setGlobalRate(1.2);
          } else if (prediction.predictedIndex === 2) {
            setGlobalRate(0.8);
            Speech.stop();
            Speech.speak(commands.Home.struggle, { rate: 0.8 });

            // Send struggle log to backend
            if (studentIdRef.current) {
              apiSaveLog({
                student_id: studentIdRef.current,
                screen_name: "Home",
                user_path: userPath,
                prediction_label: prediction.label,
              }).catch((err) =>
                console.warn("Failed to save struggle log:", err),
              );
            }
          }
        }
      },
    }),
  ).current;

  const handleLayout = (label: string) => {
    viewRefs.current[label]?.measure((x, y, width, height, pageX, pageY) => {
      if (width > 0)
        layouts.current[label] = { x: pageX, y: pageY, w: width, h: height };
    });
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
    height: 90,
    marginVertical: 10,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  buttonUnfocused: { backgroundColor: "#444444" },
  buttonFocused: {
    backgroundColor: "#a51818",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  text: { fontSize: 30, color: "#fff", fontWeight: "bold" },
});
