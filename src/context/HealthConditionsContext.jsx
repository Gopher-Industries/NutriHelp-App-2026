import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "nutrihelp.healthConditions";

export const ALL_CONDITIONS = [
  { key: "diabetes",       label: "Diabetes",           icon: "🩺" },
  { key: "hypertension",   label: "High Blood Pressure", icon: "❤️" },
  { key: "heartDisease",   label: "Heart Disease",       icon: "🫀" },
  { key: "kidneyDisease",  label: "Kidney Disease",      icon: "🫘" },
  { key: "highCholesterol",label: "High Cholesterol",    icon: "🧪" },
  { key: "obesity",        label: "Obesity",             icon: "⚖️" },
  { key: "arthritis",      label: "Arthritis",           icon: "🦴" },
  { key: "osteoporosis",   label: "Osteoporosis",        icon: "🦷" },
];

// Dietary / meal warnings per condition — shown in HealthPlan and chat context
export const CONDITION_WARNINGS = {
  diabetes: "Low sugar and low glycaemic index foods recommended. Avoid refined carbohydrates.",
  hypertension: "Low sodium diet recommended. Limit processed and salty foods.",
  heartDisease: "Low saturated fat diet recommended. Limit red meat and full-fat dairy.",
  kidneyDisease: "Limit potassium, phosphorus, and protein. Consult your nephrologist before dietary changes.",
  highCholesterol: "Limit dietary cholesterol and saturated fats. Increase soluble fibre intake.",
  obesity: "Calorie-controlled diet recommended. Prioritise whole foods and lean proteins.",
  arthritis: "Anti-inflammatory foods recommended. Include omega-3 rich fish, leafy greens, and nuts.",
  osteoporosis: "Ensure adequate calcium and vitamin D. Include dairy, leafy greens, and fortified foods.",
};

const HealthConditionsContext = createContext({
  conditions: [],           // array of condition keys currently selected
  setConditions: () => {},
  hasCondition: () => false,
  activeWarnings: [],       // array of warning strings for selected conditions
});

export function HealthConditionsProvider({ children }) {
  const [conditions, setConditionsState] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try { setConditionsState(JSON.parse(stored)); } catch {}
      }
    });
  }, []);

  const setConditions = async (next) => {
    setConditionsState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const toggleCondition = async (key) => {
    const next = conditions.includes(key)
      ? conditions.filter((c) => c !== key)
      : [...conditions, key];
    await setConditions(next);
  };

  const hasCondition = (key) => conditions.includes(key);

  const activeWarnings = conditions
    .filter((k) => CONDITION_WARNINGS[k])
    .map((k) => ({ key: k, text: CONDITION_WARNINGS[k] }));

  return (
    <HealthConditionsContext.Provider
      value={{ conditions, setConditions, toggleCondition, hasCondition, activeWarnings }}
    >
      {children}
    </HealthConditionsContext.Provider>
  );
}

export const useHealthConditions = () => useContext(HealthConditionsContext);
