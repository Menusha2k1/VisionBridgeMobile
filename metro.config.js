const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// This line is the "magic" that lets TensorFlow.js load your model weights
config.resolver.assetExts.push("bin");

module.exports = config;
