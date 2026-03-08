export const mlMetrics = {
  bestModel: "XGBoost",
  f1Macro: 0.935,
  balancedAccuracy: 0.915,
  prAuc: 0.991,
  baselineModel: "Logistic Regression",
  baselineF1Macro: 0.849,
  datasetSize: 157,
  classDistribution: {
    difficulty: 119,
    normal: 38,
  },
  noveltyMetric: "BLDI",
  noveltyMetricFull: "Behavioral Learning Difficulty Index",
};

export const modelComparison = [
  { label: "LR", value: 85 },
  { label: "RF", value: 89 },
  { label: "XGB", value: 94 },
];

export const researchHighlights = [
  "Three machine learning models were trained and compared.",
  "Stratified 5-fold cross-validation was used for robust evaluation.",
  "XGBoost achieved the best performance for predicting student learning difficulty.",
  "Predictions are generated from audio learning behavioural signals such as pauses, replays, seek backs, and completion rate.",
  "A novel Behavioral Learning Difficulty Index (BLDI) was introduced to quantify learner struggle in audio-first educational environments.",
];