import React, { useEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { RootStackParamList } from "../App";
import KarunarathneLessonQuizScreen from "../features/index";

type Props = NativeStackScreenProps<RootStackParamList, "LessonPlayer">;

/**
 * LessonPlayer - Wrapper component
 *
 * Routes to the full Lesson/Quiz engine based on mode parameter.
 *
 * Receives:
 *   - mode: "lesson" | "quiz" - determines which engine to run
 *
 * Renders the complete KarunarathneLessonQuizScreen with initial mode.
 */
export default function LessonPlayer({ route, navigation }: Props) {
  const { mode = "lesson" } = route.params || {};

  // Announce entry
  useEffect(() => {
    const message =
      mode === "lesson" ? "Entering lesson mode" : "Entering quiz mode";

    Speech.speak(message, { rate: 0.95 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [mode]);

  // Pass mode to feature, handle back navigation
  return (
    <KarunarathneLessonQuizScreen initialMode={mode} hideModeToggle={false} />
  );
}
