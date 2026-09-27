import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { toErrorMessage } from "../../../api/baseApi";
import { submitPlanFeedback } from "../../../api/mealPlanApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { useAccessibility } from "../../../context/AccessibilityContext";

import { colors } from "../../../theme";
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"];
const CHIP_NEUTRAL = 0;
const CHIP_LIKED = 1;
const CHIP_DISLIKED = -1;

function StarRow({ rating, onRate, fs, sh }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onRate(star === rating ? 0 : star)}
          style={[styles.starBtn, { minWidth: sh(44), minHeight: sh(44) }]}
          hitSlop={6}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={fs(34)}
            color={colors.warning}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function FeedbackCard({ planId, mealPlan }) {
  const { fs, sh } = useAccessibility();
  const [rating, setRating] = useState(0);
  const [followedPlan, setFollowedPlan] = useState(null);
  const [chipStates, setChipStates] = useState({});
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const chipLabels = (mealPlan ?? []).flatMap((dayData) =>
    MEAL_TYPES.map((type) => `${dayData.day} ${type}`)
  );

  const toggleChip = useCallback((label) => {
    setChipStates((prev) => {
      const current = prev[label] ?? CHIP_NEUTRAL;
      const next =
        current === CHIP_NEUTRAL
          ? CHIP_LIKED
          : current === CHIP_LIKED
          ? CHIP_DISLIKED
          : CHIP_NEUTRAL;
      return { ...prev, [label]: next };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    setError("");

    const likedMeals = Object.entries(chipStates)
      .filter(([, v]) => v === CHIP_LIKED)
      .map(([k]) => k);
    const dislikedMeals = Object.entries(chipStates)
      .filter(([, v]) => v === CHIP_DISLIKED)
      .map(([k]) => k);

    const payload = {
      rating,
      ...(followedPlan !== null && { followedPlan }),
      ...(likedMeals.length > 0 && { likedMeals }),
      ...(dislikedMeals.length > 0 && { dislikedMeals }),
      ...(notes.trim() && { notes: notes.trim() }),
    };

    try {
      await submitPlanFeedback(planId, payload);
      setSubmitted(true);
    } catch (err) {
      setError(toErrorMessage(err, "Failed to submit feedback. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }, [rating, submitting, chipStates, followedPlan, notes, planId]);

  if (!planId) {
    return (
      <View style={styles.unavailableCard}>
        <Ionicons name="information-circle-outline" size={fs(22)} color={colors.textMuted} />
        <Text style={[styles.unavailableText, { fontSize: fs(13), lineHeight: fs(18) }]}>
          Feedback is not available for this plan — plan ID was not returned by the server.
        </Text>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.thankyouCard}>
        <Text style={[styles.thankyouEmoji, { fontSize: fs(40) }]}>🎉</Text>
        <Text style={[styles.thankyouTitle, { fontSize: fs(18) }]}>Thank you for your feedback!</Text>
        <Text style={[styles.thankyouSub, { fontSize: fs(13) }]}>
          Your ratings help us improve future plans.
        </Text>
      </View>
    );
  }

  return (
    <Card style={styles.card}>
      <Text style={[styles.cardTitle, { fontSize: fs(18) }]}>How was your plan?</Text>
      <Text style={[styles.cardSub, { fontSize: fs(13), lineHeight: fs(18) }]}>
        Rate your experience to improve future suggestions.
      </Text>

      <StarRow rating={rating} onRate={setRating} fs={fs} sh={sh} />
      {rating > 0 ? (
        <Text style={[styles.ratingLabel, { fontSize: fs(14) }]}>{RATING_LABELS[rating]}</Text>
      ) : null}

      <Text style={[styles.sectionLabel, { fontSize: fs(14) }]}>Did you follow this plan?</Text>
      <View style={styles.toggleRow}>
        <Pressable
          style={[
            styles.toggleBtn,
            { minHeight: sh(44) },
            followedPlan === true && styles.toggleBtnYes,
          ]}
          onPress={() => setFollowedPlan((prev) => (prev === true ? null : true))}
        >
          <Text
            style={[
              styles.toggleBtnText,
              { fontSize: fs(13) },
              followedPlan === true && styles.toggleBtnTextActive,
            ]}
          >
            Yes, I followed it
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleBtn,
            { minHeight: sh(44) },
            followedPlan === false && styles.toggleBtnNo,
          ]}
          onPress={() => setFollowedPlan((prev) => (prev === false ? null : false))}
        >
          <Text
            style={[
              styles.toggleBtnText,
              { fontSize: fs(13) },
              followedPlan === false && styles.toggleBtnTextActive,
            ]}
          >
            No, I didn't
          </Text>
        </Pressable>
      </View>

      {chipLabels.length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, { fontSize: fs(14) }]}>Rate individual meals</Text>
          <Text style={[styles.chipHint, { fontSize: fs(11) }]}>
            Tap once = liked · tap twice = disliked · tap again to reset
          </Text>
          <View style={styles.chipGrid}>
            {chipLabels.map((label) => {
              const state = chipStates[label] ?? CHIP_NEUTRAL;
              return (
                <Pressable
                  key={label}
                  style={[
                    styles.mealChip,
                    { minHeight: sh(34) },
                    state === CHIP_LIKED && styles.mealChipLiked,
                    state === CHIP_DISLIKED && styles.mealChipDisliked,
                  ]}
                  onPress={() => toggleChip(label)}
                >
                  <Text
                    style={[
                      styles.mealChipText,
                      { fontSize: fs(12) },
                      state === CHIP_LIKED && styles.mealChipTextLiked,
                      state === CHIP_DISLIKED && styles.mealChipTextDisliked,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <Text style={[styles.sectionLabel, { fontSize: fs(14) }]}>Additional notes (optional)</Text>
      <TextInput
        style={[styles.notesInput, { fontSize: fs(14), minHeight: sh(80) }]}
        value={notes}
        onChangeText={(v) => {
          if (v.length <= 500) setNotes(v);
        }}
        multiline
        numberOfLines={3}
        placeholder="Any comments about the plan..."
        placeholderTextColor={colors.textMuted}
        textAlignVertical="top"
      />
      <Text style={[styles.charCount, { fontSize: fs(11) }]}>{notes.length}/500</Text>

      {error ? <Text style={[styles.errorText, { fontSize: fs(13) }]}>{error}</Text> : null}

      <Button
        label="Submit Feedback"
        onPress={handleSubmit}
        loading={submitting}
        disabled={rating === 0}
        variant="success"
        style={[styles.submitBtn, { minHeight: sh(50), height: undefined }]}
        textStyle={[styles.submitBtnText, { fontSize: fs(15) }]}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 14,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 0,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textNavy,
    marginBottom: 4,
  },
  cardSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 16, lineHeight: 18 },

  starRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  starBtn: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warning,
    marginBottom: 16,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textGray700,
    marginTop: 18,
    marginBottom: 8,
  },

  toggleRow: { flexDirection: "row", gap: 10 },
  toggleBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  toggleBtnYes: { borderColor: colors.success, backgroundColor: colors.surfaceGreen },
  toggleBtnNo: { borderColor: colors.danger, backgroundColor: colors.surfaceRed },
  toggleBtnText: { fontSize: 13, color: colors.textGray700, fontWeight: "500" },
  toggleBtnTextActive: { fontWeight: "700" },

  chipHint: { fontSize: 11, color: colors.textMuted, marginBottom: 10 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mealChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSoft,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  mealChipLiked: { borderColor: colors.success, backgroundColor: colors.surfaceGreen },
  mealChipDisliked: { borderColor: colors.dangerStrong, backgroundColor: colors.surfaceRed },
  mealChipText: { fontSize: 12, color: colors.textGray700, fontWeight: "500" },
  mealChipTextLiked: { color: colors.success, fontWeight: "600" },
  mealChipTextDisliked: { color: colors.dangerStrong, fontWeight: "600" },

  notesInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textGray900,
    backgroundColor: colors.surfaceSoft,
    minHeight: 80,
  },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: "right", marginTop: 4 },
  errorText: { fontSize: 13, color: colors.danger, marginTop: 8 },

  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: colors.white },

  unavailableCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    margin: 14,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unavailableText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  thankyouCard: {
    margin: 14,
    backgroundColor: colors.surfaceGreenSoft,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.c_bbf7d0,
  },
  thankyouEmoji: { fontSize: 40, marginBottom: 10 },
  thankyouTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.success,
    textAlign: "center",
    marginBottom: 6,
  },
  thankyouSub: { fontSize: 13, color: colors.successTeal, textAlign: "center" },
});
