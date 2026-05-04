import React, { useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import AccessibilityFeedback from "../../services/accessibilityFeedback";

type Mode = "lesson" | "quiz";

export type LessonGestureHandlers = {
  next?: () => void;
  prev?: () => void;
  repeat?: () => void;
  stop?: () => void;
};

export type QuizGestureHandlers = {
  answerA?: () => void;
  answerB?: () => void;
  answerC?: () => void;
  answerD?: () => void;
  repeat?: () => void;
  hint?: () => void;
};

type Props = {
  mode: Mode;
  lessonHandlers?: LessonGestureHandlers;
  quizHandlers?: QuizGestureHandlers;
  children: React.ReactNode;
};

/**
 * Full-screen gesture surface.
 *
 * Lesson mode:
 *  - swipe RIGHT  → next segment
 *  - swipe LEFT   → previous segment
 *  - double-tap   → repeat segment
 *  - swipe DOWN   → stop
 *
 * Quiz mode:
 *  - swipe UP     → answer A
 *  - swipe RIGHT  → answer B
 *  - swipe DOWN   → answer C
 *  - swipe LEFT   → answer D
 *  - double-tap   → repeat question
 *  - long-press   → hint
 */
export function GestureSurface({
  mode,
  lessonHandlers,
  quizHandlers,
  children,
}: Props) {
  const lastTapRef = useRef<number | null>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const doubleTapRef = useRef(false);
  const longPressTriggeredRef = useRef(false);

  const clearLongPress = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleDoubleTap = async () => {
    await AccessibilityFeedback.repeat();

    if (mode === "lesson") {
      lessonHandlers?.repeat?.();
    } else {
      quizHandlers?.repeat?.();
    }
  };

  const handleLongPress = async () => {
    if (mode === "quiz") {
      longPressTriggeredRef.current = true;
      await AccessibilityFeedback.hint();
      quizHandlers?.hint?.();
    }
  };

  const handleSwipe = async (direction: "up" | "down" | "left" | "right") => {
    if (mode === "lesson") {
      switch (direction) {
        case "right":
          await AccessibilityFeedback.navigationNext();
          lessonHandlers?.next?.();
          break;
        case "left":
          await AccessibilityFeedback.navigationPrevious();
          lessonHandlers?.prev?.();
          break;
        case "down":
          await AccessibilityFeedback.stop();
          lessonHandlers?.stop?.();
          break;
        case "up":
          // no lesson action mapped
          break;
      }
    } else {
      switch (direction) {
        case "up":
          await AccessibilityFeedback.answerA();
          quizHandlers?.answerA?.();
          break;
        case "right":
          await AccessibilityFeedback.answerB();
          quizHandlers?.answerB?.();
          break;
        case "down":
          await AccessibilityFeedback.answerC();
          quizHandlers?.answerC?.();
          break;
        case "left":
          await AccessibilityFeedback.answerD();
          quizHandlers?.answerD?.();
          break;
      }
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (_evt: GestureResponderEvent) => {
          void AccessibilityFeedback.touchStart();

          longPressTriggeredRef.current = false;

          const now = Date.now();

          if (lastTapRef.current && now - lastTapRef.current < 250) {
            doubleTapRef.current = true;
            lastTapRef.current = null;
            clearLongPress();
            void handleDoubleTap();
          } else {
            doubleTapRef.current = false;
            lastTapRef.current = now;
            clearLongPress();

            longPressTimeoutRef.current = setTimeout(() => {
              void handleLongPress();
            }, 700);
          }
        },

        onPanResponderMove: (
          _evt: GestureResponderEvent,
          gesture: PanResponderGestureState,
        ) => {
          const { dx, dy } = gesture;

          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            clearLongPress();
          }
        },

        onPanResponderRelease: async (
          _evt: GestureResponderEvent,
          gesture: PanResponderGestureState,
        ) => {
          clearLongPress();

          if (doubleTapRef.current || longPressTriggeredRef.current) {
            return;
          }

          const { dx, dy } = gesture;
          const adx = Math.abs(dx);
          const ady = Math.abs(dy);

          if (adx < 30 && ady < 30) {
            return;
          }

          if (adx > ady) {
            await handleSwipe(dx > 0 ? "right" : "left");
          } else {
            await handleSwipe(dy > 0 ? "down" : "up");
          }
        },

        onPanResponderTerminationRequest: () => true,

        onPanResponderTerminate: () => {
          clearLongPress();
        },

        onPanResponderReject: () => {
          clearLongPress();
        },
      }),
    [mode, lessonHandlers, quizHandlers],
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
