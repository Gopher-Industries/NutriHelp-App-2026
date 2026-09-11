import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

// Single source of truth for the app's daily calorie and water targets.
// Consumed by HomeScreen, ElderlyHomeScreen, WaterTracker, HealthToolsScreen,
// AIWeeklyPlanScreen, and PersonalisedPlanForm (FE-14) so a change made in
// any one place (e.g. generating an AI plan with a new calorie target)
// reflects everywhere else without an app restart.
const CALORIE_TARGET_STORAGE_KEY = "nutrihelp.targets.calorieTarget";
const WATER_TARGET_STORAGE_KEY = "nutrihelp.targets.waterTarget";

const DEFAULT_CALORIE_TARGET = 2000;
const DEFAULT_WATER_TARGET = 8;

const NutritionTargetsContext = createContext({
  calorieTarget: DEFAULT_CALORIE_TARGET,
  waterTarget: DEFAULT_WATER_TARGET,
  setCalorieTarget: () => {},
  setWaterTarget: () => {},
});

export function NutritionTargetsProvider({ children }) {
  const [calorieTarget, setCalorieTargetState] = useState(DEFAULT_CALORIE_TARGET);
  const [waterTarget, setWaterTargetState] = useState(DEFAULT_WATER_TARGET);

  useEffect(() => {
    AsyncStorage.getItem(CALORIE_TARGET_STORAGE_KEY).then((stored) => {
      const parsed = parseInt(stored, 10);
      if (Number.isFinite(parsed) && parsed > 0) setCalorieTargetState(parsed);
    });
    AsyncStorage.getItem(WATER_TARGET_STORAGE_KEY).then((stored) => {
      const parsed = parseInt(stored, 10);
      if (Number.isFinite(parsed) && parsed > 0) setWaterTargetState(parsed);
    });
  }, []);

  const setCalorieTarget = async (value) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setCalorieTargetState(parsed);
    await AsyncStorage.setItem(CALORIE_TARGET_STORAGE_KEY, String(parsed));
  };

  const setWaterTarget = async (value) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setWaterTargetState(parsed);
    await AsyncStorage.setItem(WATER_TARGET_STORAGE_KEY, String(parsed));
  };

  return (
    <NutritionTargetsContext.Provider
      value={{ calorieTarget, waterTarget, setCalorieTarget, setWaterTarget }}
    >
      {children}
    </NutritionTargetsContext.Provider>
  );
}

export const useNutritionTargets = () => useContext(NutritionTargetsContext);
