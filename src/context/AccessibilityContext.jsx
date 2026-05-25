import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "nutrihelp.accessibility.fontSizeKey";

export const FONT_SIZE_OPTIONS = [
  { key: "normal",     label: "Normal",      scale: 1.0  },
  { key: "large",      label: "Large",       scale: 1.25 },
  { key: "extraLarge", label: "Extra Large", scale: 1.5  },
];

const DEFAULT_KEY = "large"; // Start at Large — target audience is elderly

const AccessibilityContext = createContext({
  fontSizeKey: DEFAULT_KEY,
  fontScale: 1.25,
  setFontSizeKey: () => {},
  // fs(base) → returns a font size scaled by fontScale
  fs: (base) => Math.round(base * 1.25),
  // sh(base) → touch / height scaling (grows slightly more conservatively)
  sh: (base) => Math.round(base * 1.15),
});

export function AccessibilityProvider({ children }) {
  const [fontSizeKey, setFontSizeKeyState] = useState(DEFAULT_KEY);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const valid = FONT_SIZE_OPTIONS.find((o) => o.key === stored);
      if (valid) setFontSizeKeyState(valid.key);
    });
  }, []);

  const fontScale =
    FONT_SIZE_OPTIONS.find((o) => o.key === fontSizeKey)?.scale ?? 1.25;

  const setFontSizeKey = async (key) => {
    setFontSizeKeyState(key);
    await AsyncStorage.setItem(STORAGE_KEY, key);
  };

  const fs  = (base) => Math.round(base * fontScale);
  const sh  = (base) => Math.round(base * Math.max(fontScale * 0.9, 1.0));

  return (
    <AccessibilityContext.Provider
      value={{ fontSizeKey, fontScale, setFontSizeKey, fs, sh }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
