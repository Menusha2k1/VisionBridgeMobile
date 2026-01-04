import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, PanResponder, Dimensions } from "react-native";
import * as Speech from "expo-speech";
import { useSettings } from "../Context/SettingsContext";
import { loadModel, predictStruggle } from "../utils/aiHelper";
import { LayersModel } from "@tensorflow/tfjs-layers";

export default function Lessons() {
  const { settings, updateFromAI } = useSettings();
  const [model, setModel] = useState<LayersModel | null>(null);
  const gesturePath = useRef<any[]>([]);
  const layouts = useRef<any>({});

  useEffect(() => {
    loadModel().then(setModel);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Record coordinates for AI analysis
        gesturePath.current.push({
          x: gestureState.moveX,
          y: gestureState.moveY,
          t: Date.now(),
        });

        // Hit Detection Logic
        Object.keys(layouts.current).forEach((id) => {
          const l = layouts.current[id];
          const pad = settings.accuracyPadding; // This grows if AI detects struggle

          if (
            gestureState.moveX >= l.x - pad &&
            gestureState.moveX <= l.x + l.w + pad &&
            gestureState.moveY >= l.y - pad &&
            gestureState.moveY <= l.y + l.h + pad
          ) {
            // Add your speech trigger logic here
          }
        });
      },
      onPanResponderRelease: async () => {
        if (model && gesturePath.current.length > 5) {
          const score = await predictStruggle(model, gesturePath.current);
          if (score !== null) updateFromAI(score);
        }
        gesturePath.current = []; // Reset path
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Text style={styles.header}>Adaptive ICT Lessons</Text>
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>AI Confidence: {settings.level}</Text>
        <Text style={styles.statusText}>
          Speech Speed: {settings.speechRate}x
        </Text>
      </View>

      {/* Example Lesson Card */}
      <View
        onLayout={(e) => {
          layouts.current["lesson1"] = e.nativeEvent.layout;
        }}
        style={[
          styles.card,
          settings.level === "beginner" && styles.beginnerCard,
        ]}
      >
        <Text style={styles.cardText}>Unit 1: Logic Gates</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
    paddingTop: 60,
  },
  header: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  statusBox: {
    marginVertical: 20,
    padding: 10,
    backgroundColor: "#333",
    borderRadius: 10,
  },
  statusText: { color: "#00ffcc", fontSize: 14, textAlign: "center" },
  card: {
    padding: 25,
    backgroundColor: "#1e1e1e",
    borderRadius: 15,
    marginVertical: 10,
  },
  beginnerCard: { borderColor: "#711a1a", borderWidth: 2 }, // Highlight if beginner
  cardText: { color: "white", fontSize: 18 },
});
