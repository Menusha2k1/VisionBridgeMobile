import { Platform, Vibration } from "react-native";
import * as Haptics from "expo-haptics";

const runPattern = async (
  hapticAction?: () => Promise<void>,
  vibrationPattern?: number | number[]
) => {
  try {
    if (hapticAction) {
      await hapticAction();
    }
  } catch {
    // ignore haptic API errors
  }

  if (vibrationPattern !== undefined) {
    Vibration.vibrate(vibrationPattern);
  }
};

export const AccessibilityFeedback = {
  /**
   * Strong immediate touch confirmation
   */
  touchStart: async () => {
    await runPattern(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      [0, 120]
    );
  },

  /**
   * General gesture detected
   */
  gestureDetected: async () => {
    await runPattern(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      [0, 120, 50, 120]
    );
  },

  /**
   * Next segment
   */
  navigationNext: async () => {
    await runPattern(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      [0, 140, 60, 140]
    );
  },

  /**
   * Previous segment
   */
  navigationPrevious: async () => {
    await runPattern(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      [0, 220]
    );
  },

  /**
   * Repeat
   */
  repeat: async () => {
    await runPattern(
      () => Haptics.selectionAsync(),
      [0, 100, 50, 100, 50, 100]
    );
  },

  /**
   * Stop
   */
  stop: async () => {
    await runPattern(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
      [0, 250, 80, 180]
    );
  },

  /**
   * Hint
   */
  hint: async () => {
    await runPattern(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
      [0, 220, 70, 120]
    );
  },

  /**
   * Quiz answer gestures
   */
  answerA: async () => {
    await runPattern(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
      [0, 120]
    );
  },

  answerB: async () => {
    await runPattern(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
      [0, 140]
    );
  },

  answerC: async () => {
    await runPattern(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      [0, 160]
    );
  },

  answerD: async () => {
    await runPattern(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      [0, 180]
    );
  },

  /**
   * Correct answer
   */
  correctAnswer: async () => {
    await runPattern(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
      [0, 120, 60, 180]
    );
  },

  /**
   * Wrong answer
   */
  wrongAnswer: async () => {
    await runPattern(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      [0, 220, 70, 220]
    );
  },

  /**
   * Start quiz or major action
   */
  startQuiz: async () => {
    await runPattern(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      [0, 180, 70, 180]
    );
  },

  sectionChanged: async () => {
    await runPattern(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      [0, 140, 60, 140, 60, 140]
    );
  },

  prepare: async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch {
      // ignore
    }
  },
};

export default AccessibilityFeedback;