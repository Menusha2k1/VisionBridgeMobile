import React, { useRef, useState, useEffect, useCallback } from "react";
import { Pressable } from "react-native";

import {
  StyleSheet,
  Text,
  View,
  PanResponder,
  ScrollView,
  Dimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { SYLLABUS_DATA } from "../data/syllabusData";
import { RootStackParamList } from "../App";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";

type Props = NativeStackScreenProps<RootStackParamList, "Lessons">;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DOUBLE_TAP_DELAY = 400;
const SCROLL_SPEED = 8;
const TOP_THRESHOLD = 180;
const BOTTOM_THRESHOLD = SCREEN_HEIGHT - 150;

const Lessons = ({ route, navigation }: Props) => {
  const { grade } = route.params;
  const lessons = SYLLABUS_DATA[grade] || [];

  const [activeId, setActiveId] = useState<string | null>(null);
  const focusedIdRef = useRef<string | null>(null);
  const lastTap = useRef<number>(0);

  const tapCount = useRef(0);
  const lastTapTime = useRef(0);

  const TRIPLE_TAP_DELAY = 600; // ms

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});
  const soundRef = useRef<Audio.Sound | null>(null);
  const openingMessageRef = useRef("");

  const announce = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 1.0 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
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

  useFocusEffect(
    useCallback(() => {
      const count = lessons.length;
      const lessonPlural = count === 1 ? "Lesson" : "Lessons";

      const announcement =
        count > 0
          ? `You are now on the Lessons page. There are ${count} ${lessonPlural} available.`
          : "You are now on the Lessons page. There are no lessons to show.";

      openingMessageRef.current = announcement;

      Speech.stop();
      Speech.speak(announcement, { rate: 0.9 });
    }, [lessons])
  );

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Speech.stop();
    Speech.speak(openingMessageRef.current, { rate: 0.9 });
  };

  const updateLayouts = () => {
    lessons.forEach((lesson) => {
      viewRefs.current[lesson.id]?.measureInWindow((x, y, width, height) => {
        if (width > 0) {
          layouts.current[lesson.id] = { x, y, w: width, h: height };
        }
      });
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTap.current;

        // --- GLOBAL DOUBLE TAP NAVIGATION ---
        if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
          if (focusedIdRef.current) {
            const lesson = lessons.find((l) => l.id === focusedIdRef.current);
            if (lesson) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Speech.speak(`Opening ${lesson.title}`);
              navigation.navigate("Content", { lessonId: lesson.id, grade });
              lastTap.current = 0; // Reset
              return;
            }
          }
        }
        lastTap.current = now;

        // --- INITIAL FOCUS ON TOUCH ---
        const { pageX, pageY } = evt.nativeEvent;
        for (const lesson of lessons) {
          const l = layouts.current[lesson.id];
          if (
            l &&
            pageX >= l.x &&
            pageX <= l.x + l.w &&
            pageY >= l.y &&
            pageY <= l.y + l.h
          ) {
            if (focusedIdRef.current !== lesson.id) {
              focusedIdRef.current = lesson.id;
              playFeedback();

              setActiveId(lesson.id);
              announce(lesson.title);
            }
            break;
          }
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;

        // --- AUTO SCROLL LOGIC ---
        if (moveY < TOP_THRESHOLD) {
          const nextScroll = Math.max(0, scrollYRef.current - SCROLL_SPEED);
          scrollViewRef.current?.scrollTo({ y: nextScroll, animated: false });
          updateLayouts();
        } else if (moveY > BOTTOM_THRESHOLD) {
          const nextScroll = scrollYRef.current + SCROLL_SPEED;
          scrollViewRef.current?.scrollTo({ y: nextScroll, animated: false });
          updateLayouts();
        }

        // --- HOVER HIT DETECTION ---
        let foundId: string | null = null;
        for (const lesson of lessons) {
          const l = layouts.current[lesson.id];
          if (
            l &&
            moveX >= l.x &&
            moveX <= l.x + l.w &&
            moveY >= l.y &&
            moveY <= l.y + l.h
          ) {
            foundId = lesson.id;
            break;
          }
        }

        if (foundId && foundId !== focusedIdRef.current) {
          focusedIdRef.current = foundId;
          setActiveId(foundId);
          const lesson = lessons.find((l) => l.id === foundId);
          announce(lesson?.title || "");
        }
      },
      // Note: We don't clear focusedIdRef on release so global double-tap works
      onPanResponderRelease: () => {},
    })
  ).current;

  useEffect(() => {
    const timer = setTimeout(updateLayouts, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable
      style={{ flex: 1 }}
      onLongPress={handleLongPress}
      delayLongPress={600} // Accessibility friendly
    >
      <View style={styles.container} {...panResponder.panHandlers}>
        <ScrollView
          ref={scrollViewRef}
          scrollEnabled={false}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {lessons.map((lesson) => (
            <View
              key={lesson.id}
              ref={(ref) => {
                viewRefs.current[lesson.id] = ref;
              }}
              onLayout={updateLayouts}
              style={[
                styles.lessonCard,
                activeId === lesson.id
                  ? styles.activeCard
                  : styles.unfocusedCard,
              ]}
            >
              <View
                style={[
                  styles.numberCircle,
                  activeId === lesson.id && styles.activeCircle,
                ]}
              >
                <Text
                  style={[
                    styles.lessonNumber,
                    activeId === lesson.id && styles.activeNumberText,
                  ]}
                >
                  {lesson.number}
                </Text>
              </View>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", paddingTop: 60 },
  scrollContent: { paddingBottom: 200 },
  lessonCard: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginVertical: 10,
    height: 110,
    borderRadius: 25,
    alignItems: "center",
    paddingHorizontal: 20,
    elevation: 5,
  },
  unfocusedCard: {
    backgroundColor: "#444444", // Grey
  },
  activeCard: {
    backgroundColor: "#a51818", // Red
    borderWidth: 3,
    borderColor: "white",
    transform: [{ scale: 1.02 }],
  },
  numberCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  activeCircle: {
    backgroundColor: "#fff",
  },
  lessonNumber: { color: "#444", fontSize: 22, fontWeight: "900" },
  activeNumberText: { color: "#a51818" },
  lessonTitle: { color: "white", fontSize: 20, fontWeight: "bold", flex: 1 },
});

export default Lessons;
