import { View, Text, PanResponder, StyleSheet } from "react-native";
import { useRef, useEffect } from "react";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

type Props<T> = {
  data: T[];
  labelKey: keyof T;
  onSelect: (item: T) => void;
  screenName: string;
};

export default function AccessibleList<T>({
  data,
  labelKey,
  onSelect,
  screenName,
}: Props<T>) {
  const focused = useRef<number | null>(null);
  const lastTap = useRef(0);

  useEffect(() => {
    Speech.speak(`${screenName}. Slide your finger and double tap to select.`);
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onPanResponderMove: (_, g) => {
      const index = Math.floor(g.moveY / 70);
      if (index < 0 || index >= data.length) return;

      if (focused.current !== index) {
        focused.current = index;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Speech.speak(String(data[index][labelKey]), { rate: 1.2 });
      }
    },

    onPanResponderRelease: () => {
      const now = Date.now();
      if (now - lastTap.current < 300 && focused.current !== null) {
        onSelect(data[focused.current]);
      }
      lastTap.current = now;
    },
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {data.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.text}>{String(item[labelKey])}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  row: {
    height: 100,
    justifyContent: "center",
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: "red",
  },
  text: { fontSize: 30 },
});
