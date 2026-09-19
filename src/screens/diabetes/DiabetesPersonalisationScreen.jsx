import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import useAppTheme from "../../hooks/useAppTheme";

const STEPS = [
  {
    key: "mealPattern",
    eyebrow: "DIABETES PERSONALISATION",
    title: "What does your usual meal pattern look like?",
    description:
      "This helps NutriHelp provide nutrition guidance that better fits your daily routine.",
    options: [
      {
        value: "three-meals",
        title: "3 meals a day",
        description: "Breakfast, lunch and dinner",
      },
      {
        value: "small-frequent",
        title: "Smaller, frequent meals",
        description: "Several smaller meals or snacks throughout the day",
      },
      {
        value: "irregular",
        title: "Irregular meal times",
        description: "My meal times often change from day to day",
      },
      {
        value: "other",
        title: "Other",
        description: "My meal pattern is different from these options",
      },
      {
        value: "prefer-not",
        title: "Prefer not to answer",
        description: "You can continue without sharing this information",
      },
    ],
  },
  {
    key: "activityBaseline",
    eyebrow: "DIABETES PERSONALISATION",
    title: "How active are you on a typical day?",
    description:
      "Your activity level can help us personalise nutrition support around your usual routine.",
    options: [
      {
        value: "low",
        title: "Mostly inactive",
        description: "I spend most of the day sitting or resting",
      },
      {
        value: "light",
        title: "Lightly active",
        description: "I do some walking or light activity during the day",
      },
      {
        value: "moderate",
        title: "Moderately active",
        description: "I regularly walk, exercise or stay physically active",
      },
      {
        value: "high",
        title: "Very active",
        description: "I exercise frequently or have a physically active routine",
      },
      {
        value: "prefer-not",
        title: "Prefer not to answer",
        description: "You can continue without sharing this information",
      },
    ],
  },
  {
    key: "dietaryApproach",
    eyebrow: "DIABETES PERSONALISATION",
    title: "Which dietary approach best matches you?",
    description:
      "Choose the option that most closely reflects the way you currently prefer to eat.",
    options: [
      {
        value: "balanced",
        title: "Balanced diet",
        description: "A varied diet with foods from different food groups",
      },
      {
        value: "lower-carb",
        title: "Lower carbohydrate",
        description: "I generally try to reduce carbohydrate intake",
      },
      {
        value: "plant-focused",
        title: "Plant focused",
        description: "I prefer mostly plant-based foods",
      },
      {
        value: "no-specific",
        title: "No specific approach",
        description: "I do not currently follow a particular dietary approach",
      },
      {
        value: "prefer-not",
        title: "Prefer not to answer",
        description: "You can continue without sharing this information",
      },
    ],
  },
];

function ProgressBar({ step, theme }) {
  return (
    <View style={styles.progressWrapper}>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.primary,
              width: `${((step + 1) / STEPS.length) * 100}%`,
            },
          ]}
        />
      </View>

      <Text style={[styles.progressText, { color: theme.textSecondary }]}>
        Step {step + 1} of {STEPS.length}
      </Text>
    </View>
  );
}

function OptionCard({ option, selected, onPress, theme }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={option.title}
      style={({ pressed }) => [
        styles.optionCard,
        {
          backgroundColor: selected
            ? theme.surfaceSecondary
            : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        selected && styles.optionCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.radioOuter,
          {
            borderColor: selected ? theme.primary : theme.border,
          },
        ]}
      >
        {selected ? (
          <View
            style={[
              styles.radioInner,
              { backgroundColor: theme.primary },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.optionTextWrapper}>
        <Text
          style={[
            styles.optionTitle,
            {
              color: selected ? theme.primary : theme.text,
            },
          ]}
        >
          {option.title}
        </Text>

        <Text
          style={[
            styles.optionDescription,
            { color: theme.textSecondary },
          ]}
        >
          {option.description}
        </Text>
      </View>
    </Pressable>
  );
}

export default function DiabetesPersonalisationScreen({ navigation }) {
  const { theme } = useAppTheme();

  const [currentStep, setCurrentStep] = useState(0);

  const [answers, setAnswers] = useState({
    mealPattern: "",
    activityBaseline: "",
    dietaryApproach: "",
  });

  const [completed, setCompleted] = useState(false);

  const step = STEPS[currentStep];

  const currentAnswer = answers[step.key];

  const selectedLabels = useMemo(() => {
    const result = {};

    STEPS.forEach((item) => {
      const selected = item.options.find(
        (option) => option.value === answers[item.key]
      );

      result[item.key] = selected?.title || "Not answered";
    });

    return result;
  }, [answers]);

  const handleSelect = (value) => {
    setAnswers((previous) => ({
      ...previous,
      [step.key]: value,
    }));
  };

  const handleContinue = () => {
    if (!currentAnswer) {
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((previous) => previous + 1);
      return;
    }

    setCompleted(true);
  };

  const handleBack = () => {
    if (completed) {
      setCompleted(false);
      setCurrentStep(STEPS.length - 1);
      return;
    }

    if (currentStep > 0) {
      setCurrentStep((previous) => previous - 1);
      return;
    }

    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  const handleGoToNutritionSupport = () => {
    navigation.navigate("HealthPlanScreen");
  };

  if (completed) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.background },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.completedContainer}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.successIcon,
              { backgroundColor: theme.successBackground },
            ]}
          >
            <Text
              style={[
                styles.successIconText,
                { color: theme.success },
              ]}
            >
              ✓
            </Text>
          </View>

          <Text
            style={[
              styles.completeEyebrow,
              { color: theme.primary },
            ]}
          >
            PERSONALISATION COMPLETE
          </Text>

          <Text
            style={[
              styles.completeTitle,
              { color: theme.text },
            ]}
          >
            Your preferences are ready
          </Text>

          <Text
            style={[
              styles.completeDescription,
              { color: theme.textSecondary },
            ]}
          >
            Thank you. NutriHelp can use these preferences to provide
            more relevant nutrition support for your diabetes journey.
          </Text>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <SummaryRow
              label="Meal pattern"
              value={selectedLabels.mealPattern}
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                { backgroundColor: theme.border },
              ]}
            />

            <SummaryRow
              label="Activity baseline"
              value={selectedLabels.activityBaseline}
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                { backgroundColor: theme.border },
              ]}
            />

            <SummaryRow
              label="Dietary approach"
              value={selectedLabels.dietaryApproach}
              theme={theme}
            />
          </View>

          <View
            style={[
              styles.informationBox,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          >
            <Text
              style={[
                styles.informationText,
                { color: theme.textSecondary },
              ]}
            >
              These preferences are for personalisation only and are not
              a replacement for professional medical advice.
            </Text>
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleGoToNutritionSupport}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { color: theme.primaryText },
              ]}
            >
              Continue to Nutrition Support
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              { borderColor: theme.border },
            ]}
            onPress={handleBack}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: theme.text },
              ]}
            >
              Back
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backLink}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text
            style={[
              styles.backLinkText,
              { color: theme.text },
            ]}
          >
            ‹ Back
          </Text>
        </Pressable>

        <ProgressBar step={currentStep} theme={theme} />

        <Text
          style={[
            styles.eyebrow,
            { color: theme.primary },
          ]}
        >
          {step.eyebrow}
        </Text>

        <Text
          style={[
            styles.title,
            { color: theme.text },
          ]}
        >
          {step.title}
        </Text>

        <Text
          style={[
            styles.description,
            { color: theme.textSecondary },
          ]}
        >
          {step.description}
        </Text>

        <View
          accessibilityRole="radiogroup"
          style={styles.optionsContainer}
        >
          {step.options.map((option) => (
            <OptionCard
              key={option.value}
              option={option}
              selected={currentAnswer === option.value}
              onPress={() => handleSelect(option.value)}
              theme={theme}
            />
          ))}
        </View>

        <Pressable
          disabled={!currentAnswer}
          onPress={handleContinue}
          style={[
            styles.primaryButton,
            {
              backgroundColor: currentAnswer
                ? theme.primary
                : theme.disabled,
            },
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              {
                color: currentAnswer
                  ? theme.primaryText
                  : theme.textSecondary,
              },
            ]}
          >
            {currentStep === STEPS.length - 1
              ? "Complete Personalisation"
              : "Continue"}
          </Text>
        </Pressable>

        <Text
          style={[
            styles.footerText,
            { color: theme.textSecondary },
          ]}
        >
          You can update these preferences later.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, theme }) {
  return (
    <View style={styles.summaryRow}>
      <Text
        style={[
          styles.summaryLabel,
          { color: theme.textSecondary },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.summaryValue,
          { color: theme.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 40,
  },

  backLink: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    marginBottom: 8,
  },

  backLinkText: {
    fontSize: 16,
    fontWeight: "700",
  },

  progressWrapper: {
    marginBottom: 32,
  },

  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  progressText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
  },

  title: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 28,
  },

  optionsContainer: {
    marginBottom: 12,
  },

  optionCard: {
    minHeight: 78,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  optionCardSelected: {
    borderWidth: 2,
  },

  pressed: {
    opacity: 0.82,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  optionTextWrapper: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  optionDescription: {
    fontSize: 12,
    lineHeight: 17,
  },

  primaryButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 8,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  secondaryButton: {
    width: "100%",
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  footerText: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 16,
  },

  completedContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },

  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  successIconText: {
    fontSize: 40,
    fontWeight: "800",
  },

  completeEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 10,
  },

  completeTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    textAlign: "center",
  },

  completeDescription: {
    maxWidth: 330,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  summaryCard: {
    width: "100%",
    marginTop: 30,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },

  summaryRow: {
    paddingVertical: 15,
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
  },

  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
  },

  informationBox: {
    width: "100%",
    borderRadius: 10,
    padding: 14,
    marginTop: 18,
    marginBottom: 12,
  },

  informationText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});