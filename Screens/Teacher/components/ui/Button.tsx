import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Variant = "primary" | "secondary" | "ghost";

export default function Button({
  title,
  onPress,
  disabled,
  variant = "primary",
  iconName,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}) {
  const style =
    variant === "primary"
      ? styles.primary
      : variant === "secondary"
      ? styles.secondary
      : styles.ghost;

  const textStyle =
    variant === "ghost" ? styles.ghostText : styles.buttonText;
  const iconColor = variant === "ghost" ? "#1e3a8a" : "#ffffff";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, style, disabled ? styles.disabled : null]}
    >
      <View style={styles.content}>
        {iconName ? (
          <MaterialCommunityIcons
            name={iconName}
            size={18}
            color={iconColor}
            style={styles.icon}
          />
        ) : null}
        <Text style={textStyle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  primary: { backgroundColor: "#007BFF" },
  secondary: { backgroundColor: "#0f172a" },
  ghost: { backgroundColor: "#eef2ff", borderWidth: 1, borderColor: "#c7d2fe" },
  buttonText: { color: "#fff", fontWeight: "800" },
  ghostText: { color: "#1e3a8a", fontWeight: "800" },
  disabled: { opacity: 0.6 },
});