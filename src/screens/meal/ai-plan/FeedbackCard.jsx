import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { toErrorMessage } from "../../../api/baseApi";
import { submitPlanFeedback } from "../../../api/mealPlanApi";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"];
const CHIP_NEUTRAL = 0;
const CHIP_LIKED = 1;
const CHIP_DISLIKED = -1;

function StarRow({ rating, onRate }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onRate(star === rating ? 0 : star)}
          style={styles.starBtn}
          hitSlop={6}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={34}
            color="#F59E0B"
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function FeedbackCard({ planId, mealPlan }) {
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
        <Ionicons name="information-circle-outline" size={22} color="#9CA3AF" />
        <Text style={styles.unavailableText}>
          Feedback is not available for this plan — plan ID was not returned by the server.
        </Text>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.thankyouCard}>
        <Text style={styles.thankyouEmoji}>🎉</Text>
        <Text style={styles.thankyouTitle}>Thank you for your feedback!</Text>
        <Text style={styles.thankyouSub}>Your ratings help us improve future plans.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>How was your plan?</Text>
      <Text style={styles.cardSub}>Rate your experience to improve future suggestions.</Text>

      <StarRow rating={rating} onRate={setRating} />
      {rating > 0 ? (
        <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
      ) : null}

      <Text style={styles.sectionLabel}>Did you follow this plan?</Text>
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, followedPlan === true && styles.toggleBtnYes]}
          onPress={() => setFollowedPlan((prev) => (prev === true ? null : true))}
        >
          <Text
            style={[
              styles.toggleBtnText,
              followedPlan === true && styles.toggleBtnTextActive,
            ]}
          >
            Yes, I followed it
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, followedPlan === false && styles.toggleBtnNo]}
          onPress={() => setFollowedPlan((prev) => (prev === false ? null : false))}
        >
          <Text
            style={[
              styles.toggleBtnText,
              followedPlan === false && styles.toggleBtnTextActive,
            ]}
          >
            No, I didn't
          </Text>
        </Pressable>
      </View>

      {chipLabels.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Rate individual meals</Text>
          <Text style={styles.chipHint}>
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
                    state === CHIP_LIKED && styles.mealChipLiked,
                    state === CHIP_DISLIKED && styles.mealChipDisliked,
                  ]}
                  onPress={() => toggleChip(label)}
                >
                  <Text
                    style={[
                      styles.mealChipText,
                      state === CHIP_LIKED && styles.mealChipTextLiked,
                      state === CHIP_DISLIKED && styles.mealChipTextDisliked,
                    ]}
                  >
                    {state === CHIP_LIKED ? "👍 " : state === CHIP_DISLIKED ? "👎 " : ""}{label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Additional notes (optional)</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={(v) => {
          if (v.length <= 500) setNotes(v);
        }}
        multiline
        numberOfLines={3}
        placeholder="Any comments about the plan..."
        placeholderTextColor="#9CA3AF"
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{notes.length}/500</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[
          styles.submitBtn,
          (rating === 0 || submitting) && styles.submitBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={rating === 0 || submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Feedback</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#253B63",
    marginBottom: 4,
  },
  cardSub: { fontSize: 13, color: "#6B7280", marginBottom: 16, lineHeight: 18 },

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
    color: "#F59E0B",
    marginBottom: 16,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginTop: 18,
    marginBottom: 8,
  },

  toggleRow: { flexDirection: "row", gap: 10 },
  toggleBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  toggleBtnYes: { borderColor: "#047857", backgroundColor: "#ECFDF5" },
  toggleBtnNo: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  toggleBtnText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  toggleBtnTextActive: { fontWeight: "700" },

  chipHint: { fontSize: 11, color: "#9CA3AF", marginBottom: 10 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mealChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  mealChipLiked: { borderColor: "#047857", backgroundColor: "#ECFDF5" },
  mealChipDisliked: { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  mealChipText: { fontSize: 12, color: "#374151", fontWeight: "500" },
  mealChipTextLiked: { color: "#047857", fontWeight: "600" },
  mealChipTextDisliked: { color: "#DC2626", fontWeight: "600" },

  notesInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    minHeight: 80,
  },
  charCount: { fontSize: 11, color: "#9CA3AF", textAlign: "right", marginTop: 4 },
  errorText: { fontSize: 13, color: "#EF4444", marginTop: 8 },

  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  unavailableCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    margin: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  unavailableText: { flex: 1, fontSize: 13, color: "#6B7280", lineHeight: 18 },

  thankyouCard: {
    margin: 14,
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  thankyouEmoji: { fontSize: 40, marginBottom: 10 },
  thankyouTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#047857",
    textAlign: "center",
    marginBottom: 6,
  },
  thankyouSub: { fontSize: 13, color: "#059669", textAlign: "center" },
});