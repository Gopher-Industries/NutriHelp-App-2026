import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DIET_TYPES = [
  { label: "Balanced", value: "balanced" },
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Vegan", value: "vegan" },
  { label: "Pescatarian", value: "pescatarian" },
  { label: "Gluten-Free", value: "gluten-free" },
  { label: "Low-Carb", value: "low-carb" },
  { label: "Mediterranean", value: "mediterranean" },
  { label: "Diabetic-Friendly", value: "diabetic-friendly" },
  { label: "High-Protein", value: "high-protein" },
];

const GOALS = [
  { label: "Maintain Weight", value: "maintain weight" },
  { label: "Lose Weight", value: "lose weight" },
  { label: "Gain Weight", value: "gain weight" },
  { label: "Manage Blood Sugar", value: "manage blood sugar" },
  { label: "Improve Heart Health", value: "improve heart health" },
  { label: "Build Strength", value: "build strength" },
];

const CUISINES = [
  { label: "Any cuisine", value: "any" },
  { label: "Mediterranean", value: "Mediterranean" },
  { label: "Asian", value: "Asian" },
  { label: "Western", value: "Western" },
  { label: "Indian", value: "Indian" },
  { label: "Middle Eastern", value: "Middle Eastern" },
];

const HEALTH_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Osteoporosis",
  "Heart Disease",
  "Kidney Disease",
  "Constipation",
  "Dysphagia",
];

const ALLERGIES = ["Nuts", "Dairy", "Gluten", "Soy", "Shellfish", "Eggs"];

const TEXTURES = [
  { title: "Regular", sub: "Normal foods", value: "regular" },
  { title: "Soft", sub: "Tender & moist", value: "soft" },
  { title: "Pureed", sub: "Fully blended", value: "pureed" },
];

const MOBILITY = [
  { label: "Sedentary", value: "sedentary" },
  { label: "Lightly Active", value: "lightly active" },
  { label: "Moderately Active", value: "moderately active" },
];

const COOKING = [
  { title: "Simple", sub: "≤30 min", value: "simple" },
  { title: "Moderate", sub: "Up to 1 hr", value: "moderate" },
  { title: "Complex", sub: "Any time", value: "complex" },
];

const PORTIONS = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

function SelectInput({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable style={styles.selectBtn} onPress={() => setOpen(true)}>
        <Text style={styles.selectValue}>{selected?.label ?? "Select..."}</Text>
        <Ionicons name="chevron-down" size={16} color="#6B7280" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView bounces={false}>
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.modalOption, active && styles.modalOptionActive]}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        active && styles.modalOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={16} color="#047857" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function ChipGroup({ options, selected, onToggle }) {
  return (
    <View style={styles.chipGrid}>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <Pressable
            key={option}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(option)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ButtonGroup({ options, value, onChange }) {
  return (
    <View style={styles.btnGroup}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.groupBtn, active && styles.groupBtnActive]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.groupBtnTitle, active && styles.groupBtnTitleActive]}>
              {opt.title ?? opt.label}
            </Text>
            {opt.sub ? (
              <Text style={[styles.groupBtnSub, active && styles.groupBtnSubActive]}>
                {opt.sub}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function AccordionSection({ title, open, onToggle, children }) {
  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={onToggle}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#374151"
        />
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

function FieldLabel({ text }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

export default function PersonalisedPlanForm({ onSubmit, onBack }) {
  const [dietType, setDietType] = useState("balanced");
  const [goal, setGoal] = useState("maintain weight");
  const [calories, setCalories] = useState("1800");
  const [calorieError, setCalorieError] = useState("");
  const [cuisine, setCuisine] = useState("any");

  const [healthConditions, setHealthConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [mealTexture, setMealTexture] = useState("regular");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [mobilityLevel, setMobilityLevel] = useState("sedentary");
  const [cookingComplexity, setCookingComplexity] = useState("simple");
  const [portionSize, setPortionSize] = useState("medium");

  const [sec1Open, setSec1Open] = useState(true);
  const [sec2Open, setSec2Open] = useState(true);
  const [sec3Open, setSec3Open] = useState(false);

  const toggleChip = (setter) => (value) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleSection = (setter) => () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter((prev) => !prev);
  };

  const handleSubmit = () => {
    const cal = parseInt(calories, 10);
    if (Number.isNaN(cal) || cal < 500 || cal > 5000) {
      setCalorieError("Please enter a value between 500 and 5000.");
      return;
    }
    setCalorieError("");

    const payload = {
      dietType,
      goal,
      calorieTarget: cal,
      allergies,
      healthConditions,
      mealTexture,
      mobilityLevel,
      cookingComplexity,
      portionSize,
      ...(cuisine !== "any" && { cuisine }),
      ...(additionalNotes.trim() && { additionalNotes: additionalNotes.trim() }),
    };

    onSubmit(payload);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#253B63" />
        </Pressable>
        <Text style={styles.headerTitle}>AI Meal Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Personalise Your Plan</Text>
        <Text style={styles.pageSubtitle}>
          Tell us about your goals and health to generate a tailored 7-day meal plan.
        </Text>

        <AccordionSection
          title="Basic Preferences"
          open={sec1Open}
          onToggle={toggleSection(setSec1Open)}
        >
          <FieldLabel text="Diet Type" />
          <SelectInput
            label="Diet Type"
            value={dietType}
            options={DIET_TYPES}
            onChange={setDietType}
          />

          <FieldLabel text="Goal" />
          <SelectInput
            label="Goal"
            value={goal}
            options={GOALS}
            onChange={setGoal}
          />

          <FieldLabel text="Daily Calories (kcal)" />
          <TextInput
            style={[styles.textInput, calorieError ? styles.textInputError : null]}
            value={calories}
            onChangeText={(v) => {
              setCalories(v);
              setCalorieError("");
            }}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="1800"
            placeholderTextColor="#9CA3AF"
          />
          {calorieError ? (
            <Text style={styles.errorText}>{calorieError}</Text>
          ) : null}

          <FieldLabel text="Cuisine Preference" />
          <SelectInput
            label="Cuisine"
            value={cuisine}
            options={CUISINES}
            onChange={setCuisine}
          />
        </AccordionSection>

        <AccordionSection
          title="Health & Medical"
          open={sec2Open}
          onToggle={toggleSection(setSec2Open)}
        >
          <FieldLabel text="Health Conditions" />
          <ChipGroup
            options={HEALTH_CONDITIONS}
            selected={healthConditions}
            onToggle={toggleChip(setHealthConditions)}
          />

          <FieldLabel text="Allergies" />
          <ChipGroup
            options={ALLERGIES}
            selected={allergies}
            onToggle={toggleChip(setAllergies)}
          />

          <FieldLabel text="Meal Texture" />
          <ButtonGroup
            options={TEXTURES}
            value={mealTexture}
            onChange={setMealTexture}
          />

          <FieldLabel text="Additional Notes" />
          <TextInput
            style={styles.notesInput}
            value={additionalNotes}
            onChangeText={(v) => {
              if (v.length <= 300) setAdditionalNotes(v);
            }}
            multiline
            numberOfLines={3}
            placeholder="e.g. On warfarin, prefer low-sodium meals..."
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.charCount}>{additionalNotes.length}/300</Text>
        </AccordionSection>

        <AccordionSection
          title="Lifestyle"
          open={sec3Open}
          onToggle={toggleSection(setSec3Open)}
        >
          <FieldLabel text="Mobility Level" />
          <ButtonGroup
            options={MOBILITY}
            value={mobilityLevel}
            onChange={setMobilityLevel}
          />

          <FieldLabel text="Cooking Complexity" />
          <ButtonGroup
            options={COOKING}
            value={cookingComplexity}
            onChange={setCookingComplexity}
          />

          <FieldLabel text="Portion Size" />
          <ButtonGroup
            options={PORTIONS}
            value={portionSize}
            onChange={setPortionSize}
          />
        </AccordionSection>

        <Pressable style={styles.submitBtn} onPress={handleSubmit}>
          <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>Generate My 7-Day Plan</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#253B63",
  },
  headerSpacer: { width: 44 },
  scroll: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: "#253B63", marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20, lineHeight: 20 },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#253B63" },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16 },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 14,
    marginBottom: 6,
  },

  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    minHeight: 44,
  },
  selectValue: { fontSize: 14, color: "#111827", flex: 1 },

  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    minHeight: 44,
  },
  textInputError: { borderColor: "#EF4444" },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 4 },

  notesInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: { fontSize: 11, color: "#9CA3AF", textAlign: "right", marginTop: 4 },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { borderColor: "#047857", backgroundColor: "#ECFDF5" },
  chipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  chipTextActive: { color: "#047857", fontWeight: "600" },

  btnGroup: { flexDirection: "row", gap: 8 },
  groupBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    minHeight: 52,
    justifyContent: "center",
  },
  groupBtnActive: { borderColor: "#047857", backgroundColor: "#ECFDF5" },
  groupBtnTitle: { fontSize: 13, fontWeight: "600", color: "#374151" },
  groupBtnTitleActive: { color: "#047857" },
  groupBtnSub: { fontSize: 10, color: "#9CA3AF", marginTop: 2 },
  groupBtnSubActive: { color: "#059669" },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#047857",
  },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#253B63",
    textAlign: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 4,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 44,
  },
  modalOptionActive: { backgroundColor: "#F0FDF4" },
  modalOptionText: { fontSize: 15, color: "#374151" },
  modalOptionTextActive: { color: "#047857", fontWeight: "600" },
});
