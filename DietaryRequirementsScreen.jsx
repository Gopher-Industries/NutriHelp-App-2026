import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { getDietaryRequirements, getAllergies } from "../../api/foodDataApi";
import {
  getUserPreferences,
  saveUserPreferences,
  PREFERENCE_FIELDS,
} from "../../api/userPreferencesApi";
import { toErrorMessage } from "../../api/baseApi";

/**
 * FE-T2-10 — Connect Dietary Requirements page to backend.
 *
 * Loads the dietary-requirement and allergy catalogues plus the user's saved
 * preferences, lets them toggle selections, and saves back to the backend
 * health-preferences model. Selections reload on revisit and the other
 * preference fields are preserved so nothing is lost on save.
 */

// Turn API failures into a clean, user-facing message. Server 404s / gateway
// errors often return an HTML page — never surface that raw markup to the user.
function friendlyError(error, fallback) {
  const status = error?.status;
  const message = toErrorMessage(error, "");
  const looksLikeHtml = typeof message === "string" && message.trim().startsWith("<");

  if (status === 401) return "Please log in to manage your dietary requirements.";
  if (status === 404) return "This feature isn’t available on the server yet.";
  if (status >= 500) return "The server is unavailable right now. Please try again later.";
  if (!message || looksLikeHtml) return fallback;
  return message;
}

export default function DietaryRequirementsScreen({ navigation }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");

  const [dietaryOptions, setDietaryOptions] = useState([]);
  const [allergyOptions, setAllergyOptions] = useState([]);

  const [selectedDietary, setSelectedDietary] = useState([]); // number[]
  const [selectedAllergies, setSelectedAllergies] = useState([]); // number[]
  // Preferences we don't edit here but must send back unchanged on save.
  const [preservedFields, setPreservedFields] = useState({});

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    setSaveMessage("");
    try {
      const [dietary, allergies, prefs] = await Promise.all([
        getDietaryRequirements(),
        getAllergies(),
        getUserPreferences(),
      ]);
      setDietaryOptions(dietary);
      setAllergyOptions(allergies);
      setSelectedDietary(prefs.fields.dietary_requirements || []);
      setSelectedAllergies(prefs.fields.allergies || []);

      // Keep the fields this screen doesn't manage so save doesn't wipe them.
      const preserved = {};
      for (const field of PREFERENCE_FIELDS) {
        if (field !== "dietary_requirements" && field !== "allergies") {
          preserved[field] = prefs.fields[field] || [];
        }
      }
      setPreservedFields(preserved);
      setStatus("ready");
    } catch (e) {
      setErrorMessage(friendlyError(e, "Couldn’t load your dietary requirements."));
      setStatus("error");
    }
  }, []);

  // Reload every time the screen is focused so saved selections always reflect
  // what's on the backend (DoD: preferences persist / reload on revisit).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggle = (list, setList, id) => {
    setSaveMessage("");
    setList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSave = async () => {
    setSaving(true);
    setSaveMessage("");
    setErrorMessage("");
    try {
      await saveUserPreferences({
        ...preservedFields,
        dietary_requirements: selectedDietary,
        allergies: selectedAllergies,
      });
      setSaveMessage("Preferences saved.");
    } catch (e) {
      setErrorMessage(friendlyError(e, "Couldn’t save your changes. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <SafeAreaView style={styles.centerWrap} edges={["top"]}>
        <ActivityIndicator size="large" color="#0B5FA5" />
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView style={styles.centerWrap} edges={["top"]}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const Chip = ({ item, selected, onPress }) => (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={item.name}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {item.name}
      </Text>
      {selected ? (
        <Ionicons name="checkmark-circle" size={14} color="#0B5FA5" />
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => navigation?.goBack?.()}>
            <Ionicons name="chevron-back" size={22} color="#0B5FA5" />
          </Pressable>
          <Text style={styles.title}>Dietary Requirements</Text>
          <View style={styles.iconButton} />
        </View>

        <Text style={styles.sectionTitle}>DIETARY REQUIREMENTS</Text>
        <View style={styles.card}>
          <View style={styles.chipWrap}>
            {dietaryOptions.length === 0 ? (
              <Text style={styles.emptyText}>No options available.</Text>
            ) : (
              dietaryOptions.map((item) => (
                <Chip
                  key={`diet-${item.id}`}
                  item={item}
                  selected={selectedDietary.includes(item.id)}
                  onPress={() => toggle(selectedDietary, setSelectedDietary, item.id)}
                />
              ))
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>ALLERGIES</Text>
        <View style={styles.card}>
          <View style={styles.chipWrap}>
            {allergyOptions.length === 0 ? (
              <Text style={styles.emptyText}>No options available.</Text>
            ) : (
              allergyOptions.map((item) => (
                <Chip
                  key={`allergy-${item.id}`}
                  item={item}
                  selected={selectedAllergies.includes(item.id)}
                  onPress={() => toggle(selectedAllergies, setSelectedAllergies, item.id)}
                />
              ))
            )}
          </View>
        </View>

        {errorMessage ? <Text style={styles.inlineError}>{errorMessage}</Text> : null}
        {saveMessage ? <Text style={styles.inlineSuccess}>{saveMessage}</Text> : null}

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save dietary requirements"
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  centerWrap: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: { paddingHorizontal: 22, paddingBottom: 40 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: "#18233D" },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9CA3AF",
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    backgroundColor: "#EEF3FF",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D9E2F4",
    backgroundColor: "#FFFFFF",
  },
  chipActive: { borderColor: "#0B5FA5", backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  chipTextActive: { color: "#0B5FA5" },
  emptyText: { fontSize: 13, color: "#6B7280", paddingVertical: 6 },
  inlineError: { color: "#D62828", fontSize: 13, marginTop: 16 },
  inlineSuccess: { color: "#10703E", fontSize: 13, fontWeight: "600", marginTop: 16 },
  errorText: { color: "#D62828", fontSize: 14, textAlign: "center", marginBottom: 16 },
  retryButton: {
    backgroundColor: "#0B5FA5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: "#FFFFFF", fontWeight: "700" },
  saveButton: {
    marginTop: 22,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#10703E",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: { backgroundColor: "#7FB79A" },
  saveText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
