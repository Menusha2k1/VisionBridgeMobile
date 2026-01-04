import { View, Text, Button, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  Home: undefined;
  Modules: undefined;
  Profile: undefined;
  Assesments: undefined;
  Quizes: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Modules">;

export default function Modules({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Modules Screen</Text>

      <View style={{ height: 20 }} />

      <Button title="Go to Home" onPress={() => navigation.navigate("Home")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 22, marginBottom: 20 },
});
