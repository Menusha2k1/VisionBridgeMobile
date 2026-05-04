import { CategoryFeatureRow } from "../models/quizStats";

export type WeakTopicModel = {
  feature_names: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  coef: number[];
  intercept: number;
};

let cachedModel: WeakTopicModel | null = null;

export function loadWeakTopicModel(): WeakTopicModel | null {
  if (cachedModel) return cachedModel;

  try {
    // 3 levels up from: features/quiz_engine/engine/weakTopicModel.ts
    const raw =
      require("../../../assets/model/weak_topic_model.json") as WeakTopicModel;
    cachedModel = raw;
    return cachedModel;
  } catch (err) {
    console.warn(
      "Weak-topic model not found or invalid, falling back to rule-based logic.",
      err,
    );
    return null;
  }
}

/**
 * Sigmoid function for logistic regression.
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Compute a weakness probability for ONE category.
 * Returns number between 0 and 1, 1 == very weak.
 */
export function computeWeaknessScore(
  model: WeakTopicModel,
  row: CategoryFeatureRow,
): number {
  const { feature_names, scaler_mean, scaler_scale, coef, intercept } = model;

  // Build X in the same order as training
  const values: number[] = feature_names.map((name) => {
    switch (name) {
      case "attempts":
        return row.attempts;
      case "correct_ratio":
        return row.correctRatio;
      case "avg_time_sec":
        return row.avgTimeSec;
      case "hint_rate":
        return row.hintRate;
      case "repeat_rate":
        return row.repeatRate;
      default:
        return 0; // unknown feature
    }
  });

  // Standardize
  const standardized = values.map((v, i) => {
    const mean = scaler_mean[i] ?? 0;
    const scale = scaler_scale[i] || 1;
    return (v - mean) / scale;
  });

  // Dot product
  let z = intercept;
  for (let i = 0; i < standardized.length; i++) {
    z += (coef[i] || 0) * standardized[i];
  }

  return sigmoid(z); // probability of weakness
}
