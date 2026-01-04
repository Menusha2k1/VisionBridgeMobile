import * as tf from "@tensorflow/tfjs-core";
import { loadLayersModel, LayersModel } from "@tensorflow/tfjs-layers";
import "@tensorflow/tfjs-backend-cpu";
import { bundleResourceIO } from "@tensorflow/tfjs-react-native";

// Scaling constants
const MEAN = [550.0, 10.5, 3.2];
const SCALE = [120.0, 5.2, 2.1];

export const loadModel = async (): Promise<LayersModel> => {
  // We no longer need tf.ready() here because App.tsx handled it
  const modelJson = require("../assets/model/model.json");
  const modelWeights = require("../assets/model/group1-shard1of1.bin");

  return await loadLayersModel(bundleResourceIO(modelJson, modelWeights));
};

// ENSURE THE 'export' KEYWORD IS HERE:
export const predictStruggle = async (model: LayersModel, path: any[]) => {
  if (!model || path.length < 5) return null;

  const first = path[0];
  const last = path[path.length - 1];
  const duration = (last.t - first.t) / 1000;

  const dist = Math.sqrt(
    Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
  );
  const velocity = duration > 0 ? dist / duration : 0;

  let deviance = 0;
  for (let i = 1; i < path.length; i++) {
    deviance +=
      Math.abs(path[i].x - path[i - 1].x) + Math.abs(path[i].y - path[i - 1].y);
  }
  const jitter = deviance / path.length;

  const scaledFeats = [velocity, jitter, duration].map(
    (v, i) => (v - MEAN[i]) / SCALE[i]
  );

  const inputTensor = tf.tensor2d([scaledFeats]);
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const score = (await prediction.data())[0];

  inputTensor.dispose();
  prediction.dispose();

  return score;
};
