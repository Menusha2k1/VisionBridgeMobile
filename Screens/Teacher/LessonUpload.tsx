import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";

type PickedFile = {
  name: string;
  size?: number;
  uri: string;
  mimeType?: string;
};

export default function LessonUpload() {
  const [file, setFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const sizeLabel = useMemo(() => {
    if (!file?.size) return "Unknown size";
    const kb = Math.round(file.size / 1024);
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }, [file]);

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (res.canceled) return;

    const f = res.assets?.[0];
    if (!f) return;

    setFile({
      name: f.name ?? "lesson-file",
      size: f.size,
      uri: f.uri,
      mimeType: f.mimeType,
    });
  };

  const generatePackage = async () => {
    if (!file) {
      Alert.alert("No file selected", "Please choose a lesson file first.");
      return;
    }

    setUploading(true);
    try {
      // Demo behavior: simulate content packaging
      await new Promise((r) => setTimeout(r, 900));
      Alert.alert(
        "Package generated",
        "Lesson content package is ready for mobile app consumption (demo)."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <PageHeader title="Lesson Upload" subtitle="Upload teacher lessons and generate mobile packages" />

      <View style={styles.body}>
        <Card title="Select Lesson File">
          <Text style={styles.note}>
            Supported: PDF, DOCX, TXT. This screen simulates packaging for offline mobile usage.
          </Text>

          <Button title="Choose File" onPress={pickFile} />

          <View style={styles.fileBox}>
            <Text style={styles.fileLabel}>Selected:</Text>
            <Text style={styles.fileValue}>{file ? file.name : "None"}</Text>

            <Text style={styles.fileLabel}>Type:</Text>
            <Text style={styles.fileValue}>{file?.mimeType ?? "N/A"}</Text>

            <Text style={styles.fileLabel}>Size:</Text>
            <Text style={styles.fileValue}>{file ? sizeLabel : "N/A"}</Text>
          </View>

          <Button
            title={uploading ? "Generating..." : "Generate Content Package"}
            onPress={generatePackage}
            disabled={uploading}
            variant="secondary"
          />
        </Card>

        <Card title="What gets generated (for your panel)">
          <Text style={styles.bullets}>• Lesson segments for audio-friendly playback</Text>
          <Text style={styles.bullets}>• Metadata: topic, unit, difficulty, duration</Text>
          <Text style={styles.bullets}>• Quiz mapping for topic mastery tracking</Text>
          <Text style={styles.bullets}>• Offline package export for mobile SQLite (demo)</Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, gap: 12, paddingBottom: 24 },
  note: { color: "#6b7280", marginBottom: 10, fontSize: 12, lineHeight: 16 },
  fileBox: {
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  fileLabel: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  fileValue: { fontSize: 14, color: "#111827", marginTop: 2 },
  bullets: { fontSize: 13, color: "#111827", marginTop: 6 },
});