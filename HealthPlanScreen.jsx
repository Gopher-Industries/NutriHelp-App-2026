import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { generateHealthPlan, HEALTH_GOALS } from "../../services/healthPlanApi";
import { useHealthConditions, ALL_CONDITIONS } from "../../context/HealthConditionsContext";
import { useAccessibility } from "../../context/AccessibilityContext";
import { useThemedStyles } from "../../styles/themeColors";

const GOAL_META = {
  "Weight Loss": { emoji: "⚖️", desc: "Burn fat, improve body composition" },
  "Muscle Gain": { emoji: "💪", desc: "Build strength and lean muscle" },
  Endurance: { emoji: "🏃", desc: "Boost stamina and cardiovascular fitness" },
};

const MAX_CHARS = 2000;

// ─── Sub-components ──────────────────────────────────────────────────────────

function GoalCard({ goal, selected, onPress }) {
  const styles = useThemedStyles(makeStyles);
  const meta = GOAL_META[goal];
  return (
    <Pressable
      style={[styles.goalCard, selected && styles.goalCardSelected]}
      onPress={onPress}
    >
      <Text style={styles.goalEmoji}>{meta.emoji}</Text>
      <View style={styles.goalCardText}>
        <Text style={[styles.goalName, selected && styles.goalNameSelected]}>
          {goal}
        </Text>
        <Text style={styles.goalDesc}>{meta.desc}</Text>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={20} color="#0B5FA5" />
      )}
    </Pressable>
  );
}

function WeekCard({ week }) {
  const styles = useThemedStyles(makeStyles);
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.weekCard}>
      <Pressable style={styles.weekHeader} onPress={() => setExpanded((v) => !v)}>
        <View style={styles.weekBadge}>
          <Text style={styles.weekBadgeText}>Week {week.week}</Text>
        </View>
        <Text style={styles.weekFocus} numberOfLines={expanded ? 0 : 1}>
          {week.focus}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#94A3B8"
        />
      </Pressable>

      {expanded && (
        <View style={styles.weekBody}>
          {/* Calories */}
          <View style={styles.calorieBadge}>
            <Ionicons name="flame-outline" size={14} color="#F59E0B" />
            <Text style={styles.calorieText}>
              {" "}
              {week.target_calories_per_day} kcal / day
            </Text>
          </View>

          {/* Workouts */}
          {week.workouts?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Workouts</Text>
              {week.workouts.map((w, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{w}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Meal notes */}
          {week.meal_notes ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Meal Notes</Text>
              <Text style={styles.bodyText}>{week.meal_notes}</Text>
            </View>
          ) : null}

          {/* Reminders */}
          {week.reminders?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reminders</Text>
              {week.reminders.map((r, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{r}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function InfoCard({ icon, title, children }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoCardHeader}>
        <Ionicons name={icon} size={18} color="#0B5FA5" />
        <Text style={styles.infoCardTitle}> {title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

function ConditionWarningBanner({ activeWarnings }) {
  const styles = useThemedStyles(makeStyles);
  if (activeWarnings.length === 0) return null;
  return (
    <View style={styles.conditionBanner}>
      <View style={styles.conditionBannerHeader}>
        <Ionicons name="medkit-outline" size={16} color="#B45309" />
        <Text style={styles.conditionBannerTitle}> Dietary considerations for your conditions</Text>
      </View>
      {activeWarnings.map((w) => (
        <View key={w.key} style={styles.conditionWarningRow}>
          <Text style={styles.conditionWarningBullet}>•</Text>
          <Text style={styles.conditionWarningText}>{w.text}</Text>
        </View>
      ))}
    </View>
  );
}

export default function HealthPlanScreen() {
  const styles = useThemedStyles(makeStyles);
  const { activeWarnings, conditions } = useHealthConditions();
  const { fs, sh } = useAccessibility();
  const [medicalReport, setMedicalReport] = useState("");
  const [healthGoal, setHealthGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);

  const canSubmit = medicalReport.trim().length > 0 && healthGoal !== null && !loading;

  const handleGenerate = async () => {
    if (!canSubmit) {
      if (!medicalReport.trim()) setError("Please enter your medical summary.");
      else if (!healthGoal) setError("Please select a health goal.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await generateHealthPlan({
        medicalReport: medicalReport.trim(),
        healthGoal,
      });
      setPlan(result);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setPlan(null);
    setError(null);
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>AI Health Plan</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B5FA5" />
          <Text style={styles.loadingTitle}>Generating your personalised plan…</Text>
          <Text style={styles.loadingSubtitle}>
            This may take up to 60 seconds on first load. Please wait.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Results state ────────────────────────────────────────────────────────
  if (plan) {
    const weeks = Array.isArray(plan.weekly_plan) ? plan.weekly_plan : [];
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>AI Health Plan</Text>
          <Pressable style={styles.regenerateBtn} onPress={handleRegenerate}>
            <Ionicons name="refresh-outline" size={16} color="#0B5FA5" />
            <Text style={styles.regenerateBtnText}> Regenerate</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Plan overview */}
          {plan.suggestion ? (
            <InfoCard icon="bulb-outline" title="Plan Overview">
              <Text style={styles.bodyText}>{plan.suggestion}</Text>
            </InfoCard>
          ) : null}

          <ConditionWarningBanner activeWarnings={activeWarnings} />

          {/* Weekly plan */}
          {weeks.length > 0 && (
            <View style={styles.weeksSection}>
              <Text style={styles.weeksSectionTitle}>
                {weeks.length}-Week Plan
              </Text>
              {weeks.map((week) => (
                <WeekCard key={week.week} week={week} />
              ))}
            </View>
          )}

          {/* Progress analysis */}
          {plan.progress_analysis ? (
            <InfoCard icon="analytics-outline" title="Progress Analysis">
              <Text style={styles.bodyText}>{plan.progress_analysis}</Text>
            </InfoCard>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Input form ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>AI Health Plan</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.formSubtitle}>
          Tell us about your health and we'll generate a personalised 8-week plan.
        </Text>

        <ConditionWarningBanner activeWarnings={activeWarnings} />

        {/* Medical summary */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Medical Summary / Patient Notes</Text>
          <TextInput
            style={[styles.textArea, error && !medicalReport.trim() && styles.inputError]}
            value={medicalReport}
            onChangeText={(t) => {
              setMedicalReport(t.slice(0, MAX_CHARS));
              if (error) setError(null);
            }}
            placeholder="e.g. 35-year-old male, mild hypertension, sedentary lifestyle, wants to lose 10 kg…"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.charCounter}>
            {medicalReport.length}/{MAX_CHARS}
          </Text>
        </View>

        {/* Health goal selector */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Health Goal</Text>
          {HEALTH_GOALS.map((goal) => (
            <GoalCard
              key={goal}
              goal={goal}
              selected={healthGoal === goal}
              onPress={() => {
                setHealthGoal(goal);
                if (error) setError(null);
              }}
            />
          ))}
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
            <Text style={styles.errorText}> {error}</Text>
          </View>
        ) : null}

        {/* Generate button */}
        <Pressable
          style={[styles.generateBtn, !canSubmit && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={!canSubmit}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          <Text style={styles.generateBtnText}> Generate My Plan</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (t) =>
StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: t.bg("#FFFFFF") },

  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  screenTitle: { fontSize: 22, fontWeight: "800", color: t.fg("#253B63") },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: t.fg("#253B63"),
    textAlign: "center",
    marginTop: 20,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: t.fg("#94A3B8"),
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },

  // Form
  formContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  formSubtitle: {
    fontSize: 14,
    color: t.fg("#667085"),
    lineHeight: 21,
    marginBottom: 24,
  },

  fieldBlock: { marginBottom: 24 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: t.fg("#253B63"),
    marginBottom: 10,
  },

  textArea: {
    borderWidth: 1,
    borderColor: t.bd("#E2E8F0"),
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: t.fg("#253B63"),
    backgroundColor: t.bg("#F8FAFC"),
    minHeight: 120,
  },
  inputError: { borderColor: t.bd("#EF4444") },
  charCounter: {
    fontSize: 12,
    color: t.fg("#94A3B8"),
    textAlign: "right",
    marginTop: 4,
  },

  // Goal cards
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: t.bd("#E2E8F0"),
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: t.bg("#FAFAFA"),
    gap: 12,
  },
  goalCardSelected: {
    borderColor: t.bd("#0B5FA5"),
    backgroundColor: t.bg("#EFF6FF"),
  },
  goalEmoji: { fontSize: 26 },
  goalCardText: { flex: 1 },
  goalName: { fontSize: 15, fontWeight: "700", color: t.fg("#253B63") },
  goalNameSelected: { color: t.fg("#0B5FA5") },
  goalDesc: { fontSize: 12, color: t.fg("#94A3B8"), marginTop: 2 },

  // Error
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: t.bg("#FEF2F2"),
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: t.fg("#EF4444"), flex: 1 },

  // Generate button
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 26,
    backgroundColor: t.bg("#0B5FA5"),
    marginTop: 4,
    gap: 6,
  },
  generateBtnDisabled: { backgroundColor: t.bg("#CBD5E1") },
  generateBtnText: { fontSize: 16, fontWeight: "700", color: t.fg("#FFFFFF") },

  // Results
  resultsContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: t.bd("#0B5FA5"),
  },
  regenerateBtnText: { fontSize: 13, fontWeight: "600", color: t.fg("#0B5FA5") },

  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: t.bd("#E2E8F0"),
    backgroundColor: t.bg("#F8FAFC"),
    padding: 16,
    marginBottom: 16,
  },
  infoCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoCardTitle: { fontSize: 15, fontWeight: "700", color: t.fg("#253B63") },

  // Weekly plan
  weeksSection: { marginBottom: 16 },
  weeksSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: t.fg("#253B63"),
    marginBottom: 12,
  },

  weekCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.bd("#E2E8F0"),
    marginBottom: 10,
    overflow: "hidden",
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: t.bg("#FAFAFA"),
  },
  weekBadge: {
    backgroundColor: t.bg("#0B5FA5"),
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 56,
    alignItems: "center",
  },
  weekBadgeText: { fontSize: 12, fontWeight: "700", color: t.fg("#FFFFFF") },
  weekFocus: { flex: 1, fontSize: 14, fontWeight: "600", color: t.fg("#253B63") },

  weekBody: { padding: 14, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  calorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: t.bg("#FFFBEB"),
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  calorieText: { fontSize: 13, fontWeight: "600", color: t.fg("#B45309") },

  section: { marginBottom: 12 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: t.fg("#94A3B8"),
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bulletRow: { flexDirection: "row", marginBottom: 4 },
  bullet: { fontSize: 14, color: t.fg("#0B5FA5"), marginRight: 6, lineHeight: 20 },
  bulletText: { fontSize: 14, color: t.fg("#374151"), lineHeight: 20, flex: 1 },
  bodyText: { fontSize: 14, color: t.fg("#374151"), lineHeight: 22 },

  conditionBanner: {
    backgroundColor: t.bg("#FFFBEB"),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.bd("#FDE68A"),
    padding: 14,
    marginBottom: 16,
  },
  conditionBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  conditionBannerTitle: { fontSize: 13, fontWeight: "700", color: t.fg("#92400E") },
  conditionWarningRow: { flexDirection: "row", marginBottom: 4 },
  conditionWarningBullet: { fontSize: 13, color: t.fg("#B45309"), marginRight: 6, lineHeight: 19 },
  conditionWarningText: { fontSize: 13, color: t.fg("#92400E"), lineHeight: 19, flex: 1 },
});
