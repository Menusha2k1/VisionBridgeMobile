import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import StatCard from "./components/ui/StatCard";
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import BarChart from "./components/charts/BarChart";
import LineChart from "./components/charts/LineChart";
import { useAnalytics } from "./useAnalytics";
import { usePredictions } from "./usePredictions";
import {
  mlMetrics,
  modelComparison,
  researchHighlights,
} from "../../data/mlMetrics";

type RootStackParamList = {
  TeacherDashboard: undefined;
  TeacherLessonUpload: undefined;
  TeacherStudents: undefined;
  TeacherReports: undefined;
  TeacherWeakTopics: undefined;
  TeacherSettings: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "TeacherDashboard">;

export default function Dashboard({ navigation }: Props) {
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

  const engagementSeries =
    analyticsData?.lessons.slice(0, 7).map((lesson, index) => ({
      label: `L${index + 1}`,
      value: Math.round(lesson.total_listen_time_sec / 60),
    })) ?? [];

  const riskDistribution = predictionData
    ? [
        { label: "HIGH", value: predictionData.highRiskStudentCount },
        { label: "MED", value: predictionData.mediumRiskStudentCount },
        { label: "LOW", value: predictionData.lowRiskStudentCount },
      ]
    : [];

  const topStudents = predictionData?.studentSummaries.slice(0, 5) ?? [];

  return (
    <View style={{ flex: 1, marginTop: 40 }}>
      <PageHeader
        title="Teacher Dashboard"
        subtitle="AI-powered learning analytics for visually impaired ICT learners"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>
              Loading research analytics and ML predictions...
            </Text>
          </View>
        ) : error ? (
          <Card title="Dashboard Error">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : analyticsData && predictionData ? (
          <>
            <View style={styles.grid}>
              <StatCard
                label="Total Students"
                value={String(analyticsData.stats.totalStudents)}
                helper="Registered learners"
              />
              <StatCard
                label="High Risk Students"
                value={String(predictionData.highRiskStudentCount)}
                helper="Unique learners predicted high risk"
              />
              <StatCard
                label="Avg Risk Prob."
                value={`${Math.round(predictionData.avgProbability * 100)}%`}
                helper="Across all lesson records"
              />
              <StatCard
                label="Avg Completion"
                value={`${Math.round(analyticsData.stats.avgCompletionRate * 100)}%`}
                helper="Lesson completion performance"
              />
              <StatCard
                label="Avg BLDI"
                value={String(Math.round(predictionData.avgBLDI))}
                helper="Behavioral difficulty index"
              />
            </View>

            <Card title="Quick Actions">
              <View style={styles.actions}>
                <Button
                  title="Lesson Upload"
                  onPress={() => navigation.navigate("TeacherLessonUpload")}
                />
                <Button
                  title="Students"
                  variant="secondary"
                  onPress={() => navigation.navigate("TeacherStudents")}
                />
                <Button
                  title="Reports"
                  variant="secondary"
                  onPress={() => navigation.navigate("TeacherReports")}
                />
                <Button
                  title="Weak Topics"
                  variant="secondary"
                  onPress={() => navigation.navigate("TeacherWeakTopics")}
                />
                <Button
                  title="Settings"
                  variant="ghost"
                  onPress={() => navigation.navigate("TeacherSettings")}
                />
              </View>
            </Card>

            <Card title="ML Research Summary">
              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Best Model</Text>
                  <Text style={styles.metricValue}>{mlMetrics.bestModel}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>F1-Macro</Text>
                  <Text style={styles.metricValue}>
                    {mlMetrics.f1Macro.toFixed(3)}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Bal. Accuracy</Text>
                  <Text style={styles.metricValue}>
                    {mlMetrics.balancedAccuracy.toFixed(3)}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>PR-AUC</Text>
                  <Text style={styles.metricValue}>
                    {mlMetrics.prAuc.toFixed(3)}
                  </Text>
                </View>
              </View>
              <Text style={styles.caption}>
                The model predicts learner difficulty using behavioural
                audio-learning signals such as pause frequency, replay
                behaviour, seek-back time, and completion rate.
              </Text>
            </Card>

            <Card title="Novelty Metric: BLDI">
              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Metric</Text>
                  <Text style={styles.metricValue}>BLDI</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Average Score</Text>
                  <Text style={styles.metricValue}>
                    {Math.round(predictionData.avgBLDI)}
                  </Text>
                </View>
              </View>
              <Text style={styles.caption}>
                The Behavioral Learning Difficulty Index is a composite score
                derived from pauses, replays, seek back behaviour, and
                completion gap. Higher values indicate greater struggle in audio
                based learning.
              </Text>
            </Card>

            <Card title="Model Comparison (F1-Macro %)">
              <BarChart data={modelComparison} />
              <Text style={styles.caption}>
                XGBoost achieved the strongest overall performance among the
                three evaluated models.
              </Text>
            </Card>

            <Card title="Risk Distribution">
              <BarChart data={riskDistribution} />
              <Text style={styles.caption}>
                This chart summarizes the number of HIGH, MEDIUM, and LOW
              </Text>
            </Card>

            <Card title="Top Risk Topics">
              <BarChart data={predictionData.topRiskTopics} />
              <Text style={styles.caption}>
                Topic-level risk is derived from average predicted difficulty
                probability across lesson interactions.
              </Text>
            </Card>

            <Card title="Lesson Engagement Sample (minutes)">
              {engagementSeries.length ? (
                <LineChart data={engagementSeries} />
              ) : (
                <Text style={styles.emptyText}>
                  No lesson engagement data available.
                </Text>
              )}
              <Text style={styles.caption}>
                Listening-time patterns provide additional insight into learner
                engagement and revision behaviour.
              </Text>
            </Card>

            <Card title="Students Needing Immediate Attention">
              {topStudents.length ? (
                topStudents.map((student, index) => (
                  <View
                    key={`${student.student_id}-${index}`}
                    style={styles.studentRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>
                        {student.full_name}
                      </Text>
                      <Text style={styles.studentMeta}>
                        Grade {student.grade ?? "N/A"} • Risk Topic:{" "}
                        {student.most_risky_topic} • BLDI: {student.max_bldi} •{" "}
                        {student.display_risk_label}
                      </Text>
                    </View>
                    <View style={styles.riskBadgeHigh}>
                      <Text style={styles.riskBadgeText}>
                        {student.display_probability}%
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No high-risk students available.
                </Text>
              )}
            </Card>

            <Card title="Research Highlights">
              {researchHighlights.map((item, idx) => (
                <Text key={idx} style={styles.bullet}>
                  • {item}
                </Text>
              ))}
            </Card>
          </>
        ) : (
          <Card title="No Data">
            <Text style={styles.emptyText}>
              No analytics or ML prediction data available.
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actions: {
    gap: 10,
    paddingTop: 6,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 13,
    color: "#6b7280",
    paddingVertical: 8,
  },
  caption: {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricBox: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
  },
  metricValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  studentMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  riskBadgeHigh: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  riskBadgeText: {
    color: "#b91c1c",
    fontWeight: "800",
    fontSize: 12,
  },
  bullet: {
    fontSize: 13,
    color: "#111827",
    lineHeight: 19,
    marginTop: 6,
  },
});
