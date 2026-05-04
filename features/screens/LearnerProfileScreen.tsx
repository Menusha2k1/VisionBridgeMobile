import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

import {
  getStatsMap,
  resetStats,
  getAttemptHistory,
  resetAttemptHistory,
} from "../quiz_engine/engine/progressStore";

import {
  buildLearnerProfile,
  masteryPercent,
  LearnerProfile,
  TopicProfile,
} from "../quiz_engine/engine/learnerProfile";

function uiSpeak(text: string) {
  if (!text) return;
  try {
    Speech.stop();
  } catch {}
  Speech.speak(text, { language: "en-US", rate: 0.95, pitch: 1.0 });
}

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function pct01(x: number) {
  return Math.round(clamp01(x) * 100);
}

function confidenceBand(c: number): "Low" | "Medium" | "High" {
  const x = clamp01(c);
  if (x < 0.45) return "Low";
  if (x < 0.75) return "Medium";
  return "High";
}

type Props = {
  onBack?: () => void;
};

type AttemptRow = {
  questionId: string;
  category: string;
  grade: number;
  isCorrect: boolean;
  timeTakenMs: number;
  hintUsed: number;
  repeatUsed: number;
  confidence: number; // 0..1
  answeredAt: number;
};

type CatAgg = {
  key: string; // `${grade}::${category}`
  grade: number;
  category: string;
  count: number;
  avgConfidence: number; // 0..1
  correctRate: number; // 0..1
  avgTimeSec: number;
};

export default function LearnerProfileScreen({ onBack }: Props) {
  // Router removed - using React Navigation instead

  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const statsMap = await getStatsMap();
      const p = buildLearnerProfile(statsMap);
      setProfile(p);

      const history = await getAttemptHistory();
      const sorted = [...history].sort((a, b) => b.answeredAt - a.answeredAt);
      setAttemptHistory(sorted);

      uiSpeak(
        `Learner profile. Overall accuracy ${Math.round(
          p.overallCorrectRatio * 100,
        )} percent.`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await loadAll();
    })();
    return () => {
      alive = false;
    };
  }, [loadAll]);

  const weakestTopics: TopicProfile[] = useMemo(() => {
    if (!profile) return [];
    return profile.weakestTopics.slice(0, 6);
  }, [profile]);

  const topWeakCategories = useMemo(() => {
    if (!profile) return [];
    return profile.topWeakCategories;
  }, [profile]);

  /* ---------------- Confidence: compact dashboard ---------------- */

  const confidenceOverall = useMemo(() => {
    if (!attemptHistory.length) {
      return {
        count: 0,
        avgConfidence: 0,
        correctRate: 0,
        avgTimeSec: 0,
      };
    }
    const n = attemptHistory.length;
    const sumC = attemptHistory.reduce((s, r) => s + clamp01(r.confidence), 0);
    const sumCorrect = attemptHistory.reduce(
      (s, r) => s + (r.isCorrect ? 1 : 0),
      0,
    );
    const sumTime = attemptHistory.reduce(
      (s, r) => s + Math.max(0, r.timeTakenMs || 0),
      0,
    );

    return {
      count: n,
      avgConfidence: sumC / n,
      correctRate: sumCorrect / n,
      avgTimeSec: sumTime / 1000 / n,
    };
  }, [attemptHistory]);

  const confidenceByCategory = useMemo<CatAgg[]>(() => {
    const map = new Map<string, CatAgg>();

    for (const r of attemptHistory) {
      const grade = Number.isFinite(r.grade) ? r.grade : 0;
      const category = (r.category || "General").toString();
      const key = `${grade}::${category}`;

      const cur =
        map.get(key) ??
        ({
          key,
          grade,
          category,
          count: 0,
          avgConfidence: 0,
          correctRate: 0,
          avgTimeSec: 0,
        } as CatAgg);

      cur.count += 1;
      cur.avgConfidence += clamp01(r.confidence);
      cur.correctRate += r.isCorrect ? 1 : 0;
      cur.avgTimeSec += Math.max(0, r.timeTakenMs || 0) / 1000;

      map.set(key, cur);
    }

    const out = Array.from(map.values()).map((c) => {
      const n = Math.max(1, c.count);
      return {
        ...c,
        avgConfidence: c.avgConfidence / n,
        correctRate: c.correctRate / n,
        avgTimeSec: c.avgTimeSec / n,
      };
    });

    // Lowest confidence first, then most attempts
    out.sort((a, b) => {
      if (a.avgConfidence !== b.avgConfidence)
        return a.avgConfidence - b.avgConfidence;
      return b.count - a.count;
    });

    return out;
  }, [attemptHistory]);

  const confidenceWeakTop5 = useMemo(
    () => confidenceByCategory.slice(0, 5),
    [confidenceByCategory],
  );

  const confidenceRecent6 = useMemo(
    () => attemptHistory.slice(0, 6),
    [attemptHistory],
  );

  /* ---------------- Reset ---------------- */

  const onReset = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    Alert.alert(
      "Reset learner data",
      "This will delete stored quiz stats and confidence attempt history. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetStats();
            await resetAttemptHistory(); // IMPORTANT: also clear confidence history
            uiSpeak("Learner data reset successfully.");
            await loadAll();
          },
        },
      ],
    );
  }, [loadAll]);

  if (loading) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Learner Profile</Text>
        <Text style={styles.sub}>Loading profile…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Learner Profile</Text>
        <Text style={styles.sub}>
          No data available yet. Attempt a quiz first.
        </Text>

        <View style={styles.actionsRow}>
          <Pressable style={styles.resetBtn} onPress={onReset}>
            <Text style={styles.resetText}>Reset Data</Text>
          </Pressable>

          {!!onBack && (
            <Pressable style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const overallConfPct = pct01(confidenceOverall.avgConfidence);
  const overallConfBand = confidenceBand(confidenceOverall.avgConfidence);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Learner Profile</Text>

        <View style={styles.headerButtons}>
          <Pressable
            style={styles.resetBtn}
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Reset learner data"
          >
            <Text style={styles.resetText}>Reset Data</Text>
          </Pressable>

          {!!onBack && (
            <Pressable
              style={styles.backBtn}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onBack();
              }}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ---------------- Overall card ---------------- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Overall</Text>
        <Text style={styles.cardLine}>
          Total attempts:{" "}
          <Text style={styles.bold}>{profile.totalAttempts}</Text>
        </Text>
        <Text style={styles.cardLine}>
          Overall accuracy:{" "}
          <Text style={styles.bold}>
            {Math.round(profile.overallCorrectRatio * 100)}%
          </Text>
        </Text>
      </View>

      {/* ---------------- Compact confidence dashboard ---------------- */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Confidence Summary</Text>

          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              // router.push("./confidence_dashboard"); // Removed - optional analytics screen
              uiSpeak("Confidence dashboard");
            }}
            accessibilityRole="button"
            accessibilityLabel="Open full confidence dashboard"
          >
            <Text style={styles.smallBtnText}>View more</Text>
          </Pressable>
        </View>

        {confidenceOverall.count === 0 ? (
          <Text style={styles.sub}>
            No confidence data yet. Attempt a quiz first.
          </Text>
        ) : (
          <>
            <Text style={styles.cardLine}>
              Avg confidence:{" "}
              <Text style={styles.bold}>
                {overallConfPct}% ({overallConfBand})
              </Text>
            </Text>

            <Text style={styles.cardLine}>
              Confidence sample size:{" "}
              <Text style={styles.bold}>{confidenceOverall.count}</Text>
            </Text>

            <Text style={styles.cardLine}>
              Accuracy (same attempts):{" "}
              <Text style={styles.bold}>
                {pct01(confidenceOverall.correctRate)}%
              </Text>
            </Text>

            <Text style={styles.cardLine}>
              Avg time:{" "}
              <Text style={styles.bold}>
                {confidenceOverall.avgTimeSec.toFixed(1)}s
              </Text>
            </Text>

            {/* Lowest-confidence categories */}
            <Text style={[styles.sub, { marginTop: 10 }]}>
              Lowest-confidence categories (tap to hear):
            </Text>

            {confidenceWeakTop5.length === 0 ? (
              <Text style={styles.sub}>No category confidence yet.</Text>
            ) : (
              confidenceWeakTop5.map((c, i) => {
                const conf = pct01(c.avgConfidence);
                const band = confidenceBand(c.avgConfidence);
                return (
                  <Pressable
                    key={c.key}
                    style={styles.row}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      uiSpeak(
                        `Rank ${i + 1}. Grade ${c.grade}. ${c.category}. Average confidence ${conf} percent, ${band}. Accuracy ${pct01(
                          c.correctRate,
                        )} percent. Attempts ${c.count}.`,
                      );
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Grade ${c.grade}. ${c.category}. Confidence ${conf} percent.`}
                  >
                    <Text style={styles.rowLeft}>
                      {i + 1}. Grade {c.grade} · {c.category}
                    </Text>
                    <Text style={styles.rowRight}>{conf}%</Text>
                  </Pressable>
                );
              })
            )}

            {/* Recent attempts */}
            <Text style={[styles.sub, { marginTop: 10 }]}>
              Recent attempts (tap to hear):
            </Text>

            {confidenceRecent6.length === 0 ? (
              <Text style={styles.sub}>No recent attempts yet.</Text>
            ) : (
              confidenceRecent6.map((r, i) => {
                const conf = pct01(r.confidence);
                const band = confidenceBand(r.confidence);
                const timeSec = Math.max(0, r.timeTakenMs || 0) / 1000;

                return (
                  <Pressable
                    key={`${r.questionId}-${r.answeredAt}-${i}`}
                    style={styles.row}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      uiSpeak(
                        `Attempt ${i + 1}. Grade ${r.grade}. ${r.category}. ${
                          r.isCorrect ? "Correct." : "Incorrect."
                        } Confidence ${conf} percent, ${band}. Time ${timeSec.toFixed(
                          1,
                        )} seconds. Hints ${r.hintUsed}. Repeats ${r.repeatUsed}.`,
                      );
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Attempt ${i + 1}. ${r.isCorrect ? "Correct" : "Wrong"}. Confidence ${conf} percent.`}
                  >
                    <Text style={styles.rowLeft}>
                      {i + 1}. G{r.grade} · {r.category} ·{" "}
                      {r.isCorrect ? "Correct" : "Wrong"}
                    </Text>
                    <Text style={styles.rowRight}>{conf}%</Text>
                  </Pressable>
                );
              })
            )}
          </>
        )}
      </View>

      {/* ---------------- Weak categories from learner profile heuristic ---------------- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Weak Categories</Text>
        {topWeakCategories.length === 0 ? (
          <Text style={styles.sub}>No weak categories yet.</Text>
        ) : (
          topWeakCategories.map((c, i) => (
            <Pressable
              key={`${c.grade}::${c.category}`}
              style={styles.row}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                uiSpeak(
                  `Grade ${c.grade}. ${c.category}. Weakness ${Math.round(
                    c.weaknessScore * 100,
                  )} percent.`,
                );
              }}
              accessibilityRole="button"
              accessibilityLabel={`Grade ${c.grade}. ${c.category}. Weakness ${Math.round(
                c.weaknessScore * 100,
              )} percent.`}
            >
              <Text style={styles.rowLeft}>
                {i + 1}. Grade {c.grade} · {c.category}
              </Text>
              <Text style={styles.rowRight}>
                {Math.round(c.weaknessScore * 100)}%
              </Text>
            </Pressable>
          ))
        )}
      </View>

      {/* ---------------- Weakest topics ---------------- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weakest Topics</Text>
        <Text style={styles.sub}>
          Ranked using wrong answers, hint usage, repeats, and time.
        </Text>

        {weakestTopics.length === 0 ? (
          <Text style={styles.sub}>No topic data yet.</Text>
        ) : (
          weakestTopics.map((t: TopicProfile, i: number) => {
            const mastery = masteryPercent(t);
            const weakness = Math.round(t.weaknessScore * 100);

            return (
              <Pressable
                key={t.key}
                style={styles.topicCard}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  uiSpeak(
                    `Topic ${i + 1}. Grade ${t.grade}. ${t.category}. Mastery ${mastery} percent. Weakness ${weakness} percent. Attempts ${t.attempts}.`,
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel={`Grade ${t.grade}. ${t.category}. Mastery ${mastery} percent.`}
              >
                <View style={styles.topicTopRow}>
                  <Text style={styles.topicTitle}>
                    {i + 1}. Grade {t.grade} · {t.category}
                  </Text>
                  <Text style={styles.topicScore}>{mastery}%</Text>
                </View>

                <Text style={styles.topicMeta}>
                  Attempts {t.attempts} · Correct {t.correct} · Wrong {t.wrong}
                </Text>

                <Text style={styles.topicMeta}>
                  Avg time {t.avgTimeSec.toFixed(1)}s · Hint rate{" "}
                  {Math.round(t.hintRate * 100)}% · Repeat rate{" "}
                  {Math.round(t.repeatRate * 100)}%
                </Text>

                <Text style={styles.topicWeak}>
                  Weakness score: {weakness}%
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0D12" },
  container: { padding: 16, paddingBottom: 28 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  title: { color: "white", fontSize: 22, fontWeight: "700" },
  sub: { color: "#B8C0CC", marginTop: 6, lineHeight: 18 },

  bold: { color: "white", fontWeight: "700" },

  actionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2B3140",
    backgroundColor: "#121622",
  },
  backText: { color: "white", fontWeight: "600" },

  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3A2A2A",
    backgroundColor: "#221214",
  },
  resetText: { color: "#FFB3B3", fontWeight: "700" },

  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2B3140",
    backgroundColor: "#121622",
  },
  smallBtnText: { color: "white", fontWeight: "700", fontSize: 12 },

  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#111422",
    borderWidth: 1,
    borderColor: "#23293A",
  },
  cardTitle: { color: "white", fontWeight: "700", fontSize: 16 },
  cardLine: { color: "#D6DCE6", marginTop: 8 },

  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  row: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#0E1220",
    borderWidth: 1,
    borderColor: "#1F273A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: { color: "#DCE3F0", flex: 1, paddingRight: 10, fontWeight: "700" },
  rowRight: { color: "white", fontWeight: "900" },

  topicCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#0E1220",
    borderWidth: 1,
    borderColor: "#1F273A",
  },
  topicTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  topicTitle: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
    paddingRight: 10,
  },
  topicScore: { color: "#7CFFB2", fontWeight: "800", fontSize: 16 },
  topicMeta: { color: "#C7D0DD", marginTop: 6 },
  topicWeak: { color: "#FFB3B3", marginTop: 6, fontWeight: "700" },
});
