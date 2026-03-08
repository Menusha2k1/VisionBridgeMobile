import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {!!helper && <Text style={styles.helper}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  label: { fontSize: 12, color: "#64748b", fontWeight: "700" },
  value: { marginTop: 8, fontSize: 20, fontWeight: "900", color: "#0f172a" },
  helper: { marginTop: 6, fontSize: 11, color: "#94a3b8" },
});