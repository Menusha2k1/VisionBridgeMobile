import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type Variant = "primary" | "secondary" | "ghost";

export default function Button({
  title,
  onPress,
  disabled,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
}) {
  const style =
    variant === "primary"
      ? styles.primary
      : variant === "secondary"
      ? styles.secondary
      : styles.ghost;

  const textStyle =
    variant === "ghost" ? styles.ghostText : styles.buttonText;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, style, disabled ? styles.disabled : null]}
    >
      <Text style={textStyle}>{title}</Text>
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
  primary: { backgroundColor: "#2563eb" },
  secondary: { backgroundColor: "#0f172a" },
  ghost: { backgroundColor: "#eef2ff", borderWidth: 1, borderColor: "#c7d2fe" },
  buttonText: { color: "#fff", fontWeight: "800" },
  ghostText: { color: "#1e3a8a", fontWeight: "800" },
  disabled: { opacity: 0.6 },
});