import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * ThemeContext — FE-T2-13
 *
 * Ports the web app's explicit dark-mode toggle to mobile.
 *
 * Before this, the app only followed the OS setting (via React Native's
 * `useColorScheme`) with no in-app override. This context adds a manual
 * override that:
 *   - persists the user's choice with AsyncStorage (survives app restarts),
 *   - overrides the system setting in both directions,
 *   - drives NativeWind's `dark:` variants via `setColorScheme`, and
 *   - is exposed as a drop-in `useColorScheme()` so the existing shared
 *     components (ScreenLayout, Card, NavigationHeader, charts, tabs, …)
 *     respect the override without changing their logic.
 *
 * `mode` is one of "system" | "light" | "dark".
 */

const STORAGE_KEY = "nutrihelp.theme.mode";

export const THEME_MODES = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

const isValidMode = (m) => m === "system" || m === "light" || m === "dark";

const ThemeContext = createContext({
  mode: "system",
  resolvedScheme: "light",
  isDark: false,
  hydrated: false,
  setMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  // The live OS setting; used only while mode === "system".
  const systemScheme = useRNColorScheme();
  // NativeWind's imperative scheme control (drives `dark:` classNames).
  const { setColorScheme } = useNativeWindColorScheme();

  const [mode, setModeState] = useState("system");
  const [hydrated, setHydrated] = useState(false);

  // Load the persisted preference once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const next = isValidMode(saved) ? saved : "system";
        if (active) setModeState(next);
        setColorScheme(next);
      } catch {
        setColorScheme("system");
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback(
    async (next) => {
      if (!isValidMode(next)) return;
      setModeState(next);
      setColorScheme(next); // keep NativeWind `dark:` variants in sync
      try {
        await AsyncStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Non-fatal: the in-memory choice still applies for this session.
      }
    },
    [setColorScheme]
  );

  // Resolve the effective scheme: an explicit choice overrides the OS.
  const resolvedScheme =
    mode === "system" ? (systemScheme ?? "light") : mode;
  const isDark = resolvedScheme === "dark";

  const toggleTheme = useCallback(() => {
    setMode(isDark ? "light" : "dark");
  }, [isDark, setMode]);

  const value = useMemo(
    () => ({ mode, resolvedScheme, isDark, hydrated, setMode, toggleTheme }),
    [mode, resolvedScheme, isDark, hydrated, setMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

/**
 * Drop-in replacement for react-native's `useColorScheme` that honours the
 * user's manual override. Returns "light" | "dark".
 */
export const useColorScheme = () => useContext(ThemeContext).resolvedScheme;

export default ThemeContext;
