import { StyleSheet, Text, View } from "react-native";
import React from "react";

const Grades = () => {
  return (
    <View>
      <View style={styles.gradeContainer}>
        <Text style={styles.gradeText}>Grade 10</Text>
      </View>
      <View style={styles.gradeContainer}>
        <Text style={styles.gradeText}>Grade 11</Text>
      </View>
    </View>
  );
};

export default Grades;

const styles = StyleSheet.create({
  gradeContainer: {
    backgroundColor: "#711a1aff",
    padding: 20,
    marginBottom: 10,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
  },

  gradeText: {
    color: "white",
    fontSize: 25,
    fontWeight: "700",
    textAlign: "center",
  },
});
