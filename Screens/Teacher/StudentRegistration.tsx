import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import { apiRegisterStudent } from "../../Services/api";

type RootStackParamList = {
  TeacherStudentRegistration: undefined;
};

type Props = NativeStackScreenProps<
  RootStackParamList,
  "TeacherStudentRegistration"
>;

const IMPAIRMENT_OPTIONS = [
  "Fully Impaired",
  "Partially Impaired",
  "Low Vision",
  "Color Blind",
  "None",
];

export default function StudentRegistration({ navigation }: Props) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("10");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [impairmentType, setImpairmentType] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter the student name.");
      return;
    }

    try {
      const result = await apiRegisterStudent({
        name,
        grade,
        phone_number: guardianPhone,
        impairment_type: impairmentType || undefined,
      });
      Alert.alert(
        "Success",
        `Student "${name}" registered successfully.\nGenerated PIN: ${result.pin}`,
      );
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    }
  };

  return (
    <Screen>
      <PageHeader
        title="Student Registration"
        subtitle="Register a new student for VisionBridge"
      />

      <View style={styles.body}>
        <Card title="Student Details">
          <Text style={styles.label}>Student Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Eg: A. Perera"
          />

          <Text style={styles.label}>Grade</Text>
          <TextInput
            style={styles.input}
            value={grade}
            onChangeText={setGrade}
            placeholder="10 or 11"
          />

          <Text style={styles.label}>Impairment Type</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setDropdownVisible(true)}
          >
            <Text
              style={
                impairmentType ? styles.selectedText : styles.placeholderText
              }
            >
              {impairmentType || "Select impairment type"}
            </Text>
          </TouchableOpacity>

          <Modal
            visible={dropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDropdownVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setDropdownVisible(false)}
            >
              <View style={styles.dropdown}>
                <Text style={styles.dropdownTitle}>Select Impairment Type</Text>
                <FlatList
                  data={IMPAIRMENT_OPTIONS}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        item === impairmentType && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setImpairmentType(item);
                        setDropdownVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          item === impairmentType &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

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
          <Text style={styles.bullet}>
            • Weak topic detection for early intervention
          </Text>
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
  selectedText: { fontSize: 14, color: "#111827" },
  placeholderText: { fontSize: 14, color: "#9ca3af" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "80%",
    maxHeight: 300,
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dropdownItemSelected: {
    backgroundColor: "#e0e7ff",
  },
  dropdownItemText: { fontSize: 14, color: "#374151" },
  dropdownItemTextSelected: { color: "#4338ca", fontWeight: "600" },
  bullet: { fontSize: 13, color: "#111827", marginTop: 6 },
});
