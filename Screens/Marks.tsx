import { StyleSheet, Text, View } from "react-native";
import React, { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Speech from "expo-speech";

const Marks = () => {
  useFocusEffect(
    useCallback(() => {
      Speech.stop(); // stop previous speech
      Speech.speak("You are now on Marks page", {
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
      <Text>Marks</Text>
    </View>
  );
};

export default Marks;

const styles = StyleSheet.create({});
