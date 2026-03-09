import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherSettings">;

export default function Settings({}: Props) {
  const [weakTopicAlerts, setWeakTopicAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [offlinePackaging, setOfflinePackaging] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);

  const handleSave = () => {
    Alert.alert("Settings Saved", "Teacher dashboard preferences updated successfully.");
  };

  return (
    <Screen>
      <PageHeader
        title="Settings"
        subtitle="Configure teacher dashboard behaviour and research analytics preferences"
      />

      <View style={styles.body}>
        <Card title="Teacher Preferences">
          <View style={styles.row}>
            <View style={styles.textBlock}>
              <Text style={styles.label}>Weak Topic Alerts</Text>
              <Text style={styles.meta}>
                Notify teachers when learners repeatedly struggle with specific topics
              </Text>
            </View>
            <Switch value={weakTopicAlerts} onValueChange={setWeakTopicAlerts} />
          </View>

          <View style={styles.row}>
            <View style={styles.textBlock}>
              <Text style={styles.label}>Weekly Research Reports</Text>
              <Text style={styles.meta}>
                Generate weekly analytics summaries for model-driven learner monitoring
              </Text>
            </View>
            <Switch value={weeklyReports} onValueChange={setWeeklyReports} />
          </View>

          <View style={styles.row}>
            <View style={styles.textBlock}>
              <Text style={styles.label}>Offline Content Packaging</Text>
              <Text style={styles.meta}>
                Prepare lesson content for offline student app delivery
              </Text>
            </View>
            <Switch value={offlinePackaging} onValueChange={setOfflinePackaging} />
          </View>

          <View style={styles.row}>
            <View style={styles.textBlock}>
              <Text style={styles.label}>Audio Feedback Support</Text>
              <Text style={styles.meta}>
                Enable spoken confirmations and accessible interaction support
              </Text>
            </View>
            <Switch value={audioFeedback} onValueChange={setAudioFeedback} />
          </View>

          <View style={styles.buttonWrap}>
            <Button title="Save Settings" onPress={handleSave} />
          </View>
        </Card>

        <Card title="Research Configuration Summary">
          <Text style={styles.summaryText}>
            The teacher dashboard integrates machine learning predictions to identify at-risk learners,
            monitor weak topics, and support early intervention for visually impaired ICT students.
          </Text>
          <Text style={styles.summaryText}>
            Settings in this panel control how predictive analytics and teacher notifications are surfaced
            during system use and demonstration.
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 17,
  },
  buttonWrap: {
    marginTop: 14,
  },
  summaryText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
    marginTop: 6,
  },
});