import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import { useAnalytics } from "./useAnalytics";
import { usePredictions } from "./usePredictions";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherStudents">;

export default function Students({ navigation }: Props) {
  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics();

  const {
    data: predictionData,
    loading: predictionLoading,
    error: predictionError,
  } = usePredictions();

  const loading = analyticsLoading || predictionLoading;
  const error = analyticsError || predictionError;

  const enrichedStudents =
    analyticsData?.students.map((student) => {
      const studentLessons = analyticsData.lessons.filter(
        (lesson) => lesson.student_id === student.student_id,
      );

      const attempts = studentLessons.length;

      const avgCompletion =
        studentLessons.reduce(
          (sum, lesson) => sum + lesson.completion_rate,
          0,
        ) / Math.max(studentLessons.length, 1);

      const avgListenTime =
        studentLessons.reduce(
          (sum, lesson) => sum + lesson.total_listen_time_sec,
          0,
        ) / Math.max(studentLessons.length, 1);

      const prediction = predictionData?.studentSummaries.find(
        (p) => p.student_id === student.student_id,
      );

      return {
        ...student,
        attempts,
        avgCompletion: Math.round(avgCompletion * 100),
        avgListenTimeMin: Math.round((avgListenTime / 60) * 10) / 10,
        riskLevel: prediction?.risk_level ?? "LOW",
        riskProbability: prediction?.display_probability ?? 0,
        displayRiskLabel: prediction?.display_risk_label ?? "LOW",
        riskyTopic: prediction?.most_risky_topic ?? "N/A",
        bldi: prediction?.max_bldi ?? 0,
        bldiBand: prediction?.bldi_band ?? "LOW",
      };
    }) ?? [];

  const getRiskBadgeStyle = (risk: string) => {
    if (risk === "HIGH") return [styles.badge, styles.badgeHigh];
    if (risk === "MEDIUM") return [styles.badge, styles.badgeMedium];
    return [styles.badge, styles.badgeLow];
  };

  const getRiskTextStyle = (risk: string) => {
    if (risk === "HIGH") return styles.badgeTextHigh;
    if (risk === "MEDIUM") return styles.badgeTextMedium;
    return styles.badgeTextLow;
  };

  return (
    <Screen>
      <PageHeader
        title="Students"
        subtitle="Manage student accounts and monitor activity"
      />

      <View style={styles.body}>
        <Card title="Actions">
          <View style={{ height: 10 }} />
          <Button
            title="View Weak Topics"
            variant="secondary"
            onPress={() => navigation.navigate("TeacherWeakTopics")}
          />
        </Card>

        <Card title="Student List">
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.infoText}>
                Loading student analytics and ML predictions...
              </Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : enrichedStudents.length ? (
            <FlatList
              data={enrichedStudents}
              keyExtractor={(item) => item.student_id}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.row} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.full_name}</Text>
                    <Text style={styles.meta}>
                      Grade: {item.grade ?? "N/A"} • Type:{" "}
                      {item.visually_impaired_type}
                    </Text>
                    <Text style={styles.meta}>
                      Lessons: {item.attempts} • Avg Completion:{" "}
                      {item.avgCompletion}%
                    </Text>
                    <Text style={styles.meta}>
                      Avg Listen Time: {item.avgListenTimeMin} min
                    </Text>
                    <Text style={styles.meta}>
                      Risk Topic: {item.riskyTopic} • ML Probability:{" "}
                      {item.riskProbability}% • Label: {item.displayRiskLabel}
                    </Text>
                    <Text style={styles.meta}>
                      BLDI: {item.bldi} • BLDI Band: {item.bldiBand}
                    </Text>
                  </View>

                  <View style={styles.rightBlock}>
                    <View style={getRiskBadgeStyle(item.riskLevel)}>
                      <Text style={getRiskTextStyle(item.riskLevel)}>
                        {item.displayRiskLabel}
                      </Text>
                    </View>
                    <Text style={styles.chev}>›</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.infoText}>
              No students found in the dataset.
            </Text>
          )}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rightBlock: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 3,
    lineHeight: 17,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    minWidth: 70,
    alignItems: "center",
  },
  badgeHigh: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
  },
  badgeMedium: {
    backgroundColor: "#fef3c7",
    borderColor: "#fde68a",
  },
  badgeLow: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
  },
  badgeTextHigh: {
    color: "#b91c1c",
    fontWeight: "800",
    fontSize: 11,
  },
  badgeTextMedium: {
    color: "#92400e",
    fontWeight: "800",
    fontSize: 11,
  },
  badgeTextLow: {
    color: "#166534",
    fontWeight: "800",
    fontSize: 11,
  },
  chev: {
    fontSize: 24,
    color: "#9ca3af",
    paddingLeft: 10,
  },
  sep: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  centerBox: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    lineHeight: 18,
  },
});
