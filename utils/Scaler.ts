// File: utils/scaler.ts

// Replace these numbers with the ones printed in your Colab!
const MEAN = [550.0, 10.5, 3.2];
const SCALE = [120.0, 5.2, 2.1];

export const scaleFeatures = (features: number[]) => {
  return features.map((val, i) => (val - MEAN[i]) / SCALE[i]);
};
