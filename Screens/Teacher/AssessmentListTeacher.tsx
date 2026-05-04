import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { API_BASE_URL } from "../../Services/apiConfig";

interface Assessment {
  id: number;
  title: string;
  created_at: string;
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const AssessmentListTeacher: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [lessons, setLessons] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/assessments`)
      .then((res) => res.json())
      .then((data) => {
        setLessons(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleDelete = (id: number) => {
    Alert.alert("Delete", "Are you sure you want to delete this assessment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          fetch(`${API_BASE_URL}/assessments/${id}`, {
            method: "DELETE",
          })
            .then((res) => {
              if (res.ok) {
                setLessons((prev) => prev.filter((a) => a.id !== id));
              }
            })
            .catch((err) => console.error(err));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={styles.headerTitle}>Assessments</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("UploadAssessment")}
        >
          <AntDesign
            name="plus"
            size={24}
            color="black"
            style={{ marginBottom: 10 }}
          />
        </TouchableOpacity>
      </View>
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Assessments", { id: item.id })}
          >
            <View>
              <Text style={styles.title}>
                {item.title} #{item.id}
              </Text>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <MaterialIcons name="delete" size={24} color="black" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  title: { fontSize: 18, fontWeight: "600" },
  date: { fontSize: 12, color: "#666", marginTop: 5 },
  arrow: { fontSize: 20, color: "#ccc" },
});

export default AssessmentListTeacher;
