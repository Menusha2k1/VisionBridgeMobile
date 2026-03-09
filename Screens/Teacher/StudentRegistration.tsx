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
  "Total Blindness",
  "Low Vision",
];

export default function StudentRegistration({ navigation }: Props) {
  const [sid, setSID] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("10");
  const [phoneNo, setPhoneNo] = useState("");
  const [impairmentType, setImpairmentType] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const submit = async () => {
    if (!sid.trim()) {
      Alert.alert("Missing SID", "Please enter the student SID.");
      return;
    }

    try {
      const result = await apiRegisterStudent({
        name,
        grade,
        phone_number: phoneNo,
        impairment_type: impairmentType || undefined,
      });
      Alert.alert(
        "Success",
        `Student "${name}" registered successfully.\nGenerated PIN: ${result.pin}`
      );
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    }
  };

  return (
    <View style={{ flex: 1, marginTop: 60 }}>
      <PageHeader
        title="Student Registration"
        subtitle="Register a new student for VisionBridge"
      />

      <View style={styles.body}>
        <Card title="Student Details">
          <Text style={styles.label}>Student ID (SID)</Text>
          <TextInput
            style={styles.input}
            value={sid}
            onChangeText={setSID}
            placeholder="Eg: VS0001"
          />
          
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

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNo}
            onChangeText={setPhoneNo}
            placeholder="07X XXX XXXX"
            keyboardType="phone-pad"
          />

          <View style={styles.registerButtonWrap}>
            <Button title="Register" onPress={submit} />
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 16,
    backgroundColor: "#f8fafc",
    flex: 1,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.2,
  },

  input: {
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    fontSize: 15,
    color: "#0f172a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  selectedText: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },

  placeholderText: {
    fontSize: 15,
    color: "#94a3b8",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  dropdown: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    width: "100%",
    maxWidth: 360,
    maxHeight: 320,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },

  dropdownTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 14,
    textAlign: "center",
  },

  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  dropdownItemSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },

  dropdownItemText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
  },

  dropdownItemTextSelected: {
    color: "#1d4ed8",
    fontWeight: "700",
  },

  bullet: {
    fontSize: 13,
    color: "#334155",
    marginTop: 8,
    lineHeight: 20,
  },

  registerButtonWrap: {
    marginTop: 16,
  },
});