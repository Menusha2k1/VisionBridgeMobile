import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";

// ─── Interfaces ─────────────────────────────────────────
interface GateData {
  id: string;
  type: string;
  inputA: string | number;
  inputB: string | number;
  output: string | number;
}

interface TableRow {
  values: (string | number)[];
  explanation: string;
}

interface AssessmentDetail {
  id: number;
  title: string;
  assessment_type: string;
  summary: string;
  final_output: string;
  gate_data: GateData[] | null;
  table_data: {
    headers: string[];
    rows: TableRow[];
  } | null;
}

type AssessmentsRouteProp = RouteProp<RootStackParamList, "Assessments">;

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const SCROLL_ZONE = 150;
const SCROLL_SPEED = 10;
const SWIPE_LEFT_THRESHOLD = -120;

const Assessments: React.FC<{ route: AssessmentsRouteProp }> = ({ route }) => {
  const { id } = route.params;
  const navigation = useNavigation();
  const [data, setData] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const focused = useRef<string | null>(null);
  const layouts = useRef<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const viewRefs = useRef<Record<string, View | null>>({});
  const soundRef = useRef<Audio.Sound | null>(null);
  const dataRef = useRef<AssessmentDetail | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffset = useRef(0);
  const scrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollDirection = useRef<"up" | "down" | null>(null);
  const contentHeight = useRef(0);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let sound: Audio.Sound | null = null;
    (async () => {
      const { sound: s } = await Audio.Sound.createAsync(
        require("../assets/sounds/tick.mp3"),
      );
      sound = s;
      soundRef.current = s;
    })();
    return () => {
      sound?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    fetch(`http://172.20.10.2:3000/api/assessments/${id}`)
      .then((res) => res.json())
      .then((json: AssessmentDetail) => {
        setData(json);
        setLoading(false);

        const count =
          json.assessment_type === "Logic Gates"
            ? (json.gate_data?.length ?? 0)
            : (json.table_data?.rows.length ?? 0);

        Speech.speak(
          `${json.assessment_type} assessment loaded. ${json.title}. ${json.summary}. Slide your finger to explore.`,
          { rate: 0.8 },
        );
      })
      .catch(() => setLoading(false));

    return () => {
      Speech.stop();
      stopAutoScroll();
    };
  }, [id]);

  const playFeedback = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (soundRef.current) await soundRef.current.replayAsync();
  }, []);

  const speakLabel = useCallback(
    (key: string, text: string) => {
      if (focused.current !== key) {
        focused.current = key;
        setActiveKey(key);
        playFeedback();
        Speech.stop();
        Speech.speak(text, { rate: 0.8 });
      }
    },
    [playFeedback],
  );

  const remeasureAll = useCallback(() => {
    Object.keys(viewRefs.current).forEach((key) => {
      viewRefs.current[key]?.measure((_x, _y, w, h, pageX, pageY) => {
        if (w > 0) layouts.current[key] = { x: pageX, y: pageY, w, h };
      });
    });
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollTimer.current) {
      clearInterval(scrollTimer.current);
      scrollTimer.current = null;
    }
    scrollDirection.current = null;
  }, []);

  const startAutoScroll = useCallback(
    (direction: "up" | "down") => {
      if (scrollDirection.current === direction) return;
      stopAutoScroll();
      scrollDirection.current = direction;
      scrollTimer.current = setInterval(() => {
        const maxScroll = Math.max(0, contentHeight.current - SCREEN_H);
        scrollOffset.current =
          direction === "down"
            ? Math.min(maxScroll, scrollOffset.current + SCROLL_SPEED)
            : Math.max(0, scrollOffset.current - SCROLL_SPEED);
        scrollRef.current?.scrollTo({
          y: scrollOffset.current,
          animated: false,
        });
        remeasureAll();
      }, 30);
    },
    [remeasureAll, stopAutoScroll],
  );

  const checkHit = useCallback(
    (x: number, y: number) => {
      const d = dataRef.current;
      if (!d) return;

      // Build key list based on type
      const dynamicKeys =
        d.assessment_type === "Logic Gates"
          ? d.gate_data?.map((g) => g.id) || []
          : d.table_data?.rows.map((_, i) => `row_${i}`) || [];

      const keys = ["summary", ...dynamicKeys, "final"];

      for (const key of keys) {
        const b = layouts.current[key];
        if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          if (key === "summary") {
            speakLabel(key, `Summary. ${d.title}. ${d.summary}`);
          } else if (key === "final") {
            speakLabel(key, `Conclusion. ${d.final_output}`);
          } else if (key.startsWith("row_")) {
            const idx = parseInt(key.split("_")[1]);
            const row = d.table_data?.rows[idx];
            if (row) speakLabel(key, row.explanation);
          } else {
            const gate = d.gate_data?.find((g) => g.id === key);
            if (gate) {
              const idx = d.gate_data!.indexOf(gate) + 1;
              speakLabel(
                key,
                `Step ${idx}. ${gate.type} gate. Inputs ${gate.inputA} and ${gate.inputB}. Output is ${gate.output}.`,
              );
            }
          }
          return;
        }
      }
      focused.current = null;
      setActiveKey(null);
    },
    [speakLabel],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, s) => checkHit(s.x0, s.y0),
      onPanResponderMove: (_, s) => {
        if (s.moveY > SCREEN_H - SCROLL_ZONE) startAutoScroll("down");
        else if (s.moveY < SCROLL_ZONE) startAutoScroll("up");
        else stopAutoScroll();
        checkHit(s.moveX, s.moveY);
      },
      onPanResponderRelease: (_, s) => {
        stopAutoScroll();
        if (s.dx < SWIPE_LEFT_THRESHOLD) {
          Speech.stop();
          Speech.speak("Going back.");
          navigation.goBack();
        }
      },
    }),
  ).current;

  const handleLayout = (key: string) => {
    viewRefs.current[key]?.measure((_x, _y, w, h, px, py) => {
      if (w > 0) layouts.current[key] = { x: px, y: py, w, h };
    });
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );

  return (
    <View style={styles.wrapper} {...panResponder.panHandlers}>
      <ScrollView
        ref={scrollRef}
        scrollEnabled={false}
        contentContainerStyle={styles.contentContainer}
        onContentSizeChange={(_, h) => (contentHeight.current = h)}
      >
        {/* Summary */}
        <View
          ref={(el) => {
            viewRefs.current["summary"] = el;
          }}
          onLayout={() => handleLayout("summary")}
          style={[
            styles.summaryCard,
            activeKey === "summary" && styles.cardFocused,
          ]}
        >
          <Text style={styles.typeTag}>{data?.assessment_type}</Text>
          <Text style={styles.title}>{data?.title}</Text>
          <Text style={styles.summaryText}>{data?.summary}</Text>
        </View>

        <Text style={styles.sectionLabel}>
          {data?.assessment_type === "Logic Gates"
            ? "Circuit Path"
            : "Table Rows"}
        </Text>

        {/* Content Render Logic */}
        {data?.assessment_type === "Logic Gates" ? (
          data.gate_data?.map((gate, index) => (
            <View
              key={gate.id}
              ref={(el) => {
                viewRefs.current[gate.id] = el;
              }}
              onLayout={() => handleLayout(gate.id)}
              style={[
                styles.gateCard,
                activeKey === gate.id && styles.cardFocused,
                {
                  borderLeftColor: gate.type === "AND" ? "#3498db" : "#e67e22",
                },
              ]}
            >
              <Text style={styles.stepLabel}>Step {index + 1}</Text>
              <Text style={styles.badgeText}>{gate.type} GATE</Text>
              <Text style={styles.logicText}>
                {gate.inputA} & {gate.inputB} → {gate.output}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              {data?.table_data?.headers.map((h, i) => (
                <Text key={i} style={styles.headerCell}>
                  {h}
                </Text>
              ))}
            </View>
            {data?.table_data?.rows.map((row, i) => (
              <View
                key={i}
                ref={(el) => {
                  viewRefs.current[`row_${i}`] = el;
                }}
                onLayout={() => handleLayout(`row_${i}`)}
                style={[
                  styles.tableRow,
                  activeKey === `row_${i}` && styles.cardFocused,
                ]}
              >
                {row.values.map((v, j) => (
                  <Text key={j} style={styles.cellText}>
                    {v}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Final */}
        <View
          ref={(el) => {
            viewRefs.current["final"] = el;
          }}
          onLayout={() => handleLayout("final")}
          style={[
            styles.finalCard,
            activeKey === "final" && styles.cardFocused,
          ]}
        >
          <Text style={styles.finalText}>Result: {data?.final_output}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#0a0a0f" },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0f",
  },
  summaryCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 18,
    padding: 22,
    borderWidth: 2,
    borderColor: "#333",
    marginBottom: 20,
  },
  typeTag: {
    color: "#3498db",
    fontWeight: "bold",
    fontSize: 13,
    letterSpacing: 1,
  },
  title: { fontSize: 26, fontWeight: "bold", color: "#fff", marginTop: 5 },
  summaryText: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 10,
    fontStyle: "italic",
  },
  sectionLabel: {
    color: "#2ecc71",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "600",
  },
  gateCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    borderLeftWidth: 8,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardFocused: {
    borderColor: "#fff",
    backgroundColor: "#2a2a38",
    elevation: 10,
  },
  stepLabel: { color: "#666", fontSize: 12 },
  badgeText: {
    color: "#3498db",
    fontWeight: "bold",
    fontSize: 18,
    marginVertical: 5,
  },
  logicText: { color: "#ddd", fontSize: 18 },
  tableContainer: {
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeader: { flexDirection: "row", backgroundColor: "#333", padding: 12 },
  headerCell: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  cellText: { flex: 1, color: "#ddd", textAlign: "center", fontSize: 18 },
  finalCard: {
    marginTop: 20,
    padding: 25,
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2ecc71",
  },
  finalText: {
    color: "#2ecc71",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
});

export default Assessments;
