import React from "react";
import { View } from "react-native";
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
    <View style={{ paddingTop: 6 }}>
      <Svg width={width} height={height}>
        <Path d={dPath} strokeWidth={3} fill="none" />
        {points.map((p, idx) => (
          <React.Fragment key={`${p.label}-${idx}`}>
            <Circle cx={p.x} cy={p.y} r={4} />
            <SvgText x={p.x} y={height - 4} fontSize="10" textAnchor="middle">
              {p.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}