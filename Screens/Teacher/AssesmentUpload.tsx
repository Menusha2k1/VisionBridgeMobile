import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { API_BASE_URL } from "../../Services/apiConfig";

const TeacherDashboard = () => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Logic Gates");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Image එකක් තෝරාගැනීම
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 2. Data ටික Backend එකට යැවීම
  const handleUpload = async () => {
    if (!title || !image) {
      Alert.alert("Missing Data", "Please enter a title and select an image.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("assessment_type", type);

    // Image එක FormData වලට අදාළ විදිහට සකස් කිරීම
    const filename = image.split("/").pop();
    const match = /\.(\w+)$/.exec(filename || "");
    const fileType = match ? `image/${match[1]}` : `image`;

    formData.append("image", {
      uri: image,
      name: filename,
      type: fileType,
    } as any);

    try {
      const response = await fetch(`${API_BASE_URL}/assessments/upload`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.ok) {
        Alert.alert("Success", "AI Analysis Complete & Published!");
        setTitle("");
        setImage(null);
      } else {
        const errData = await response.json();
        throw new Error(errData.message || "Upload failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create New Assessment</Text>

      <View style={styles.formCard}>
        {/* Title Input */}
        <Text style={styles.label}>Assessment Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Logic Gates - Lab 01"
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
        />

        {/* Picker for Type */}
        <Text style={styles.label}>Select Diagram Type</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={type}
            onValueChange={(val) => setType(val)}
            style={{ color: "#fff" }}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Logic Gates Circuit" value="Logic Gates" />
            <Picker.Item label="Truth Table" value="Truth Table" />
          </Picker>
        </View>

        {/* Image Picker Button */}
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Text style={styles.btnText}>
            {image ? "Change Image" : "+ Upload Image"}
          </Text>
        </TouchableOpacity>

        {/* Preview Image */}
        {image && <Image source={{ uri: image }} style={styles.preview} />}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>
              Analyze & Publish to Students
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
    paddingTop: 50,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#000",
    marginTop: 20,
    marginBottom: 25,
  },
  formCard: {
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  label: { color: "#2563eb", marginBottom: 8, fontSize: 14, fontWeight: "600" },
  input: {
    backgroundColor: "#ffffff",
    color: "#000",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
    fontSize: 16,
  },
  pickerWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
    overflow: "hidden",
  },
  imageBtn: {
    backgroundColor: "#09d361",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#555",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: "contain",
  },
  submitBtn: {
    backgroundColor: "#2563eb",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default TeacherDashboard;
