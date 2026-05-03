import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import useStrugglePredictor from "../Hooks/useStrugglePredictor";
import { useSpeechSettings } from "../Context/SpeechContext";
import { apiSaveLog } from "../Services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import commands from "../components/commands";
import { API_BASE_URL } from "../Services/apiConfig";

interface Assessment {
  id: number;
  title: string;
  created_at: string;
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const DOUBLE_TAP_DELAY = 400;

const AssessmentList: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [lessons, setLessons] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);

  const lessonsRef = useRef<Assessment[]>([]);
  const focused = useRef<Assessment | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<
    Record<number, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<number, View | null>>({});

  // --- AI PREDICTOR SETUP ---
  const { predict } = useStrugglePredictor();
  const { globalRate, setGlobalRate } = useSpeechSettings();
  const gestureHistory = useRef<string[]>([]);
  const studentIdRef = useRef<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("student_session").then((data) => {
      if (data) {
        const session = JSON.parse(data);
        studentIdRef.current = session.student.id;
      }
    });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/assessments`)
      .then((res) => res.json())
      .then((data) => {
        setLessons(data);
        lessonsRef.current = data;
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading && lessons.length >= 0) {
        Speech.stop();
        Speech.speak(
          `You are now in the assessment page. You have ${lessons.length} assessment${lessons.length !== 1 ? "s" : ""}.`,
          { rate: globalRate, pitch: 1, volume: 1.0 },
        );
      }
    }, [loading, lessons.length, globalRate]),
  );

  const speak = useCallback(
    (item: Assessment) => {
      if (focused.current?.id !== item.id) {
        focused.current = item;
        setActiveId(item.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Speech.stop();
        Speech.speak(item.title, { volume: 1, rate: globalRate });
      }
    },
    [globalRate],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        const now = Date.now();
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
          if (focused.current) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.navigate("Assessments", { id: focused.current.id });
          }
          lastTap.current = 0;
          return;
        }
        lastTap.current = now;
        gestureHistory.current = [];
      },

      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY, vx, vy } = gestureState;

        // Track gesture directions for struggle detection
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

        const { pageX, pageY } = evt.nativeEvent;
        for (const item of lessonsRef.current) {
          const b = layouts.current[item.id];
          if (
            b &&
            pageX >= b.x &&
            pageX <= b.x + b.w &&
            pageY >= b.y &&
            pageY <= b.y + b.h
          ) {
            speak(item);
            break;
          }
        }
      },

      onPanResponderRelease: () => {
        // --- AI STRUGGLE PREDICTION ---
        if (gestureHistory.current.length > 2) {
          const userPath = gestureHistory.current.join("");
          const prediction = predict(userPath, "D");

          if (prediction.predictedIndex === 0) {
            setGlobalRate(1.2);
          } else if (prediction.predictedIndex === 2) {
            setGlobalRate(0.8);
            Speech.stop();
            Speech.speak(commands.AssesmentList.struggle, { rate: 0.8 });

            if (studentIdRef.current) {
              apiSaveLog({
                student_id: studentIdRef.current,
                screen_name: "AssessmentList",
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

  const handleLayout = (id: number) => {
    viewRefs.current[id]?.measure((x, y, width, height, pageX, pageY) => {
      if (width > 0)
        layouts.current[id] = { x: pageX, y: pageY, w: width, h: height };
    });
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Text style={styles.headerTitle}>Assessments</Text>
      {lessons.map((item) => (
        <View
          key={item.id}
          ref={(el) => {
            viewRefs.current[item.id] = el;
          }}
          onLayout={() => handleLayout(item.id)}
          style={[styles.card, activeId === item.id && styles.cardFocused]}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 15,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#ffffff",
  },
  card: {
    backgroundColor: "#3e3e3e",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  cardFocused: {
    backgroundColor: "#a51818",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  title: { fontSize: 18, fontWeight: "600", color: "#ffffff" },
  date: { fontSize: 12, color: "#afafaf", marginTop: 5 },
});

export default AssessmentList;
