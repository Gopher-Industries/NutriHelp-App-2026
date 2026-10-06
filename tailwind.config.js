const { light, dark } = require("./src/theme/palette.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Shared design tokens (FE-01) — NativeWind classes map to palette.json
        nh: {
          ...light,
          dark: {
            ...dark,
          },
        },
      },
    },
  },
  plugins: [],
};
