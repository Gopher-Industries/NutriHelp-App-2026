import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

/**
 * themeColors — FE-T2-13
 *
 * The screens hard-code light colours in their StyleSheets, so dark mode never
 * had anything to switch. These helpers let a StyleSheet stay visually
 * IDENTICAL in light mode (every mapper is the identity function there) while
 * remapping known light neutrals to dark equivalents in dark mode. Brand,
 * accent and semantic colours (blues, greens, reds, ambers, whites-on-buttons)
 * are intentionally passed through unchanged in both modes.
 *
 * Usage in a screen:
 *   const makeStyles = (t) => StyleSheet.create({
 *     card: { backgroundColor: t.bg("#FFFFFF"), borderColor: t.bd("#E5E7EB") },
 *     title: { color: t.fg("#18233D") },
 *   });
 *   function Screen() {
 *     const styles = useThemedStyles(makeStyles);
 *     ...
 *   }
 */

// Light surface / neutral backgrounds -> dark surfaces.
const BG_DARK = {
  "#FFFFFF": "#0B1220",
  // pale surfaces -> raised dark card
  "#F9FAFB": "#111827", "#F8FAFC": "#111827", "#FAFAFA": "#111827",
  "#F5F7FB": "#111827", "#F3F4F6": "#111827", "#F3F5F9": "#111827",
  "#F3F7FF": "#111827", "#F7FBFF": "#111827", "#EEF2F7": "#111827",
  "#EEF3FF": "#111827", "#EEF4FF": "#111827", "#EEF6FF": "#111827",
  "#EFF6FF": "#111827", "#E8F2FB": "#111827", "#EAF0FF": "#111827",
  "#EAF2FF": "#111827", "#E7EEFB": "#111827", "#E1E8F7": "#111827",
  "#DCE7FB": "#111827", "#DBEAFE": "#111827",
  // grey dividers used as fills -> deeper surface
  "#E2E8F0": "#1F2937", "#E5E7EB": "#1F2937", "#E5E5E5": "#1F2937",
  "#D9E2F4": "#1F2937", "#D9D9D9": "#1F2937", "#D1D5DB": "#1F2937",
  "#D0D5DD": "#1F2937", "#CBD5E1": "#1F2937", "#B0C4DE": "#1F2937",
  "#BFBFBF": "#1F2937", "#D4DDED": "#1F2937",
  // semantic tints -> darker tints that keep their meaning
  "#FEE2E2": "#3A1E1E", "#FEF2F2": "#3A1E1E", "#FFF1F1": "#3A1E1E",
  "#FFF5F5": "#3A1E1E", "#FFE6E6": "#3A1E1E", "#FFD1D1": "#3A1E1E",
  "#ECFDF5": "#0F2E22", "#F0FDF4": "#0F2E22", "#D1FAE5": "#0F2E22",
  "#DCFCE7": "#0F2E22", "#EEF5EF": "#0F2E22",
  "#FFFBEB": "#3A2E12", "#FEF3C7": "#3A2E12",
};

// Dark text -> light text.
const FG_DARK = {
  "#111111": "#E8EDF5", "#111827": "#E8EDF5", "#18233D": "#E8EDF5",
  "#202633": "#E8EDF5", "#22365D": "#E8EDF5", "#253B63": "#E8EDF5",
  "#173E2A": "#E8EDF5", "#173E6A": "#E8EDF5", "#3C4A63": "#E8EDF5",
  "#000000": "#E8EDF5",
  // medium/muted greys -> readable muted on dark
  "#374151": "#9CA3AF", "#444444": "#9CA3AF", "#475569": "#9CA3AF",
  "#4B5563": "#9CA3AF", "#555555": "#9CA3AF", "#55627D": "#9CA3AF",
  "#5E7867": "#9CA3AF", "#64748B": "#9CA3AF", "#667085": "#9CA3AF",
  "#66758F": "#9CA3AF", "#6B7280": "#9CA3AF", "#7A7F8E": "#9CA3AF",
  "#888888": "#9CA3AF", "#8A94A6": "#9CA3AF", "#A0A8B6": "#9CA3AF",
  "#98A2B3": "#9CA3AF",
};

// Light borders / dividers -> dark borders.
const BD_DARK = {
  "#BFD7EA": "#243042", "#CBD5E1": "#243042", "#D1D5DB": "#243042",
  "#D4DDED": "#243042", "#D6D6D6": "#243042", "#D8E1F5": "#243042",
  "#D9E2F4": "#243042", "#DDEFE7": "#243042", "#E2E8F0": "#243042",
  "#E5E7EB": "#243042", "#E8EDF5": "#243042", "#BFDBFE": "#243042",
  "#93C5FD": "#243042", "#D0D5DD": "#243042", "#FFFFFF": "#243042",
  "#111111": "#374151", "#6A655A": "#374151",
};

function mapper(table, isDark) {
  return (value) => {
    if (!isDark) return value; // light mode: unchanged
    const key = typeof value === "string" ? value.toUpperCase() : value;
    return table[key] ?? value; // dark mode: remap known neutrals, pass through the rest
  };
}

/**
 * Returns colour mappers bound to the current resolved scheme.
 * `t.bg`, `t.fg`, `t.bd` map background, foreground (text) and border colours.
 */
export function useThemeColors() {
  const { isDark } = useTheme();
  return useMemo(
    () => ({
      isDark,
      bg: mapper(BG_DARK, isDark),
      fg: mapper(FG_DARK, isDark),
      bd: mapper(BD_DARK, isDark),
    }),
    [isDark]
  );
}

/**
 * Builds a StyleSheet from a `makeStyles(t)` factory and rebuilds it when the
 * scheme changes. Safe to call in every component that renders shared styles.
 */
export function useThemedStyles(makeStyles) {
  const t = useThemeColors();
  return useMemo(() => makeStyles(t), [t]);
}

export { StyleSheet };
