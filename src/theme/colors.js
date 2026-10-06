/**
 * Design tokens for NutriHelp Mobile (FE-01).
 * Light values preserve current on-screen colors (refactor, not redesign).
 * Dark variants are defined for FE-24 even if not fully applied yet.
 */
import palette from "./palette.json";

export const lightColors = palette.light;
export const darkColors = palette.dark;

/** Default StyleSheet tokens = light (visual unchanged). */
export const colors = lightColors;

export function getColors(colorScheme) {
  return colorScheme === "dark" ? darkColors : lightColors;
}

export default colors;
