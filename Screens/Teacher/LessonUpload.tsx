import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert, TextInput, Platform, ScrollView } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";

type PickedFile = {
  name: string;
  size?: number;
  uri: string;
  mimeType?: string;
  webFile?: any;
};

export default function LessonUpload() {

  const [file, setFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scriptText, setScriptText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ⭐ NEW STATES
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(5);

  const [savedScripts, setSavedScripts] = useState<
    { id: number; title: string; source_filename?: string | null; created_at: string }[]
  >([]);

  const sizeLabel = useMemo(() => {
    if (!file?.size) return "Unknown size";
    const kb = Math.round(file.size / 1024);
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }, [file]);

  const baseUrl =
    Platform.OS === "web"
      ? "http://localhost:3000"
      : "http://10.0.2.2:3000";

  const pickFile = async () => {

    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (res.canceled) return;

    const f: any = res.assets?.[0];
    if (!f) return;

    setFile({
      name: f.name,
      size: f.size,
      uri: f.uri,
      mimeType: f.mimeType,
      webFile: f.file,
    });
  };

  const refreshSavedScripts = async () => {

    try {

      const res = await fetch(`${baseUrl}/api/teacher-scripts`);

      if (!res.ok) return;

      const json = await res.json();

      if (Array.isArray(json.scripts)) {

        setSavedScripts(json.scripts);

      }

    } catch { }

  };

  useEffect(() => {
    refreshSavedScripts();
  }, []);

  // ⭐ UPDATED FUNCTION
  const generatePackage = async () => {

    if (!file) {
      Alert.alert("No file selected");
      return;
    }

    if (startPage > endPage) {
      Alert.alert("Invalid page range");
      return;
    }

    setUploading(true);

    try {

      const formData = new FormData();

      if (Platform.OS === "web" && file.webFile) {

        formData.append("lessonFile", file.webFile);

      } else {

        formData.append("lessonFile", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/pdf",
        } as any);

      }

      // ⭐ SEND PAGE RANGE
      formData.append("startPage", String(startPage));
      formData.append("endPage", String(endPage));

      const response = await fetch(
        `${baseUrl}/api/teacher-script`,
        {
          method: "POST",
          body: formData,
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.script) {

        throw new Error(
          json?.error ||
          "Failed to generate script"
        );

      }

      setScriptText(json.script);
      setIsEditing(false);

      Alert.alert(
        "Script Generated",
        "You can edit below."
      );

    } catch (err: any) {

      Alert.alert(
        "Generation Failed",
        err.message
      );

    } finally {

      setUploading(false);

    }

  };

  const handleDownloadScript = async () => {

    if (!scriptText) return;

    const filename =
      (file?.name || "script")
        .replace(/\.[^.]+$/, "") + ".txt";

    if (Platform.OS === "web") {

      const blob = new Blob(
        [scriptText],
        { type: "text/plain" }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);

    } else {

      const fileUri =
        FileSystem.documentDirectory +
        filename;

      await FileSystem.writeAsStringAsync(
        fileUri,
        scriptText
      );

      Alert.alert(
        "Saved",
        fileUri
      );

    }

  };

  return (

    <Screen>

      <PageHeader
        title="Lesson Upload"
        subtitle="Generate teacher narration scripts"
      />

      <ScrollView
        contentContainerStyle={styles.body}
      >

        <Card title="Select Lesson File">

          <Button
            title="Choose File"
            onPress={pickFile}
          />

          <View style={styles.fileBox}>

            <Text style={styles.fileLabel}>
              Selected:
            </Text>

            <Text style={styles.fileValue}>
              {file ? file.name : "None"}
            </Text>

            <Text style={styles.fileLabel}>
              Size:
            </Text>

            <Text style={styles.fileValue}>
              {file ? sizeLabel : "N/A"}
            </Text>

          </View>

          {/* ⭐ PAGE RANGE INPUTS */}

          <View style={styles.pageRow}>

            <View style={styles.pageBox}>

              <Text>Start Page</Text>

              <TextInput
                style={styles.pageInput}
                keyboardType="numeric"
                value={String(startPage)}
                onChangeText={(t) =>
                  setStartPage(Number(t))
                }
              />

            </View>

            <View style={styles.pageBox}>

              <Text>End Page</Text>

              <TextInput
                style={styles.pageInput}
                keyboardType="numeric"
                value={String(endPage)}
                onChangeText={(t) =>
                  setEndPage(Number(t))
                }
              />

            </View>

          </View>

          <Button
            title={
              uploading
                ? "Generating..."
                : "Generate Teacher's Script"
            }
            onPress={generatePackage}
          />

          {/* ⭐ SCRIPT DISPLAY */}

          {scriptText && (

            <View style={{ marginTop: 20 }}>

              <Text>
                Generated Script
              </Text>

              <TextInput
                style={styles.scriptInput}
                multiline
                value={scriptText}
                editable={isEditing}
                onChangeText={setScriptText}
              />

              <View style={styles.saveRow}>

                <Button
                  title={
                    isEditing
                      ? "Done Editing"
                      : "Edit Script"
                  }
                  onPress={() =>
                    setIsEditing(!isEditing)
                  }
                />

                <Button
                  title="Download"
                  onPress={
                    handleDownloadScript
                  }
                />

              </View>

            </View>

          )}

        </Card>

      </ScrollView>

    </Screen>

  );

}

const styles = StyleSheet.create({

  body: {
    padding: 16
  },

  fileBox: {
    marginTop: 10
  },

  fileLabel: {
    fontSize: 12
  },

  fileValue: {
    fontSize: 14
  },

  pageRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 10
  },

  pageBox: {
    flex: 1
  },

  pageInput: {
    borderWidth: 1,
    padding: 6,
    borderRadius: 6,
    marginTop: 4
  },

  scriptInput: {
    borderWidth: 1,
    marginTop: 10,
    minHeight: 220,
    padding: 10,
    borderRadius: 10
  },

  saveRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  }

});