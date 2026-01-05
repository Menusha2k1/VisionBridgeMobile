import React, { useRef, useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, PanResponder, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { validateStudentLogin } from "../data/studentData";
import { useFocusEffect } from "@react-navigation/native";

const PIN_LENGTH = 5;
const DOUBLE_TAP_DELAY = 450;
const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "OK"];

const PinLogin = ({ navigation }: any) => {
  const [pin, setPin] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const pinRef = useRef(pin);
  const focusedKeyRef = useRef<string | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});

  // Keep ref updated
  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  useFocusEffect(
    useCallback(() => {
      Speech.stop(); // stop previous speech
      Speech.speak(
        "Hi.., welcome To vision Bridge.., enter your student pin to login..,  swipe through the screen to type numbers..., double tap to enter the number",
        {
          rate: 1,
          pitch: 1,
          volume: 1.0,
        }
      );
    }, [])
  );

  // Key press logic
  const handleKeyPress = (key: string) => {
    Haptics.selectionAsync().catch(() => {});

    if (key === "Clear") {
      setPin("");
      Speech.stop();
      Speech.speak("Cleared");
    } else if (key === "OK") {
      const currentPin = pinRef.current;
      if (currentPin.length === PIN_LENGTH) {
        const student = validateStudentLogin(currentPin);
        if (student) {
          Speech.stop();
          Speech.speak(`Welcome ${student.name}`);
          navigation.navigate("Home");
        } else {
          Speech.stop();
          Speech.speak("Incorrect PIN. Cleared.");
          setPin("");
        }
      } else {
        Speech.stop();
        Speech.speak(
          `PIN incomplete. You have entered ${currentPin.length} digits.`
        );
      }
    } else {
      if (pinRef.current.length < PIN_LENGTH) {
        setPin((prev) => {
          const newPin = prev + key;
          Speech.stop();
          Speech.speak(key);
          if (newPin.length === PIN_LENGTH) {
            Speech.speak("PIN complete. Select OK to login");
          }
          return newPin;
        });
      } else {
        Speech.stop();
        Speech.speak("PIN is full. Select OK.");
      }
    }
  };

  // PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const now = Date.now();
        const { pageX, pageY } = evt.nativeEvent;
        let foundKey: string | null = null;

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
        const { moveX, moveY } = gestureState;
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
      onPanResponderRelease: () => setActiveKey(null),
    })
  ).current;

  // Measure keys
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
