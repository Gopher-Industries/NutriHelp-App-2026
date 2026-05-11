module.exports = function (api) {
  const isTest = api.env("test");
  api.cache(() => process.env.NODE_ENV);

  if (isTest) {
    return {
      presets: ["babel-preset-expo"],
    };
  }

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin", // MUST be last
    ],
  };
};