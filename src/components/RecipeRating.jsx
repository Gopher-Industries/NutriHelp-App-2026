import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import StarRating from "react-native-star-rating-widget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import recipeApi from "../api/recipeApi";

const RATING_STORAGE_KEY = "nutrihelp.recipeRatings.byRecipeId";

function pickNumber(...candidates) {
  for (const c of candidates) {
    if (c == null || c === "") {
      continue;
    }
    const n = Number(c);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return undefined;
}

/** Parse typical POST /rate JSON shapes; values override optimistic UI when present. */
function readRatingFromRateResponse(response, submittedStars) {
  const root = response?.data ?? response;
  if (root == null || typeof root !== "object") {
    return { average: undefined, total: undefined, user: undefined };
  }
  const recipe = root.recipe ?? root.data?.recipe;
  const layer = recipe ?? root;

  return {
    average: pickNumber(
      layer.avg_rating,
      layer.average_rating,
      layer.rating,
      root.avg_rating,
      root.average_rating
    ),
    total: pickNumber(layer.total_ratings, layer.totalRatings, root.total_ratings, root.totalRatings),
    user: pickNumber(
      layer.user_rating,
      layer.userRating,
      root.user_rating,
      root.userRating,
      submittedStars
    ),
  };
}

export default function RecipeRating({
  recipeId,
  averageRating = 0,
  totalRatings = 0,
  userRating = 0,
}) {
  const serverUserRating = Number(userRating) || 0;
  const [currentRating, setCurrentRating] = useState(serverUserRating);
  const [effectiveAverage, setEffectiveAverage] = useState(Number(averageRating) || 0);
  const [effectiveTotalRatings, setEffectiveTotalRatings] = useState(
    Number(totalRatings) || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** True after we successfully POST a rating this mount (covers APIs that omit user_rating on detail). */
  const [lockedFromSubmit, setLockedFromSubmit] = useState(false);

  const alreadyRated = serverUserRating > 0 || lockedFromSubmit;

  useEffect(() => {
    setLockedFromSubmit(false);
    setCurrentRating(Number(userRating) || 0);
  }, [recipeId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!recipeId) {
        return;
      }
      try {
        const raw = await AsyncStorage.getItem(RATING_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const local = Number(parsed?.[String(recipeId)]) || 0;
        if (cancelled || local <= 0 || Number(userRating) > 0) {
          return;
        }
        setCurrentRating(local);
        setLockedFromSubmit(true);
      } catch {
        /* ignore storage issues */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeId, userRating]);

  useEffect(() => {
    const u = Number(userRating) || 0;
    if (u > 0) {
      setCurrentRating(u);
    }
  }, [userRating]);

  useEffect(() => {
    setEffectiveAverage(Number(averageRating) || 0);
    setEffectiveTotalRatings(Number(totalRatings) || 0);
  }, [averageRating, totalRatings]);

  const helperText = useMemo(() => {
    if (effectiveTotalRatings <= 0) {
      return "No ratings yet";
    }
    return `${effectiveAverage.toFixed(1)} average from ${effectiveTotalRatings} ratings`;
  }, [effectiveAverage, effectiveTotalRatings]);

  const statusHint = useMemo(() => {
    if (alreadyRated) {
      return "You’ve submitted your rating for this recipe.";
    }
    return "Tap a star to submit your rating.";
  }, [alreadyRated]);

  const applyOptimisticAggregate = (nextRating, previousUserRating, previousTotal, previousAverage) => {
    if (previousUserRating > 0 && previousTotal > 0) {
      const newAverage =
        (previousAverage * previousTotal - previousUserRating + nextRating) / previousTotal;
      setEffectiveAverage(Math.max(0, newAverage));
      return;
    }
    const newTotal = previousTotal + 1;
    const newAverage = (previousAverage * previousTotal + nextRating) / newTotal;
    setEffectiveTotalRatings(newTotal);
    setEffectiveAverage(Math.max(0, newAverage));
  };

  const handleRate = async (nextRating) => {
    if (!recipeId || isSubmitting || alreadyRated) {
      return;
    }

    const previousUserRating = Number(currentRating) || 0;
    const previousTotal = Number(effectiveTotalRatings) || 0;
    const previousAverage = Number(effectiveAverage) || 0;

    try {
      setIsSubmitting(true);
      setCurrentRating(nextRating);

      const response = await recipeApi.rateRecipe(recipeId, {
        rating: nextRating,
        score: nextRating,
      });

      applyOptimisticAggregate(nextRating, previousUserRating, previousTotal, previousAverage);

      const fromServer = readRatingFromRateResponse(response, nextRating);
      if (fromServer.average !== undefined && Number.isFinite(fromServer.average)) {
        setEffectiveAverage(Math.max(0, fromServer.average));
      }
      if (fromServer.total !== undefined && Number.isFinite(fromServer.total)) {
        setEffectiveTotalRatings(Math.max(0, fromServer.total));
      }
      if (fromServer.user !== undefined && fromServer.user > 0) {
        setCurrentRating(fromServer.user);
      } else {
        setCurrentRating(nextRating);
      }

      setLockedFromSubmit(true);
      try {
        const raw = await AsyncStorage.getItem(RATING_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        parsed[String(recipeId)] = fromServer.user > 0 ? fromServer.user : nextRating;
        await AsyncStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        /* ignore storage issues */
      }
    } catch (error) {
      setCurrentRating(previousUserRating);
      Alert.alert("Rating failed", "Unable to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="w-full items-center rounded-2xl bg-white p-4">
      <Text className="w-full text-center text-lg font-semibold text-slate-900">Rate this recipe</Text>
      <Text className="mt-1 w-full text-center text-sm text-slate-500">{helperText}</Text>
      <Text className="mt-1 w-full text-center text-xs text-slate-400">{statusHint}</Text>

      <View className="mt-3" pointerEvents={isSubmitting || alreadyRated ? "none" : "auto"}>
        <StarRating
          rating={Number(currentRating) || 0}
          maxStars={5}
          starSize={32}
          color="#F59E0B"
          emptyColor="#D1D5DB"
          enableHalfStar={false}
          onChange={(value) => handleRate(Math.round(value))}
          enableSwiping={false}
        />
      </View>

      {isSubmitting ? (
        <View className="mt-2 flex-row items-center justify-center">
          <ActivityIndicator size="small" color="#1A6DB5" />
          <Text className="ml-2 text-sm text-[#1A6DB5]">Submitting rating...</Text>
        </View>
      ) : null}
    </View>
  );
}
