import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "nutrihelp.accessibility.fontSizeKey";
const ELDERLY_MODE_STORAGE_KEY = "nutrihelp.accessibility.elderlyModeEnabled";

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
  // elderlyModeEnabled → whether HomeStack shows ElderlyHomeScreen instead of HomeScreen
  elderlyModeEnabled: false,
  setElderlyModeEnabled: () => {},
});

export function AccessibilityProvider({ children }) {
  const [fontSizeKey, setFontSizeKeyState] = useState(DEFAULT_KEY);
  const [elderlyModeEnabled, setElderlyModeEnabledState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const valid = FONT_SIZE_OPTIONS.find((o) => o.key === stored);
      if (valid) setFontSizeKeyState(valid.key);
    });
    AsyncStorage.getItem(ELDERLY_MODE_STORAGE_KEY).then((stored) => {
      if (stored != null) setElderlyModeEnabledState(stored === "true");
    });
  }, []);

  const fontScale =
    FONT_SIZE_OPTIONS.find((o) => o.key === fontSizeKey)?.scale ?? 1.25;

  const setFontSizeKey = async (key) => {
    setFontSizeKeyState(key);
    await AsyncStorage.setItem(STORAGE_KEY, key);
  };

  const setElderlyModeEnabled = async (enabled) => {
    setElderlyModeEnabledState(enabled);
    await AsyncStorage.setItem(ELDERLY_MODE_STORAGE_KEY, String(enabled));
  };

  const fs  = (base) => Math.round(base * fontScale);
  const sh  = (base) => Math.round(base * Math.max(fontScale * 0.9, 1.0));

  return (
    <AccessibilityContext.Provider
      value={{
        fontSizeKey,
        fontScale,
        setFontSizeKey,
        fs,
        sh,
        elderlyModeEnabled,
        setElderlyModeEnabled,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
