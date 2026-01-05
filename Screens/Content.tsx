import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, View, PanResponder } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import { SYLLABUS_DATA } from "../data/syllabusData";

type Props = NativeStackScreenProps<RootStackParamList, "Content">;

export default function Content({ route }: Props) {
  const { lessonId, grade } = route.params;
  const navigation = useNavigation<any>();

  const lesson = SYLLABUS_DATA[grade]?.find((l) => l.id === lessonId);
  const topics = lesson?.topics || [];

  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const focusedTopicRef = useRef<string | null>(null);
  const lastTapRef = useRef(0);

  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});

  const announce = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.95 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Announce lesson on focus
  useFocusEffect(
    useCallback(() => {
      if (!lesson) return;

      Speech.speak(
        `Lesson ${lesson.title}. There are ${topics.length} sub topics. 
        Swipe to explore. Double tap to open lesson.`,
        { rate: 0.9 }
      );

      return () => Speech.stop();
    }, [lesson])
  );

  // Handle double tap to open lesson player
  const handleTopicDoubleTap = (topicId: string, topicTitle: string) => {
    const now = Date.now();

    if (now - lastTapRef.current < 300) {
      Speech.stop();
      Speech.speak(`Opening ${topicTitle}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      navigation.navigate("LessonPlayer", {
        subTopicId: topicId,
        title: topicTitle,
      });
    }

    lastTapRef.current = now;
  };

  // PanResponder for swipe navigation & active topic highlighting
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onPanResponderMove: (_, gesture) => {
        const { moveX, moveY } = gesture;
        let found: string | null = null;

        topics.forEach((topic) => {
          const l = layouts.current[topic.id];
          if (
            l &&
            moveX >= l.x &&
            moveX <= l.x + l.w &&
            moveY >= l.y &&
            moveY <= l.y + l.h
          ) {
            found = topic.id;
          }
        });

        if (found !== focusedTopicRef.current) {
          focusedTopicRef.current = found;
          setActiveTopic(found);
          const t = topics.find((topic) => topic.id === found);
          if (t) announce(t.title);
        }
      },

      onPanResponderRelease: () => {
        setActiveTopic(null);
        focusedTopicRef.current = null;
      },
    })
  ).current;

  const updateLayout = (topicId: string) => {
    setTimeout(() => {
      viewRefs.current[topicId]?.measure(
        (_x, _y, width, height, pageX, pageY) => {
          layouts.current[topicId] = {
            x: pageX,
            y: pageY,
            w: width,
            h: height,
          };
        }
      );
    }, 100);
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <Text style={styles.lessonNumber}>Lesson {lesson?.number}</Text>
        <Text style={styles.lessonTitle}>{lesson?.title}</Text>
      </View>

      <View style={styles.topicsContainer}>
        {topics.map((topic) => (
          <View
            key={topic.id}
            ref={(ref) => {
              viewRefs.current[topic.id] = ref;
            }}
            onLayout={() => updateLayout(topic.id)}
            onTouchEnd={() => handleTopicDoubleTap(topic.id, topic.title)}
            style={[
              styles.topicCard,
              activeTopic === topic.id && styles.activeTopicCard,
            ]}
          >
            <Text style={styles.topicText}>{topic.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 40,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  lessonNumber: {
    color: "#a33",
    fontSize: 16,
    fontWeight: "bold",
  },
  lessonTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  topicsContainer: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  topicCard: {
    backgroundColor: "#1E1E1E",
    marginVertical: 8,
    padding: 25,
    borderRadius: 16,
    minHeight: 90,
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeTopicCard: {
    backgroundColor: "#711a1a",
    borderColor: "white",
    transform: [{ scale: 1.03 }],
  },
  topicText: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
  },
});
