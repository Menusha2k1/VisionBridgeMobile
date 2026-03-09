import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";

type Datum = { label: string; value: number };

export default function LineChart({
  data,
  width = 320,
  height = 160,
}: {
  data: Datum[];
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const padding = 18;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - (d.value / max) * (height - padding * 2);
    return { x, y, label: d.label };
  });

  const dPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Path d={dPath} strokeWidth={3} stroke={styles.line.color} fill="none" />
        {points.map((p, idx) => (
          <React.Fragment key={`${p.label}-${idx}`}>
            <Circle cx={p.x} cy={p.y} r={4} fill={styles.dot.color} />
            <SvgText
              x={p.x}
              y={height - 4}
              fontSize="10"
              fill={styles.label.color}
              textAnchor="middle"
            >
              {p.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  line: {
    color: "#2563eb",
  },
  dot: {
    color: "#1d4ed8",
  },
  label: {
    color: "#334155",
  },
});