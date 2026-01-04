import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Speech from "expo-speech";
import { useCallback } from "react";

const Assesments = () => {
  useFocusEffect(
    useCallback(() => {
      Speech.stop(); // stop previous speech
      Speech.speak("You are now on Assesment page", {
        rate: 1.1,
        pitch: 1.3,
        volume: 1.0,
      });

      return () => {
        Speech.stop();
      };
    }, [])
  );

  return (
    <View>
      <Text>Assesments</Text>
    </View>
  );
};

export default Assesments;

const styles = StyleSheet.create({});
