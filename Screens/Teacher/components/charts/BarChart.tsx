import React from "react";
import { View } from "react-native";
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
  const padding = 18;
  const barGap = 10;
  const barWidth = (width - padding * 2 - barGap * (data.length - 1)) / data.length;

  return (
    <View style={{ paddingTop: 6 }}>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - padding * 2);
          const x = padding + i * (barWidth + barGap);
          const y = height - padding - h;
          return (
            <React.Fragment key={d.label}>
              <Rect x={x} y={y} width={barWidth} height={h} rx={6} />
              <SvgText x={x + barWidth / 2} y={height - 4} fontSize="10" textAnchor="middle">
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}