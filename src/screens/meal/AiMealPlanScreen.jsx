import { useCallback, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { toErrorMessage } from "../../api/baseApi";
import { generateAIPlan } from "../../api/mealPlanApi";

import PersonalisedPlanForm from "./ai-plan/PersonalisedPlanForm";
import PlanLoadingView from "./ai-plan/PlanLoadingView";
import WeeklyPlanResults from "./ai-plan/WeeklyPlanResults";

export default function AiMealPlanScreen({ navigation }) {
  const [step, setStep] = useState("form");
  const [filters, setFilters] = useState(null);
  const [mealPlan, setMealPlan] = useState([]);
  const [planId, setPlanId] = useState(null);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);

  const callGenerateApi = useCallback(async (currentFilters) => {
    const thisRequest = ++requestIdRef.current;
    setError("");
    setMealPlan([]);
    setPlanId(null);
    setStep("loading");

    try {
      const response = await generateAIPlan(currentFilters);
      if (thisRequest !== requestIdRef.current) return;

      const plan =
        response?.data?.plan ||
        response?.plan ||
        [];
      const id =
        response?.planId ||
        response?.plan_id ||
        response?.id ||
        null;

      setMealPlan(Array.isArray(plan) ? plan : []);
      setPlanId(id);
    } catch (err) {
      if (thisRequest !== requestIdRef.current) return;
      setError(toErrorMessage(err, "Failed to generate your meal plan. Please try again."));
    } finally {
      if (thisRequest === requestIdRef.current) {
        setStep("results");
      }
    }
  }, []);

  const handleFormSubmit = useCallback(
    (formFilters) => {
      setFilters(formFilters);
      callGenerateApi(formFilters);
    },
    [callGenerateApi]
  );

  const handleRegenerate = useCallback(() => {
    if (filters) callGenerateApi(filters);
  }, [filters, callGenerateApi]);

  const handleBack = useCallback(() => {
    if (step === "loading" || step === "results") {
      requestIdRef.current++;
      setStep("form");
      setError("");
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {step === "form" && (
        <PersonalisedPlanForm onSubmit={handleFormSubmit} onBack={handleBack} />
      )}
      {step === "loading" && <PlanLoadingView onCancel={handleBack} />}
      {step === "results" && (
        <WeeklyPlanResults
          mealPlan={mealPlan}
          planId={planId}
          error={error}
          navigation={navigation}
          onRegenerate={handleRegenerate}
          onBack={handleBack}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
});
