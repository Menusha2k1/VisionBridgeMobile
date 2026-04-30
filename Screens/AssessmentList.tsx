import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

interface Assessment {
  id: number;
  title: string;
  created_at: string;
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const AssessmentList: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [lessons, setLessons] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://172.20.10.2:3000/api/assessments")
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

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Logic Assessments</Text>
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
            <Text style={styles.arrow}>{">"}</Text>
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
  },
  title: { fontSize: 18, fontWeight: "600" },
  date: { fontSize: 12, color: "#666", marginTop: 5 },
  arrow: { fontSize: 20, color: "#ccc" },
});

export default AssessmentList;
