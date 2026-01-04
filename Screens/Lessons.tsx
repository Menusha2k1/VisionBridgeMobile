import React, { useRef, useState, useCallback } from "react";
import { StyleSheet, Text, View, PanResponder } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { SYLLABUS_DATA, Lesson } from "../data/syllabusData";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "Lessons">;

const DOUBLE_TAP_DELAY = 400;

const Lessons = ({ route, navigation }: Props) => {
  const { grade } = route.params;
  const lessons = SYLLABUS_DATA[grade] || [];

  const [activeId, setActiveId] = useState<string | null>(null);
  const focusedIdRef = useRef<string | null>(null);
  const lastTap = useRef<number>(0);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});

  const announce = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 1.0 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const navigateToContent = (lesson: Lesson) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Speech.speak(`Loading ${lesson.title}`);

    // Ensure these keys match Content: { lessonId: string; grade: string }
    navigation.navigate("Content", {
      lessonId: lesson.id,
      grade: grade,
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const now = Date.now();
        if (now - lastTap.current < DOUBLE_TAP_DELAY && focusedIdRef.current) {
          const lesson = lessons.find((l) => l.id === focusedIdRef.current);
          if (lesson) navigateToContent(lesson);
        }
        lastTap.current = now;
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;
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

        if (foundId !== focusedIdRef.current) {
          focusedIdRef.current = foundId;
          setActiveId(foundId);
          if (foundId) {
            const lesson = lessons.find((l) => l.id === foundId);
            announce(lesson?.title || "");
          }
        }
      },
    })
  ).current;

  const updateLayout = (id: string) => {
    setTimeout(() => {
      viewRefs.current[id]?.measure((x, y, width, height, pageX, pageY) => {
        layouts.current[id] = { x: pageX, y: pageY, w: width, h: height };
      });
    }, 100);
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Text style={styles.header}>{grade} Syllabus</Text>
      <View style={styles.listContainer}>
        {lessons.map((lesson) => (
          <View
            key={lesson.id}
            ref={(ref) => {
              viewRefs.current[lesson.id] = ref;
            }}
            onLayout={() => updateLayout(lesson.id)}
            style={[
              styles.lessonCard,
              activeId === lesson.id && styles.activeCard,
            ]}
          >
            <Text style={styles.lessonNumber}>{lesson.number}</Text>
            <View style={styles.textContainer}>
              <Text style={styles.lessonTitle} numberOfLines={2}>
                {lesson.title}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default Lessons;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 50,
  },
  header: {
    color: "white",
    fontSize: 22,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 10,
  },
  listContainer: {
    flex: 1, // Takes up remaining space
    justifyContent: "space-evenly", // Distributes cards without scrolling
    paddingBottom: 20,
  },
  lessonCard: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    marginHorizontal: 15,
    height: "14%", // Ensure 6-7 items fit on one screen
    borderRadius: 15,
    alignItems: "center",
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeCard: {
    backgroundColor: "#711a1a",
    borderColor: "white",
    transform: [{ scale: 1.03 }],
  },
  lessonNumber: {
    color: "#711a1a",
    fontSize: 30,
    fontWeight: "900",
    backgroundColor: "white",
    width: 50,
    height: 50,
    borderRadius: 25,
    textAlign: "center",
    textAlignVertical: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  lessonTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
