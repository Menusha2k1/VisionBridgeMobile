// Offline Logistic Regression weakness predictor.
// Uses the trained weights shipped with the app in: assets/data/logreg_weights.json
//

export type WeaknessFeatures = {
  attempts: number;
  correct_ratio: number; // 0..1
  avg_time_sec: number;
  hint_rate: number; // 0..1
  repeat_rate: number; // 0..1
};

type LogRegWeightsJson = {
  feature_names: string[];
  mean: number[];
  scale: number[];
  coef: number[];
  intercept: number;
};

let cached: LogRegWeightsJson | null = null;

function sigmoid(z: number) {
  // numerically stable sigmoid
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] || 0) * (b[i] || 0);
  return s;
}

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * Loads weights once (cached).
 * IMPORTANT: Do not use JSON import here, Expo bundler is most reliable with require().
 */
export function loadWeaknessModel(): LogRegWeightsJson {
  if (cached) return cached;

  // 3 levels up from:
  // features/quiz_engine/ml/weaknessModel.ts
  const w =
    require("../../../assets/model/logreg_weights.json") as LogRegWeightsJson;

  if (
    !w ||
    !Array.isArray(w.feature_names) ||
    !Array.isArray(w.mean) ||
    !Array.isArray(w.scale) ||
    !Array.isArray(w.coef) ||
    typeof w.intercept !== "number"
  ) {
    throw new Error(
      "Invalid ML weights format in assets/data/logreg_weights.json",
    );
  }

  if (
    w.feature_names.length !== w.mean.length ||
    w.mean.length !== w.scale.length
  ) {
    throw new Error(
      "ML weights arrays have inconsistent lengths (feature_names/mean/scale)",
    );
  }

  cached = w;
  return w;
}

/**
 * Predict probability that learner is weak (0..1).
 * Input features must match the model feature_names.
 */
export function predictWeaknessProbability(x: WeaknessFeatures): number {
  const m = loadWeaknessModel();

  // Ensure safe numeric values
  const safe: WeaknessFeatures = {
    attempts: Math.max(0, Math.floor(Number(x.attempts || 0))),
    correct_ratio: clamp01(Number(x.correct_ratio || 0)),
    avg_time_sec: Math.max(0, Number(x.avg_time_sec || 0)),
    hint_rate: clamp01(Number(x.hint_rate || 0)),
    repeat_rate: clamp01(Number(x.repeat_rate || 0)),
  };

  // Build raw vector in the exact order defined by feature_names
  const rawVec = m.feature_names.map((name) => {
    const v = (safe as any)[name];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  });

  // Standardize: (x - mean) / scale
  const z = rawVec.map((v, i) => {
    const mu = m.mean[i] ?? 0;
    const sc = m.scale[i] ?? 1;
    return sc === 0 ? 0 : (v - mu) / sc;
  });

  const logit = m.intercept + dot(m.coef, z);
  return sigmoid(logit);
}
