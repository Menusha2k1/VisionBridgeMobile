import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, StyleSheet, Alert, TextInput, Platform, ScrollView, Modal, TouchableOpacity, FlatList } from "react-native";
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

  // ⭐ BOOKMARK STATES
  const [fileBookmarks, setFileBookmarks] = useState<any[]>([]);
  const [allBookmarks, setAllBookmarks] = useState<any[]>([]);
  const [showAllModal, setShowAllModal] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

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

    // Fetch bookmarks for this new file
    fetchFileBookmarks(f.name);
  };

  const fetchFileBookmarks = async (filename: string) => {
    try {
      const res = await fetch(`${baseUrl}/api/bookmarks/${encodeURIComponent(filename)}`);
      if (res.ok) {
        const json = await res.json();
        const list = json.bookmarks || [];
        setFileBookmarks(list);
        // Cache locally
        await AsyncStorage.setItem(`bookmarks_${filename}`, JSON.stringify(list));
      } else {
        throw new Error("Backend unavailable");
      }
    } catch (err) {
      console.log("Fetch failed, trying local cache...");
      const cached = await AsyncStorage.getItem(`bookmarks_${filename}`);
      if (cached) {
        setFileBookmarks(JSON.parse(cached));
      }
    }
  };

  const fetchAllBookmarks = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/bookmarks/all`);
      if (res.ok) {
        const json = await res.json();
        const list = json.bookmarks || [];
        setAllBookmarks(list);
        setShowAllModal(true);
        // Cache locally
        await AsyncStorage.setItem('all_bookmarks', JSON.stringify(list));
      } else {
        throw new Error("Backend unavailable");
      }
    } catch (err) {
      console.log("Fetch all failed, trying local cache...");
      const cached = await AsyncStorage.getItem('all_bookmarks');
      if (cached) {
        setAllBookmarks(JSON.parse(cached));
        setShowAllModal(true);
      } else {
        Alert.alert("Offline", "No bookmarked scripts found in local cache.");
      }
    }
  };

  const handleSaveBookmark = async () => {
    if (!scriptText || !file) return;

    setBookmarking(true);
    try {
      const res = await fetch(`${baseUrl}/api/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceFilename: file.name,
          startPage,
          endPage,
          scriptText,
        }),
      });

      if (!res.ok) throw new Error("Failed to save bookmark");

      const json = await res.json();
      const newBookmark = {
        id: json.id,
        source_filename: file.name,
        start_page,
        end_page,
        script_text,
        created_at: new Date().toISOString()
      };

      // Update local file cache
      const updatedFileCache = [newBookmark, ...fileBookmarks];
      setFileBookmarks(updatedFileCache);
      await AsyncStorage.setItem(`bookmarks_${file.name}`, JSON.stringify(updatedFileCache));

      // Update global cache if it exists
      const globalCached = await AsyncStorage.getItem('all_bookmarks');
      if (globalCached) {
        const parsed = JSON.parse(globalCached);
        await AsyncStorage.setItem('all_bookmarks', JSON.stringify([newBookmark, ...parsed]));
      }

      Alert.alert("Success", "Bookmark saved!");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setBookmarking(false);
    }
  };

  const loadBookmark = (b: any) => {
    setStartPage(b.start_page);
    setEndPage(b.end_page);
    setScriptText(b.script_text);
    setIsEditing(false);
    setShowAllModal(false);
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

          <View style={styles.topButtons}>
            <View style={{ flex: 1 }}>
              <Button
                title="Choose File"
                onPress={pickFile}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Bookmarked scripts"
                onPress={fetchAllBookmarks}
              />
            </View>
          </View>

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

          {/* ⭐ FILE BOOKMARKS SECTION */}
          {fileBookmarks.length > 0 && (
            <View style={styles.bookmarkSection}>
              <Text style={styles.bookmarkTitle}>Bookmarked Scripts for this file:</Text>
              {fileBookmarks.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.bookmarkItem}
                  onPress={() => loadBookmark(b)}
                >
                  <Text style={styles.bookmarkItemText}>
                    Bookmark {fileBookmarks.indexOf(b) + 1} (Pages {b.start_page}-{b.end_page})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

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

                <Button
                  title={bookmarking ? "Saving..." : "Bookmark Script"}
                  onPress={handleSaveBookmark}
                />

              </View>

            </View>

          )}

        </Card>

      </ScrollView>

      {/* ⭐ ALL BOOKMARKS MODAL */}
      <Modal
        visible={showAllModal}
        animationType="slide"
        transparent={false}
      >
        <Screen>
          <PageHeader
            title="All Bookmarked Scripts"
          />
          <ScrollView contentContainerStyle={styles.body}>
            {allBookmarks.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>No bookmarks found.</Text>
            ) : (
              allBookmarks.map((b) => (
                <Card key={b.id} title={b.source_filename || 'Unknown File'}>
                  <Button
                    title={`Load Pages ${b.start_page}-${b.end_page}`}
                    onPress={() => loadBookmark(b)}
                  />
                </Card>
              ))
            )}
            <View style={{ marginTop: 20 }}>
              <Button
                title="Close"
                onPress={() => setShowAllModal(false)}
              />
            </View>
          </ScrollView>
        </Screen>
      </Modal>

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
    marginTop: 10,
    flexWrap: "wrap"
  },

  topButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10
  },

  bookmarkSection: {
    backgroundColor: "#f0f7ff",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#cce4ff"
  },

  bookmarkTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 14
  },

  bookmarkItem: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 6,
    marginBottom: 6,
    alignItems: "center"
  },

  bookmarkItemText: {
    color: "white",
    fontWeight: "600"
  }

});