import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import BarChart from "./components/charts/BarChart";
import { useAnalytics } from "./useAnalytics";
import { usePredictions } from "./usePredictions";

export default function WeakTopics() {
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useAnalytics();
  const { data: predictionData, loading: predictionLoading, error: predictionError } = usePredictions();

  const [index, setIndex] = useState(0);

  const loading = analyticsLoading || predictionLoading;
  const error = analyticsError || predictionError;

  const students = analyticsData?.students ?? [];
  const safeIndex = students.length ? index % students.length : 0;
  const student = students[safeIndex];

  const topicData = useMemo(() => {
    if (!student || !predictionData) return [];

    const relatedRows = predictionData.rows.filter((row) => row.student_id === student.student_id);

    const topicMap: Record<string, { sum: number; count: number }> = {};

    for (const row of relatedRows) {
      const topic = row.topic || "Unknown";
      if (!topicMap[topic]) {
        topicMap[topic] = { sum: 0, count: 0 };
      }
      topicMap[topic].sum += row.difficulty_probability;
      topicMap[topic].count += 1;
    }

    return Object.entries(topicMap)
      .map(([label, stats]) => ({
        label: label.length > 6 ? label.slice(0, 6).toUpperCase() : label.toUpperCase(),
        value: Math.round((stats.sum / stats.count) * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [student, predictionData]);

  const studentRiskSummary = predictionData?.studentSummaries.find(
    (s) => s.student_id === student?.student_id
  );

  const next = () => {
    if (!students.length) return;
    setIndex((v) => (v + 1) % students.length);
  };

  const prev = () => {
    if (!students.length) return;
    setIndex((v) => (v === 0 ? students.length - 1 : v - 1));
  };

  return (
    <Screen>
      <PageHeader
        title="Weak Topics"
        subtitle="Student-specific topic risk analysis using machine learning predictions"
      />

      <View style={styles.body}>
        {loading ? (
          <Card title="Loading">
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.infoText}>Loading topic-level prediction analytics...</Text>
            </View>
          </Card>
        ) : error ? (
          <Card title="Analytics Error">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : !student ? (
          <Card title="No Students">
            <Text style={styles.infoText}>No student records available.</Text>
          </Card>
        ) : (
          <>
            <Card title="Selected Student">
              <Text style={styles.name}>{student.full_name}</Text>
              <Text style={styles.meta}>
                Grade {student.grade} • {student.visually_impaired_type}
              </Text>
              <Text style={styles.meta}>
                Risk Level: {studentRiskSummary?.risk_level ?? "LOW"} • Probability:{" "}
                {studentRiskSummary ? Math.round(studentRiskSummary.max_probability * 100) : 0}%
              </Text>
              <Text style={styles.meta}>
                Most Risky Topic: {studentRiskSummary?.most_risky_topic ?? "N/A"}
              </Text>

              <View style={styles.row}>
                <Button title="Prev" variant="ghost" onPress={prev} />
                <Button title="Next" variant="ghost" onPress={next} />
              </View>
            </Card>

            <Card title="Topic Risk by Student">
              {topicData.length ? (
                <BarChart data={topicData} />
              ) : (
                <Text style={styles.empty}>No topic-level analytics available for this student.</Text>
              )}
              <Text style={styles.caption}>
                Topic values represent average predicted difficulty probability for the selected learner.
              </Text>
            </Card>

            <Card title="Teacher Interpretation">
              <Text style={styles.caption}>
                Higher topic risk suggests repeated struggle patterns, including pauses, replays, seek-backs, and
                lower completion performance. These students should receive revision support and targeted lesson review.
              </Text>
            </Card>
          </>
        )}
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
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 17,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  empty: {
    color: "#6b7280",
    fontSize: 13,
    paddingVertical: 8,
  },
  caption: {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  centerBox: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    lineHeight: 18,
  },
});