import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { generateHealthPlan, HEALTH_GOALS } from "../../services/healthPlanApi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useHealthConditions, ALL_CONDITIONS } from "../../context/HealthConditionsContext";
import { useAccessibility } from "../../context/AccessibilityContext";

import { colors } from "../../theme";
const GOAL_META = {
  "Weight Loss": { emoji: "⚖️", desc: "Burn fat, improve body composition" },
  "Muscle Gain": { emoji: "💪", desc: "Build strength and lean muscle" },
  Endurance: { emoji: "🏃", desc: "Boost stamina and cardiovascular fitness" },
};

const MAX_CHARS = 2000;

// ─── Sub-components ──────────────────────────────────────────────────────────

function GoalCard({ goal, selected, onPress }) {
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
        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
      )}
    </Pressable>
  );
}

function WeekCard({ week }) {
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
          color={colors.textSlate400}
        />
      </Pressable>

      {expanded && (
        <View style={styles.weekBody}>
          {/* Calories */}
          <View style={styles.calorieBadge}>
            <Ionicons name="flame-outline" size={14} color={colors.warning} />
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
  return (
    <Card style={styles.infoCard}>
      <View style={styles.infoCardHeader}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.infoCardTitle}> {title}</Text>
      </View>
      {children}
    </Card>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

function ConditionWarningBanner({ activeWarnings }) {
  if (activeWarnings.length === 0) return null;
  return (
    <View style={styles.conditionBanner}>
      <View style={styles.conditionBannerHeader}>
        <Ionicons name="medkit-outline" size={16} color={colors.warningDark} />
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

export default function HealthPlanScreen({ navigation }) {
  const { activeWarnings, conditions } = useHealthConditions();
  const { fs, sh } = useAccessibility();

  const hasDiabetes = conditions?.some(
    (condition) => condition.key === "diabetes"
  );


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
          <LoadingSpinner
            message="Generating your personalised plan…"
            textStyle={styles.loadingTitle}
          />
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
            <Ionicons name="refresh-outline" size={16} color={colors.primary} />
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
        {hasDiabetes && (
          <Pressable
            style={styles.diabetesPersonalisationCard}
            onPress={() => navigation.navigate("DiabetesPersonalisation")}
            accessibilityRole="button"
            accessibilityLabel="Open diabetes personalisation"
          >
            <View style={styles.diabetesPersonalisationIcon}>
              <Ionicons
                name="medical-outline"
                size={24}
                color="#2563EB"
              />
            </View>

            <View style={styles.diabetesPersonalisationContent}>
              <Text style={styles.diabetesPersonalisationTitle}>
                Diabetes Personalisation
              </Text>

              <Text style={styles.diabetesPersonalisationText}>
                Personalise your health plan based on your diabetes needs.
              </Text>

              <Text style={styles.diabetesPersonalisationLink}>
                Set up personalisation →
              </Text>
            </View>
          </Pressable>
        )}

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
            placeholderTextColor={colors.textSlate400}
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
            <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
            <Text style={styles.errorText}> {error}</Text>
          </View>
        ) : null}

        {/* Generate button */}
        <Button
          label="Generate My Plan"
          onPress={handleGenerate}
          disabled={!canSubmit}
          style={[styles.generateBtn, !canSubmit && styles.generateBtnDisabled]}
          textStyle={styles.generateBtnText}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.white },

  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSlate,
  },
  screenTitle: { fontSize: 22, fontWeight: "800", color: colors.textNavy },

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
    color: colors.textNavy,
    textAlign: "center",
    marginTop: 20,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: colors.textSlate400,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },

  // Form
  formContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  formSubtitle: {
    fontSize: 14,
    color: colors.textSecondaryAlt,
    lineHeight: 21,
    marginBottom: 24,
  },

  fieldBlock: { marginBottom: 24 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textNavy,
    marginBottom: 10,
  },

  textArea: {
    borderWidth: 1,
    borderColor: colors.borderSlateSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: colors.textNavy,
    backgroundColor: colors.surface,
    minHeight: 120,
  },
  inputError: { borderColor: colors.danger },
  charCounter: {
    fontSize: 12,
    color: colors.textSlate400,
    textAlign: "right",
    marginTop: 4,
  },

  // Goal cards
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.borderSlateSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surfaceNeutral,
    gap: 12,
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceBlue,
  },
  goalEmoji: { fontSize: 26 },
  goalCardText: { flex: 1 },
  goalName: { fontSize: 15, fontWeight: "700", color: colors.textNavy },
  goalNameSelected: { color: colors.primary },
  goalDesc: { fontSize: 12, color: colors.textSlate400, marginTop: 2 },

  // Error
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceRed,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: colors.danger, flex: 1 },

  // Generate button
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    marginTop: 4,
    gap: 6,
  },
  generateBtnDisabled: { backgroundColor: colors.borderSlate },
  generateBtnText: { fontSize: 16, fontWeight: "700", color: colors.white },

  // Results
  resultsContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  regenerateBtnText: { fontSize: 13, fontWeight: "600", color: colors.primary },

  infoCard: {
    borderRadius: 16,
    borderColor: colors.borderSlateSoft,
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 16,
  },
  infoCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoCardTitle: { fontSize: 15, fontWeight: "700", color: colors.textNavy },

  // Weekly plan
  weeksSection: { marginBottom: 16 },
  weeksSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textNavy,
    marginBottom: 12,
  },

  weekCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSlateSoft,
    marginBottom: 10,
    overflow: "hidden",
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: colors.surfaceNeutral,
  },
  weekBadge: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 56,
    alignItems: "center",
  },
  weekBadgeText: { fontSize: 12, fontWeight: "700", color: colors.white },
  weekFocus: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.textNavy },

  weekBody: { padding: 14, borderTopWidth: 1, borderTopColor: colors.surfaceSlate },
  calorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAmber,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  calorieText: { fontSize: 13, fontWeight: "600", color: colors.warningDark },

  section: { marginBottom: 12 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSlate400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bulletRow: { flexDirection: "row", marginBottom: 4 },
  bullet: { fontSize: 14, color: colors.primary, marginRight: 6, lineHeight: 20 },
  bulletText: { fontSize: 14, color: colors.textGray700, lineHeight: 20, flex: 1 },
  bodyText: { fontSize: 14, color: colors.textGray700, lineHeight: 22 },

  conditionBanner: {
    backgroundColor: colors.surfaceAmber,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.c_fde68a,
    padding: 14,
    marginBottom: 16,
  },
  conditionBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  conditionBannerTitle: { fontSize: 13, fontWeight: "700", color: colors.warningDarker },
  conditionWarningRow: { flexDirection: "row", marginBottom: 4 },
  conditionWarningBullet: { fontSize: 13, color: colors.warningDark, marginRight: 6, lineHeight: 19 },
  conditionWarningText: { fontSize: 13, color: colors.warningDarker, lineHeight: 19, flex: 1 },

  diabetesPersonalisationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  diabetesPersonalisationIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  diabetesPersonalisationContent: { flex: 1 },
  diabetesPersonalisationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  diabetesPersonalisationText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
    marginBottom: 6,
  },
  diabetesPersonalisationLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
});
