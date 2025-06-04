const { getDefaultConfig } = require("@expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add Tamagui support
config.resolver.alias = {
  ...config.resolver.alias,
  "react-native-svg": "react-native-svg",
};

module.exports = withNativeWind(config, { input: "./global.css" });
