import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherStudentsList">;

export default function StudentsList({ navigation }: Props) {
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
            onPress={() => navigation.navigate("TeacherStudentRegistration")}
          />
          <View style={{ height: 10 }} />
        </Card>

        <Card title="Student List">
            <Text style={styles.infoText}>
              No students found in the database.
            </Text>
        </Card>
      </View>
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
});
