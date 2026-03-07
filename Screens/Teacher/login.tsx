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
<<<<<<< Updated upstream
      <Text style={styles.title}>Login Teacher</Text>
=======
      <Text style={styles.title}>Teacher Login</Text>
>>>>>>> Stashed changes

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Demo login: teacher@visionbridge.lk / 1234
      </Text>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#f9fafb",
    color: "#111827",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  hint: {
    textAlign: "center",
    marginTop: 12,
    color: "#6b7280",
    fontSize: 12,
  },
});