import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherLogin">;

const Login: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Please enter both email and password.");
      return;
    }

    const ok =
      email.trim().toLowerCase() === "teacher@visionbridge.lk" &&
      password.trim() === "1234";

    if (!ok) {
      Alert.alert("Login failed", "Invalid email or password.");
      return;
    }

    navigation.replace("TeacherDashboard");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Teacher</Text>
      <Text style={styles.title}>Teacher Login</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Teacher Login</Text>
        <Text style={styles.subtitle}>
          Sign in to continue to your dashboard
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Demo login: teacher@visionbridge.lk / 1234
        </Text>
      </View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#eef4ff",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    textAlign: "center",
    color: "#475569",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 2,
  },
  buttonText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  hint: {
    textAlign: "center",
    marginTop: 14,
    color: "#64748b",
    fontSize: 12,
  },
});
