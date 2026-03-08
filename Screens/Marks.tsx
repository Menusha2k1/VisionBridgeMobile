import { StyleSheet, Text, View } from "react-native";
import React, { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Speech from "expo-speech";
import commands from "../components/commands";
import { useSpeechSettings } from "../Context/SpeechContext";

const Marks = () => {
  const { globalRate } = useSpeechSettings();
  useFocusEffect(
    useCallback(() => {
      Speech.stop(); // stop previous speech
      Speech.speak(commands.Marks, {
        rate: globalRate,
        pitch: 1.3,
        volume: 1.0,
      });

      return () => {
        Speech.stop();
      };
    }, []),
  );
  return (
    <View>
      <Text>Marks</Text>
    </View>
  );
};

export default Marks;

const styles = StyleSheet.create({});
