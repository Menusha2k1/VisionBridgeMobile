import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  subtitle: { marginTop: 6, fontSize: 12, color: "#64748b" },
});