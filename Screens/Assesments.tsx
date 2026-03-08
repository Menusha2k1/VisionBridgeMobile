import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStudentReport } from "../Services/api";

type LogEntry = {
  id: number;
  screen_name: string;
  user_path: string;
  prediction_label: string;
  timestamp: string;
};

const Assesments = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [totalLogs, setTotalLogs] = useState(0);

  useFocusEffect(
    useCallback(() => {
      Speech.stop();
      Speech.speak("You are now on Assessment page. Loading your reports.", {
        rate: 1,
        volume: 1.0,
      });

      const fetchReport = async () => {
        try {
          const sessionData = await AsyncStorage.getItem("student_session");
          if (!sessionData) return;

          const session = JSON.parse(sessionData);
          const studentId = session.student.id;

          const report = await getStudentReport(studentId);
          setStudentName(report.student.name);
          setTotalLogs(report.totalLogs);
          setLogs(report.logs);

          if (report.totalLogs > 0) {
            Speech.speak(
              `You have ${report.totalLogs} struggle logs recorded.`,
              { rate: 1 },
            );
          } else {
            Speech.speak("No struggle logs found. Great job!", { rate: 1 });
          }
        } catch (e) {
          console.warn("Failed to fetch report:", e);
          Speech.speak("Could not load reports. Please check your connection.");
        } finally {
          setLoading(false);
        }
      };

      fetchReport();

      return () => {
        Speech.stop();
      };
    }, []),
  );

  const getLabelColor = (label: string) => {
    if (label === "Pro") return "#4CAF50";
    if (label === "Intermediate") return "#FF9800";
    return "#F44336"; // Beginner
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#a51818" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Assessment Reports</Text>
      <Text style={styles.subHeader}>
        {studentName} — {totalLogs} log{totalLogs !== 1 ? "s" : ""}
      </Text>

      {logs.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No struggle logs recorded yet.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {logs.map((log) => (
            <View key={log.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.screenName}>{log.screen_name}</Text>
                <Text
                  style={[
                    styles.label,
                    { backgroundColor: getLabelColor(log.prediction_label) },
                  ]}
                >
                  {log.prediction_label}
                </Text>
              </View>
              <Text style={styles.path}>Gesture: {log.user_path}</Text>
              <Text style={styles.timestamp}>
                {new Date(log.timestamp).toLocaleString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default Assesments;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", paddingTop: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  subHeader: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
    marginTop: 5,
  },
  loadingText: { color: "#aaa", marginTop: 10, fontSize: 16 },
  emptyText: { color: "#888", fontSize: 18 },
  list: { flex: 1, paddingHorizontal: 15 },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#a51818",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  screenName: { color: "white", fontSize: 18, fontWeight: "bold" },
  label: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  path: { color: "#ccc", fontSize: 14, marginBottom: 4 },
  timestamp: { color: "#888", fontSize: 12 },
});
