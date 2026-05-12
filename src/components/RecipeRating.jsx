import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import StarRating from "react-native-star-rating-widget";
import recipeApi from "../api/recipeApi";

const C = {
  primary: "#1A6DB5",
  slate900: "#0f172a",
  slate500: "#64748b",
  slate400: "#94a3b8",
};

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

function computeOptimisticStats(nextRating, previousUserRating, previousTotal, previousAverage) {
  const prevAvg = Number(previousAverage) || 0;
  const prevTotal = Number(previousTotal) || 0;
  const prevUser = Number(previousUserRating) || 0;

  if (prevUser > 0 && prevTotal > 0) {
    const newAvg = (prevAvg * prevTotal - prevUser + nextRating) / prevTotal;
    return { avg: Math.max(0, newAvg), total: prevTotal };
  }
  const newTotal = prevTotal + 1;
  const newAvg = (prevAvg * prevTotal + nextRating) / newTotal;
  return { avg: Math.max(0, newAvg), total: newTotal };
}

function buildReportedStats(optimistic, nextRating, fromServer) {
  let rating = optimistic.avg;
  let totalRatings = optimistic.total;
  let userRating = nextRating;

  if (fromServer?.average !== undefined && Number.isFinite(fromServer.average)) {
    rating = Math.max(0, fromServer.average);
  }
  if (fromServer?.total !== undefined && Number.isFinite(fromServer.total)) {
    totalRatings = Math.max(0, fromServer.total);
  }
  if (fromServer?.user !== undefined && fromServer.user > 0) {
    userRating = fromServer.user;
  }

  return { rating, totalRatings, userRating };
}

export default function RecipeRating({
  recipeId,
  averageRating = 0,
  totalRatings = 0,
  userRating = 0,
  onRatingStatsChange,
}) {
  const serverUserRating = Number(userRating) || 0;
  const [currentRating, setCurrentRating] = useState(serverUserRating);
  const [effectiveAverage, setEffectiveAverage] = useState(Number(averageRating) || 0);
  const [effectiveTotalRatings, setEffectiveTotalRatings] = useState(
    Number(totalRatings) || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** True after successful POST (covers APIs that omit user_rating on detail). */
  const [lockedFromSubmit, setLockedFromSubmit] = useState(false);

  const alreadyRated = serverUserRating > 0 || lockedFromSubmit;

  useEffect(() => {
    setLockedFromSubmit(false);
    setCurrentRating(Number(userRating) || 0);
  }, [recipeId]);

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

      const optimistic = computeOptimisticStats(
        nextRating,
        previousUserRating,
        previousTotal,
        previousAverage
      );
      const fromServer = readRatingFromRateResponse(response, nextRating);
      const reported = buildReportedStats(optimistic, nextRating, fromServer);

      setEffectiveAverage(reported.rating);
      setEffectiveTotalRatings(reported.totalRatings);
      setCurrentRating(reported.userRating);

      setLockedFromSubmit(true);
      onRatingStatsChange?.(reported);
    } catch (error) {
      setCurrentRating(previousUserRating);
      Alert.alert("Rating failed", "Unable to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Rate this recipe</Text>
      <Text style={styles.helper}>{helperText}</Text>
      <Text style={styles.hint}>{statusHint}</Text>

      <View style={styles.starWrap} pointerEvents={isSubmitting || alreadyRated ? "none" : "auto"}>
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
        <View style={styles.submittingRow}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={styles.submittingText}>Submitting rating...</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", alignItems: "center", borderRadius: 16, backgroundColor: "#fff", padding: 16 },
  title: { width: "100%", textAlign: "center", fontSize: 18, fontWeight: "600", color: C.slate900 },
  helper: { marginTop: 4, width: "100%", textAlign: "center", fontSize: 14, color: C.slate500 },
  hint: { marginTop: 4, width: "100%", textAlign: "center", fontSize: 12, color: C.slate400 },
  starWrap: { marginTop: 12 },
  submittingRow: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  submittingText: { marginLeft: 8, fontSize: 14, color: C.primary },
});
