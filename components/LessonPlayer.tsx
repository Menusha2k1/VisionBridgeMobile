import React, { useEffect, useRef, useState } from "react";
import { View, PanResponder, StyleSheet, Text } from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { LESSON_AUDIO_MAP } from "../data/lessonAudioMap";

type Props = NativeStackScreenProps<RootStackParamList, "LessonPlayer">;

export default function LessonPlayer({ route }: Props) {
  const { subTopicId, title } = route.params;

  const soundRef = useRef<Audio.Sound | null>(null);
  const lastTap = useRef(0);
  const tapCount = useRef(0);
  const isActionLocked = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);

  const audioSource = LESSON_AUDIO_MAP[subTopicId];
  const instructionsSpoken = useRef(false);

  useEffect(() => {
    if (!audioSource) {
      Speech.stop();
      Speech.speak("Audio not found.");
      return;
    }

    loadAudio();

    if (!instructionsSpoken.current) {
      Speech.speak(`${title} loaded. Swipe up or down for volume.`);
      instructionsSpoken.current = true;
    }

    return () => {
      soundRef.current?.unloadAsync();
      Speech.stop();
    };
  }, [audioSource]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  };

  const loadAudio = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        typeof audioSource === "string" ? { uri: audioSource } : audioSource,
        { shouldPlay: false, volume: 1.0 },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
    } catch (error) {
      Speech.speak("Failed to load audio.");
    }
  };

  const handleSpeech = (text: string) => {
    Speech.stop(); // Stop any current speech before starting new one
    Speech.speak(text);
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      handleSpeech("Paused");
    } else {
      await soundRef.current.playAsync();
      handleSpeech("Playing");
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const restartLesson = async () => {
    if (!soundRef.current) return;
    await soundRef.current.setPositionAsync(0);
    await soundRef.current.playAsync();
    handleSpeech("Restarting lesson");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const skip = async (seconds: number) => {
    if (!soundRef.current || isActionLocked.current) return;
    isActionLocked.current = true;

    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    const newPos = Math.max(0, status.positionMillis + seconds * 1000);
    await soundRef.current.setPositionAsync(newPos);
    handleSpeech(seconds > 0 ? "Forward 5 seconds" : "Backward 5 seconds");
  };

  const adjustVolume = async (direction: "up" | "down") => {
    if (!soundRef.current || isActionLocked.current) return;
    isActionLocked.current = true;

    let newVol = direction === "up" ? volume + 0.1 : volume - 0.1;
    newVol = Math.min(1, Math.max(0, newVol));

    setVolume(newVol);
    await soundRef.current.setVolumeAsync(newVol);
    handleSpeech(direction === "up" ? "Volume up" : "Volume down");
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        const now = Date.now();
        if (now - lastTap.current < 400) {
          tapCount.current += 1;
        } else {
          tapCount.current = 1;
        }
        lastTap.current = now;

        setTimeout(() => {
          if (tapCount.current === 2) togglePlayPause();
          if (tapCount.current === 3) restartLesson();
          tapCount.current = 0;
        }, 300);
      },

      onPanResponderMove: (_, gesture) => {
        // Horizontal Swipes
        if (gesture.dx > 80) skip(5); // Swipe Right -> Forward
        if (gesture.dx < -80) skip(-5); // Swipe Left -> Backward

        // Vertical Swipes
        if (gesture.dy < -80) adjustVolume("up");
        if (gesture.dy > 80) adjustVolume("down");
      },

      onPanResponderRelease: () => {
        isActionLocked.current = false;
      },
    })
  ).current;

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.centerControl}>
        <Ionicons
          name={isPlaying ? "pause-circle" : "play-circle"}
          size={250}
          color="#740f0cff"
        />
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${duration > 0 ? (position / duration) * 100 : 0}%` },
            ]}
          />
        </View>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.instructions}>
          Swipe Right to Skip Forward{"\n"}
          Swipe Up/Down for Volume
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 25,
  },
  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  centerControl: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timerContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  timeText: {
    color: "#740f0cff",
    fontSize: 14,
    width: 45,
    textAlign: "center",
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#333",
    marginHorizontal: 10,
    borderRadius: 3,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#740f0cff",
    borderRadius: 3,
  },
  footer: {
    height: 60,
    justifyContent: "center",
  },
  instructions: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
