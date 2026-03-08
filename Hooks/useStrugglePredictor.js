import { useCallback } from "react";
import { score } from "./StruggleModel";

const LABELS = ["Pro", "Intermediate", "Beginner"];

const levenshteinDistance = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
};

const computeFeatures = (userSequence, targetSequence) => {
  const userLen = userSequence.length;
  const targetLen = targetSequence.length;

  const dist = levenshteinDistance(userSequence, targetSequence);
  const maxLen = Math.max(userLen, targetLen);
  const ratio = maxLen === 0 ? 1 : 1 - dist / maxLen;
  const lenRatio = targetLen === 0 ? 0 : userLen / targetLen;
  const lenDiff = Math.abs(userLen - targetLen);
  const normDist = targetLen === 0 ? 0 : dist / targetLen;

  return [dist, ratio, lenRatio, lenDiff, normDist];
};

const useStrugglePredictor = () => {
  const predict = useCallback((userSequence, targetSequence) => {
    const features = computeFeatures(userSequence, targetSequence);
    const probabilities = score(features);
    const predictedIndex = probabilities.indexOf(Math.max(...probabilities));

    return {
      predictedIndex,
      label: LABELS[predictedIndex],
      probabilities,
    };
  }, []);

  return { predict };
};

export default useStrugglePredictor;
