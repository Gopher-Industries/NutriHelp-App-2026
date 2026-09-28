import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { calculateBmi } from "../../api/healthToolsApi";
import { toErrorMessage } from "../../api/baseApi";

/**
 * FE-13 — Replace mock NutritionCalculator with real functionality.
 *
 * Previously this rendered a hard-coded macro pie chart (MOCK_PIE_DATA). It now
 * takes real inputs, calls the backend (GET /api/health-tools/bmi) to calculate,
 * shows the real result, and PERSISTS the last result to AsyncStorage so it is
 * retrievable when the user returns (UX-09: results saved/retrievable). It also
 * implements empty / loading / error / success states (UX-03 / UX-09).
 */

const STORAGE_KEY = "nutrihelp.nutritionCalculator.lastResult";
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
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load the last saved result so it is retrievable on return.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.result) {
            setResult(parsed.result);
            setHeight(parsed.inputs?.height ?? "");
            setWeight(parsed.inputs?.weight ?? "");
            setStatus("success");
          }
        }
      } catch {
        // Non-fatal: just start from the empty state.
      }
    })();
  }, []);

  const onCalculate = async () => {
    const errors = validate({ height, weight });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    setErrorMessage("");
    try {
      const data = await calculateBmi({ height: Number(height), weight: Number(weight) });
      setResult(data);
      setStatus("success");
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ result: data, inputs: { height, weight } })
        );
      } catch {
        // Non-fatal: result still shown for this session.
      }
    } catch (e) {
      setErrorMessage(toErrorMessage(e, "Unable to calculate right now. Please try again."));
      setStatus("error");
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-[#0B1220]">
      <View className="p-4 pt-12">
        <Text className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-1">
          Nutrition Calculator
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Enter your height and weight to calculate your BMI and daily water target.
        </Text>

        <View className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 mb-4">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Height (metres)
          </Text>
          <TextInput
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            placeholder="e.g. 1.75"
            placeholderTextColor="#9CA3AF"
            className={`border ${fieldErrors.height ? "border-red-500" : "border-slate-200 dark:border-slate-700"} rounded-xl px-4 py-3 mb-1 text-slate-900 dark:text-slate-100`}
          />
          {fieldErrors.height ? (
            <Text className="text-xs text-red-500 mb-2">{fieldErrors.height}</Text>
          ) : (
            <View className="mb-2" />
          )}

          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Weight (kilograms)
          </Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="e.g. 70"
            placeholderTextColor="#9CA3AF"
            className={`border ${fieldErrors.weight ? "border-red-500" : "border-slate-200 dark:border-slate-700"} rounded-xl px-4 py-3 mb-1 text-slate-900 dark:text-slate-100`}
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

        {status === "error" ? (
          <View className="rounded-2xl border border-red-300 bg-red-50 dark:bg-[#3A1E1E] dark:border-red-900 p-4 mb-4">
            <Text className="text-red-700 dark:text-red-300 font-semibold mb-1">
              Couldn’t calculate
            </Text>
            <Text className="text-red-600 dark:text-red-300 text-sm">{errorMessage}</Text>
            <Pressable onPress={onCalculate} className="mt-3 self-start rounded-lg bg-red-600 px-4 py-2">
              <Text className="text-white font-semibold text-sm">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {status === "idle" ? (
          <View className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 items-center">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              Your results will appear here.
            </Text>
          </View>
        ) : null}

        {status === "success" && result ? (
          <View className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              Your results
            </Text>
            <View className="flex-row justify-between mb-3">
              <Text className="text-slate-500 dark:text-slate-400">BMI</Text>
              <Text className="font-bold text-slate-900 dark:text-slate-100">{result.bmi}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-slate-500 dark:text-slate-400">Category</Text>
              <Text className="font-bold text-slate-900 dark:text-slate-100">{result.category}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-500 dark:text-slate-400">Recommended water / day</Text>
              <Text className="font-bold text-slate-900 dark:text-slate-100">
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
