import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from "react-native";

import { calculateBmi } from "../../api/healthToolsApi";
import { toErrorMessage } from "../../api/baseApi";

/**
 * FE-T2-08 — Connect Nutrition Calculator page to backend.
 *
 * Previously this screen rendered a hardcoded MOCK macro pie chart. It now
 * collects real inputs (height, weight), submits them to the backend
 * (GET /api/health-tools/bmi via the services layer) and shows the real
 * calculated results, with validation and loading / error / empty states.
 */

// Client-side bounds mirror the backend validation so we fail fast with a
// friendly message before hitting the network.
const HEIGHT_MAX_M = 3;
const WEIGHT_MAX_KG = 700;

function validate({ height, weight }) {
  const errors = {};
  const h = Number(height);
  const w = Number(weight);

  if (!height?.trim()) errors.height = "Height is required.";
  else if (Number.isNaN(h) || h <= 0) errors.height = "Enter a positive number.";
  else if (h > HEIGHT_MAX_M) errors.height = "Height should be in metres (e.g. 1.75).";

  if (!weight?.trim()) errors.weight = "Weight is required.";
  else if (Number.isNaN(w) || w <= 0) errors.weight = "Enter a positive number.";
  else if (w > WEIGHT_MAX_KG) errors.weight = "Weight should be in kilograms.";

  return errors;
}

export default function NutritionCalculatorScreen() {
  const isDark = useColorScheme() === "dark";

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const onCalculate = async () => {
    const errors = validate({ height, weight });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    setErrorMessage("");
    setResult(null);
    try {
      const data = await calculateBmi({
        height: Number(height),
        weight: Number(weight),
      });
      setResult(data);
      setStatus("success");
    } catch (e) {
      setErrorMessage(
        toErrorMessage(e, "Unable to calculate right now. Please try again.")
      );
      setStatus("error");
    }
  };

  const text = isDark ? "text-slate-100" : "text-slate-900";
  const subText = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-800" : "bg-white";
  const border = isDark ? "border-slate-700" : "border-slate-200";
  const inputText = isDark ? "text-slate-100" : "text-slate-900";

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-[#0B1220]">
      <View className="p-4 pt-12">
        <Text className={`text-3xl font-black mb-1 ${text}`}>Nutrition Calculator</Text>
        <Text className={`text-sm mb-6 ${subText}`}>
          Enter your height and weight to calculate your BMI and daily water target.
        </Text>

        {/* Inputs */}
        <View className={`rounded-2xl border ${border} ${cardBg} p-5 mb-4`}>
          <Text className={`text-sm font-semibold mb-1 ${text}`}>Height (metres)</Text>
          <TextInput
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            placeholder="e.g. 1.75"
            placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
            className={`border ${fieldErrors.height ? "border-red-500" : border} rounded-xl px-4 py-3 mb-1 ${inputText}`}
          />
          {fieldErrors.height ? (
            <Text className="text-xs text-red-500 mb-2">{fieldErrors.height}</Text>
          ) : (
            <View className="mb-2" />
          )}

          <Text className={`text-sm font-semibold mb-1 ${text}`}>Weight (kilograms)</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="e.g. 70"
            placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
            className={`border ${fieldErrors.weight ? "border-red-500" : border} rounded-xl px-4 py-3 mb-1 ${inputText}`}
          />
          {fieldErrors.weight ? (
            <Text className="text-xs text-red-500 mb-2">{fieldErrors.weight}</Text>
          ) : (
            <View className="mb-2" />
          )}

          <Pressable
            onPress={onCalculate}
            disabled={status === "loading"}
            className={`rounded-xl py-3 items-center mt-2 ${status === "loading" ? "bg-emerald-400" : "bg-emerald-600"}`}
            accessibilityRole="button"
            accessibilityLabel="Calculate nutrition"
          >
            {status === "loading" ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base">Calculate</Text>
            )}
          </Pressable>
        </View>

        {/* Error state */}
        {status === "error" ? (
          <View className="rounded-2xl border border-red-300 bg-red-50 dark:bg-[#3A1E1E] dark:border-red-900 p-4 mb-4">
            <Text className="text-red-700 dark:text-red-300 font-semibold mb-1">
              Couldn’t calculate
            </Text>
            <Text className="text-red-600 dark:text-red-300 text-sm">{errorMessage}</Text>
            <Pressable
              onPress={onCalculate}
              className="mt-3 self-start rounded-lg bg-red-600 px-4 py-2"
            >
              <Text className="text-white font-semibold text-sm">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Empty state (before first calculation) */}
        {status === "idle" ? (
          <View className={`rounded-2xl border ${border} ${cardBg} p-6 items-center`}>
            <Text className={`text-sm ${subText}`}>Your results will appear here.</Text>
          </View>
        ) : null}

        {/* Success / results */}
        {status === "success" && result ? (
          <View className={`rounded-2xl border ${border} ${cardBg} p-5`}>
            <Text className={`text-lg font-bold mb-4 ${text}`}>Your results</Text>

            <View className="flex-row justify-between mb-3">
              <Text className={subText}>BMI</Text>
              <Text className={`font-bold ${text}`}>{result.bmi}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className={subText}>Category</Text>
              <Text className={`font-bold ${text}`}>{result.category}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={subText}>Recommended water / day</Text>
              <Text className={`font-bold ${text}`}>
                {result.recommendedWaterIntakeMl != null
                  ? `${result.recommendedWaterIntakeMl} ml`
                  : "—"}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
