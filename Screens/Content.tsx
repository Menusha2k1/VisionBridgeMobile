import React, { useRef, useState } from "react";
import { StyleSheet, Text, View, PanResponder, Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { SYLLABUS_DATA } from "../data/syllabusData";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "Content">;

const Content = ({ route }: Props) => {
  const { lessonId, grade } = route.params;

  // Find the specific lesson from our data file
  const lesson = SYLLABUS_DATA[grade]?.find((l) => l.id === lessonId);
  const topics = lesson?.topics || [];

  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const focusedTopicRef = useRef<string | null>(null);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});

  const announce = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 1.0 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;
        let foundTopic: string | null = null;

        topics.forEach((topic) => {
          const l = layouts.current[topic];
          if (
            l &&
            moveX >= l.x &&
            moveX <= l.x + l.w &&
            moveY >= l.y &&
            moveY <= l.y + l.h
          ) {
            foundTopic = topic;
          }
        });

        if (foundTopic !== focusedTopicRef.current) {
          focusedTopicRef.current = foundTopic;
          setActiveTopic(foundTopic);
          if (foundTopic) announce(foundTopic);
        }
      },
      onPanResponderRelease: () => {
        setActiveTopic(null);
        focusedTopicRef.current = null;
      },
    })
  ).current;

  const updateLayout = (topic: string) => {
    setTimeout(() => {
      viewRefs.current[topic]?.measure((x, y, width, height, pageX, pageY) => {
        layouts.current[topic] = { x: pageX, y: pageY, w: width, h: height };
      });
    }, 100);
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.headerArea}>
        <Text style={styles.lessonNumber}>Lesson {lesson?.number}</Text>
        <Text style={styles.lessonTitle}>{lesson?.title}</Text>
      </View>

      <View style={styles.topicsContainer}>
        {topics.map((topic, index) => (
          <View
            key={topic}
            ref={(ref) => {
              viewRefs.current[topic] = ref;
            }}
            onLayout={() => updateLayout(topic)}
            style={[
              styles.topicCard,
              activeTopic === topic && styles.activeTopicCard,
            ]}
          >
            <Text style={styles.topicText}>{topic}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", paddingTop: 40 },
  headerArea: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#333" },
  lessonNumber: { color: "#711a1a", fontWeight: "bold", fontSize: 16 },
  lessonTitle: { color: "white", fontSize: 24, fontWeight: "bold" },
  topicsContainer: { flex: 1, padding: 10, justifyContent: "center" },
  topicCard: {
    backgroundColor: "#1E1E1E",
    marginVertical: 8,
    padding: 25,
    borderRadius: 15,
    justifyContent: "center",
    minHeight: 100,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeTopicCard: {
    backgroundColor: "#711a1a",
    borderColor: "white",
    transform: [{ scale: 1.02 }],
  },
  topicText: {
    color: "white",
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default Content;
