import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import { useAnalytics } from "./useAnalytics";
import { usePredictions } from "./usePredictions";
import { mlMetrics } from "../../data/mlMetrics";

export default function Reports() {
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

  const handleExport = () => {
    if (!analyticsData || !predictionData) {
      Alert.alert("No data", "Analytics data is not available yet.");
      return;
    }

    const topRiskStudent = predictionData.studentSummaries[0];

    const summary = [
      `Best Model: ${mlMetrics.bestModel}`,
      `F1-Macro: ${mlMetrics.f1Macro.toFixed(3)}`,
      `Balanced Accuracy: ${mlMetrics.balancedAccuracy.toFixed(3)}`,
      `PR-AUC: ${mlMetrics.prAuc.toFixed(3)}`,
      `Total Students: ${analyticsData.stats.totalStudents}`,
      `High Risk Students: ${predictionData.highRiskStudentCount}`,
      `Average Completion Rate: ${Math.round(analyticsData.stats.avgCompletionRate * 100)}%`,
      `Top Risk Student: ${topRiskStudent?.full_name ?? "N/A"}`,
      `Top Risk Topic: ${topRiskStudent?.most_risky_topic ?? "N/A"}`,
    ].join("\n");

    Alert.alert("Research Report Exported (Demo)", summary);
  };

  const reportRows =
    analyticsData && predictionData
      ? [
          {
            id: "1",
            title: "Best Performing Model",
            value: mlMetrics.bestModel,
            note: `F1-Macro ${mlMetrics.f1Macro.toFixed(3)} | Balanced Accuracy ${mlMetrics.balancedAccuracy.toFixed(3)}`,
          },
          {
            id: "2",
            title: "Total Registered Students",
            value: `${analyticsData.stats.totalStudents}`,
            note: "Derived from students dataset",
          },
          {
            id: "3",
            title: "High Risk Learners",
            value: `${predictionData.highRiskStudentCount}`,
            note: "Unique students predicted as high risk by the trained XGBoost classifier",
          },
          {
            id: "4",
            title: "Average Completion Rate",
            value: `${Math.round(analyticsData.stats.avgCompletionRate * 100)}%`,
            note: "Lesson completion across all student interactions",
          },
          {
            id: "5",
            title: "Average ML Risk Probability",
            value: `${Math.round(predictionData.avgProbability * 100)}%`,
            note: "Average predicted struggle probability across all records",
          },
          {
            id: "6",
            title: "Average BLDI",
            value: `${Math.round(predictionData.avgBLDI)}`,
            note: "Proposed Behavioral Learning Difficulty Index for audio learning environments",
          },
        ]
      : [];

  return (
    <Screen>
      <PageHeader
        title="Reports"
        subtitle="Research evaluation summary, prediction analytics, and intervention reporting"
      />

      <View style={styles.body}>
        {loading ? (
          <Card title="Loading Reports">
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.infoText}>
                Preparing research report analytics...
              </Text>
            </View>
          </Card>
        ) : error ? (
          <Card title="Report Error">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : analyticsData && predictionData ? (
          <>
            <Card title="Export Research Summary">
              <Text style={styles.caption}>
                This report combines learning analytics and machine learning
                prediction results to support early teacher intervention for
                visually impaired ICT learners.
              </Text>
              <View style={{ marginTop: 12 }}>
                <Button title="Export Current Report" onPress={handleExport} />
              </View>
            </Card>

            <Card title="Research Summary Table">
              <FlatList
                data={reportRows}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowNote}>{item.note}</Text>
                    </View>
                    <Text style={styles.rowValue}>{item.value}</Text>
                  </View>
                )}
              />
            </Card>

            <Card title="Highest Risk Students">
              {predictionData.studentSummaries
                .slice(0, 5)
                .map((student, index) => (
                  <View
                    key={`${student.student_id}-${index}`}
                    style={styles.topicRow}
                  >
                    <Text style={styles.topicLabel}>{student.full_name}</Text>
                    <Text style={styles.topicValue}>
                      Risk: {student.display_risk_label} | Prob:{" "}
                      {student.display_probability}% | Topic:{" "}
                      {student.most_risky_topic}
                    </Text>
                  </View>
                ))}
            </Card>

            <Card title="Panel-Facing Research Statement">
              <Text style={styles.caption}>
                The study compared Logistic Regression, Random Forest, and
                XGBoost using stratified 5-fold cross-validation. XGBoost
                achieved the best predictive performance and was selected as the
                final model. In addition, the research proposes a Behavioral
                Learning Difficulty Index (BLDI) to quantify learner struggle
                using audio interaction behaviour such as pauses, replays, seek
                backs, and completion patterns.
              </Text>
            </Card>
          </>
        ) : (
          <Card title="No Report Data">
            <Text style={styles.infoText}>
              No analytics data available for reporting.
            </Text>
          </Card>
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
  centerBox: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  rowNote: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 17,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2563eb",
  },
  sep: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  topicRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  topicValue: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 17,
  },
});
