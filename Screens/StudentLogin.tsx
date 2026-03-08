import React, { useRef, useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, PanResponder, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useFocusEffect } from "@react-navigation/native";
import useStrugglePredictor from "../Hooks/useStrugglePredictor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiLogin } from "../Services/api";

const PIN_LENGTH = 4;
const DOUBLE_TAP_DELAY = 450;
const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "OK"];
const SESSION_KEY = "student_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

const PinLogin = ({ navigation }: any) => {
  const [pin, setPin] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pinRef = useRef(pin);
  const focusedKeyRef = useRef<string | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});

  const { predict } = useStrugglePredictor();
  const gestureHistory = useRef<string[]>([]);

  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  // --- CHECK EXISTING SESSION (30-day persistence) ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem(SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const now = Date.now();
          if (now - session.loginTime < SESSION_DURATION) {
            Speech.speak(`Welcome back ${session.student.name}`);
            navigation.replace("Home");
            return;
          }
          // Session expired — clear it
          await AsyncStorage.removeItem(SESSION_KEY);
        }
      } catch (e) {
        console.warn("Session check failed:", e);
      }
      setIsLoading(false);
    };
    checkSession();
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        Speech.stop();
        Speech.speak(
          "Hi, welcome to Vision Bridge. Enter your four digit student pin to login. Swipe to explore numbers, double tap to select.",
          { rate: 1, pitch: 1, volume: 1.0 },
        );
      }
    }, [isLoading]),
  );

  const handleKeyPress = (key: string) => {
    Haptics.selectionAsync().catch(() => {});

    if (key === "Clear") {
      setPin("");
      Speech.stop();
      Speech.speak("Cleared");
    } else if (key === "OK") {
      const currentPin = pinRef.current;
      if (currentPin.length === PIN_LENGTH) {
        // --- CALL BACKEND API ---
        Speech.stop();
        Speech.speak("Checking your pin, please wait.");
        apiLogin(currentPin)
          .then(async (student) => {
            const session = {
              student,
              loginTime: Date.now(),
            };
            await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

            Speech.stop();
            Speech.speak(`Welcome ${student.name}`);
            navigation.replace("Home");
          })
          .catch((error) => {
            console.error("Login error:", error.message);
            Speech.stop();
            if (error.message === "Network request failed") {
              Speech.speak(
                "Cannot connect to server. Please check your connection.",
              );
            } else {
              Speech.speak("Incorrect PIN. Cleared.");
            }
            setPin("");
          });
      } else {
        Speech.stop();
        Speech.speak(
          `PIN incomplete. You have only entered ${currentPin.length} digits.`,
        );
      }
    } else {
      if (pinRef.current.length < PIN_LENGTH) {
        setPin((prev) => {
          const newPin = prev + key;
          Speech.stop();
          Speech.speak(`${key} entered`);
          if (newPin.length === PIN_LENGTH) {
            Speech.speak(
              "PIN complete. Now find the OK button at the bottom right to login.",
            );
          }
          return newPin;
        });
      } else {
        Speech.stop();
        Speech.speak("PIN is full. Select OK to proceed.");
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const now = Date.now();
        const { pageX, pageY } = evt.nativeEvent;
        let foundKey: string | null = null;
        gestureHistory.current = [];

        for (const key of PAD) {
          const l = layouts.current[key];
          if (
            l &&
            pageX >= l.x &&
            pageX <= l.x + l.w &&
            pageY >= l.y &&
            pageY <= l.y + l.h
          ) {
            foundKey = key;
            break;
          }
        }

        if (foundKey) {
          if (
            now - lastTap.current < DOUBLE_TAP_DELAY &&
            foundKey === focusedKeyRef.current
          ) {
            handleKeyPress(foundKey);
          } else {
            focusedKeyRef.current = foundKey;
            setActiveKey(foundKey);
            Speech.stop();
            Speech.speak(foundKey);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
        lastTap.current = now;
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

        let currentKey: string | null = null;
        for (const key of PAD) {
          const l = layouts.current[key];
          if (
            l &&
            moveX >= l.x &&
            moveX <= l.x + l.w &&
            moveY >= l.y &&
            moveY <= l.y + l.h
          ) {
            currentKey = key;
            break;
          }
        }

        if (currentKey && currentKey !== focusedKeyRef.current) {
          focusedKeyRef.current = currentKey;
          setActiveKey(currentKey);
          Speech.stop();
          Speech.speak(currentKey);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },

      onPanResponderRelease: () => {
        setActiveKey(null);

        if (gestureHistory.current.length > 3) {
          const userPath = gestureHistory.current.join("");
          const prediction = predict(userPath, "D");

          if (prediction.predictedIndex === 2) {
            if (pinRef.current.length === PIN_LENGTH) {
              Speech.speak(
                "You have finished typing. The OK button is located at the very bottom right corner of the keypad.",
                { rate: 0.8 },
              );
            } else {
              Speech.speak(
                "Need help? The numbers start from one at the top left. Zero is at the bottom center, and Clear is to its left.",
                { rate: 0.8 },
              );
            }
          }
        }
      },
    }),
  ).current;

  const measureKey = (key: string) => {
    const tryMeasure = () => {
      viewRefs.current[key]?.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0) {
          layouts.current[key] = { x: pageX, y: pageY, w: width, h: height };
        } else {
          setTimeout(tryMeasure, 100);
        }
      });
    };
    tryMeasure();
  };

  // Show nothing while checking session
  if (isLoading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <Text style={styles.title}>PIN Login</Text>
        <View style={styles.dotContainer}>
          {[...Array(PIN_LENGTH)].map((_, i) => (
            <View
              key={i}
              style={[styles.dot, pin.length > i && styles.dotFilled]}
            />
          ))}
        </View>
      </View>

      <View style={styles.grid}>
        {PAD.map((key) => (
          <View
            key={key}
            ref={(ref) => {
              viewRefs.current[key] = ref;
            }}
            onLayout={() => measureKey(key)}
            style={[styles.key, activeKey === key && styles.keyActive]}
          >
            <Text style={styles.keyText}>{key}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  dotContainer: { flexDirection: "row" },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "white",
    marginHorizontal: 8,
  },
  dotFilled: { backgroundColor: "#a51818", borderColor: "#a51818" },
  grid: {
    flex: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: 10,
  },
  key: {
    width: "28%",
    height: "20%",
    margin: "2%",
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
  },
  keyActive: { backgroundColor: "#a51818" },
  keyText: { color: "white", fontSize: 30, fontWeight: "bold" },
});

export default PinLogin;
