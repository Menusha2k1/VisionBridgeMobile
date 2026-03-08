import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";

type RootStackParamList = {
  TeacherStudentRegistration: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "TeacherStudentRegistration">;

export default function StudentRegistration({ navigation }: Props) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("10");
  const [guardianPhone, setGuardianPhone] = useState("");

  const submit = () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter the student name.");
      return;
    }

    Alert.alert(
      "Student Registered (demo)",
      `Name: ${name}\nGrade: ${grade}\nGuardian: ${guardianPhone || "N/A"}`
    );

    navigation.goBack();
  };

  return (
    <Screen>
      <PageHeader title="Student Registration" subtitle="Register a new student for VisionBridge" />

      <View style={styles.body}>
        <Card title="Student Details">
          <Text style={styles.label}>Student Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Eg: A. Perera" />

          <Text style={styles.label}>Grade</Text>
          <TextInput style={styles.input} value={grade} onChangeText={setGrade} placeholder="10 or 11" />

          <Text style={styles.label}>Guardian Phone</Text>
          <TextInput
            style={styles.input}
            value={guardianPhone}
            onChangeText={setGuardianPhone}
            placeholder="07X XXX XXXX"
            keyboardType="phone-pad"
          />

          <Button title="Register" onPress={submit} />
        </Card>

        <Card title="Captured Analytics (later)">
          <Text style={styles.bullet}>• Quiz attempts and average score</Text>
          <Text style={styles.bullet}>• Completion time patterns</Text>
          <Text style={styles.bullet}>• Weak topic detection for early intervention</Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, gap: 12, paddingBottom: 24 },
  label: { fontSize: 12, color: "#6b7280", marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  bullet: { fontSize: 13, color: "#111827", marginTop: 6 },
});