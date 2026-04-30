import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import type { RootStackParamList } from "../../App";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import {
  apiDeleteStudent,
  apiGetAllStudents,
  apiUpdateStudent,
} from "../../Services/api";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherStudentsList">;

type Student = {
  id: number;
  name: string;
  pin: string;
  grade: string;
  phone_number?: string | null;
  impairment_type?: string | null;
};

export default function StudentsList({ navigation }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editImpairment, setEditImpairment] = useState("");

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetAllStudents();
      setStudents(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [loadStudents]),
  );

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setEditName(student.name);
    setEditGrade(student.grade);
    setEditPhone(student.phone_number || "");
    setEditImpairment(student.impairment_type || "");
  };

  const closeEditModal = () => {
    setSelectedStudent(null);
    setEditName("");
    setEditGrade("");
    setEditPhone("");
    setEditImpairment("");
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;
    if (!editName.trim() || !editGrade.trim()) {
      Alert.alert("Missing details", "Name and grade are required.");
      return;
    }

    try {
      setSaving(true);
      await apiUpdateStudent(selectedStudent.id, {
        name: editName.trim(),
        grade: editGrade.trim(),
        phone_number: editPhone.trim(),
        impairment_type: editImpairment.trim(),
      });
      closeEditModal();
      await loadStudents();
      Alert.alert("Updated", "Student details updated successfully.");
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteStudent = (student: Student) => {
    Alert.alert(
      "Delete student",
      `Are you sure you want to delete ${student.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteStudent(student.id);
              await loadStudents();
              Alert.alert("Deleted", "Student removed successfully.");
            } catch (err: any) {
              Alert.alert(
                "Delete failed",
                err?.message || "Failed to delete student",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <PageHeader
        title="Students"
        subtitle="Manage student accounts"
      />

      <View style={styles.body}>
        <Card title="Actions">
          <Button
            title="Register Student"
            iconName="account-plus-outline"
            onPress={() => navigation.navigate("TeacherStudentRegistration")}
          />
          <View style={{ height: 10 }} />
        </Card>

        <Card title="Student List">
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.infoText}>Loading registered students...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : students.length ? (
            <FlatList
              data={students}
              keyExtractor={(item) => String(item.id)}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>
                      ID: {item.id} • PIN: {item.pin} • Grade: {item.grade}
                    </Text>
                    <Text style={styles.meta}>
                      Phone: {item.phone_number || "N/A"} • Impairment: {item.impairment_type || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDeleteStudent(item)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          ) : (
            <Text style={styles.infoText}>
              No students found in the database.
            </Text>
          )}
        </Card>
      </View>

      <Modal
        visible={!!selectedStudent}
        animationType="slide"
        transparent
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Student</Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Student name"
            />

            <Text style={styles.fieldLabel}>Grade</Text>
            <TextInput
              style={styles.fieldInput}
              value={editGrade}
              onChangeText={setEditGrade}
              placeholder="Grade"
            />

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.fieldInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="07X XXX XXXX"
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Impairment Type</Text>
            <TextInput
              style={styles.fieldInput}
              value={editImpairment}
              onChangeText={setEditImpairment}
              placeholder="Impairment type"
            />

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={closeEditModal} />
              <Button
                title={saving ? "Saving..." : "Save"}
                onPress={handleUpdateStudent}
                disabled={saving}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    marginTop: 10,
    lineHeight: 18,
  },
  centerBox: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowLeft: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 17,
  },
  sep: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  rowActions: {
    marginLeft: 12,
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#e0e7ff",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editBtnText: {
    color: "#3730a3",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteBtn: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteBtnText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 8,
    marginBottom: 6,
    fontWeight: "700",
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
  modalActions: {
    marginTop: 14,
    gap: 10,
  },
});
