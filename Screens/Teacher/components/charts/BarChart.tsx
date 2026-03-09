import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

type Datum = { label: string; value: number };

export default function BarChart({
  data,
  width = 320,
  height = 160,
}: {
  data: Datum[];
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const padding = 18;
  const barGap = 10;
  const barWidth = (width - padding * 2 - barGap * (data.length - 1)) / data.length;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - padding * 2);
          const x = padding + i * (barWidth + barGap);
          const y = height - padding - h;
          const fill = BAR_COLORS[i % BAR_COLORS.length];
          const percentage = total > 0 ? Math.round((d.value / total) * 100) : 0;
          const percentageY = Math.max(12, y - 6);

          return (
            <React.Fragment key={d.label}>
              <Rect x={x} y={y} width={barWidth} height={h} rx={6} fill={fill} />
              <SvgText
                x={x + barWidth / 2}
                y={percentageY}
                fontSize="10"
                fill={styles.percentageLabel.color}
                textAnchor="middle"
                fontWeight="700"
              >
                {`${percentage}%`}
              </SvgText>
              <SvgText
                x={x + barWidth / 2}
                y={height - 4}
                fontSize="10"
                fill={styles.label.color}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const BAR_COLORS = ["#2563eb", "#0ea5e9", "#14b8a6", "#22c55e", "#f59e0b", "#f97316"];

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: {
    color: "#334155",
  },
  percentageLabel: {
    color: "#0f172a",
  },
});