export type ConfidenceInputs = {
  isCorrect: boolean;
  timeTakenMs: number;
  hintUsed: number;     // 0..2 normally
  repeatUsed: number;   // 0..n
  avgTimeMsForTopic?: number; // optional baseline
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Confidence scoring (0..1) using behavior signals:
 * - correctness boosts confidence
 * - hint usage reduces confidence
 * - repeats reduce confidence
 * - very slow answers reduce confidence
 *
 * This is interpretable, easy to defend in viva.
 */
export function computeConfidenceScore(input: ConfidenceInputs): number {
  const {
    isCorrect,
    timeTakenMs,
    hintUsed,
    repeatUsed,
    avgTimeMsForTopic,
  } = input;

  const baseline = avgTimeMsForTopic && avgTimeMsForTopic > 0 ? avgTimeMsForTopic : 12000; // 12s default
  const timeRatio = timeTakenMs / baseline;

  // time component: fast -> near 1, slow -> lower
  // if timeRatio = 1 => 0.7, if timeRatio = 2 => 0.45, if timeRatio = 0.5 => 0.85
  const timeScore = clamp01(1 - 0.3 * Math.log2(Math.max(0.25, timeRatio)));

  // penalty components
  const hintPenalty = clamp01(hintUsed * 0.18);     // up to ~0.36
  const repeatPenalty = clamp01(repeatUsed * 0.12); // repeats are lighter penalty

  // correctness base
  const correctnessBase = isCorrect ? 0.65 : 0.25;

  // final score
  const score = correctnessBase + 0.35 * timeScore - hintPenalty - repeatPenalty;

  return clamp01(score);
}

export function confidenceLabel(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 0.75) return "HIGH";
  if (score >= 0.5) return "MEDIUM";
  return "LOW";
}