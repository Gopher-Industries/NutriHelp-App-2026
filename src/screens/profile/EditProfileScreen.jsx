import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import profileApi from "../../api/profileApi";
import { useUser } from "../../context/UserContext";

const DIETARY_OPTIONS = [
  "Balanced",
  "Vegan",
  "Vegetarian",
  "Keto",
  "Low Carb",
  "Low Sodium",
  "Gluten Free",
  "Dairy Free",
  "Paleo",
  "Mediterranean",
];

function buildInitials(firstName = "", lastName = "") {
  const first = String(firstName).trim();
  const last = String(lastName).trim();
  if (!first && !last) return "NH";
  if (!last) return first.slice(0, 2).toUpperCase();
  return `${first[0]}${last[0]}`.toUpperCase();
}

function LabeledInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  secureTextEntry = false,
  error,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function toFormValues(profile = {}, fallbackUser = null) {
  const fallbackName = fallbackUser?.name || fallbackUser?.full_name || "";
  const fallbackEmail = fallbackUser?.email || "";
  const [defaultFirst = "", ...rest] = (profile?.fullName || profile?.name || fallbackName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const defaultLast = rest.join(" ");

  return {
    firstName: profile?.first_name || defaultFirst,
    lastName: profile?.last_name || defaultLast,
    contactNumber: profile?.contactNumber || profile?.contact_number || "",
    email: profile?.email || fallbackEmail,
    address: profile?.address || "",
    dateOfBirth: profile?.date_of_birth || profile?.dateOfBirth || "",
    dietaryPreference: profile?.dietary_preference || profile?.dietaryPreference || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

export default function EditProfileScreen({ navigation, route }) {
  const { logout, user } = useUser();
  const initialProfile = route?.params?.initialProfile || null;
  const [loading, setLoading] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => toFormValues(initialProfile, user));
  const [errors, setErrors] = useState({});
  const [dietPickerVisible, setDietPickerVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const profile = await profileApi.getProfile();
        if (!cancelled) {
          setForm((previous) => ({
            ...toFormValues(profile, user),
            currentPassword: previous.currentPassword,
            newPassword: previous.newPassword,
            confirmPassword: previous.confirmPassword,
          }));
        }
      } catch (error) {
        if (!cancelled && !initialProfile) {
          Alert.alert("Edit Profile", error.message || "Failed to load profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [initialProfile, user]);

  const initials = useMemo(
    () => buildInitials(form.firstName, form.lastName),
    [form.firstName, form.lastName]
  );

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) {
      setErrors((previous) => ({ ...previous, [key]: null }));
    }
  };

  const validate = () => {
    const next = {};

    if (!form.firstName.trim()) {
      next.firstName = "First name is required.";
    }

    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email address.";
    }

    if (form.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) {
      next.dateOfBirth = "Use format YYYY-MM-DD (e.g. 1990-05-20).";
    }

    if (form.currentPassword || form.newPassword || form.confirmPassword) {
      if (!form.currentPassword) {
        next.currentPassword = "Current password is required.";
      }
      if (!form.newPassword) {
        next.newPassword = "New password is required.";
      } else if (form.newPassword.length < 8) {
        next.newPassword = "Password must be at least 8 characters.";
      }
      if (form.newPassword && form.newPassword !== form.confirmPassword) {
        next.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      await profileApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        contactNumber: form.contactNumber,
        address: form.address,
        dateOfBirth: form.dateOfBirth || undefined,
        dietaryPreference: form.dietaryPreference || undefined,
      });

      if (form.currentPassword || form.newPassword || form.confirmPassword) {
        const passwordResponse = await profileApi.updatePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        });

        const payload = passwordResponse?.data || passwordResponse;
        if (payload?.requireReauthentication) {
          Alert.alert(
            "Password Updated",
            "Your password was changed. Please sign in again.",
            [{ text: "OK", onPress: logout }]
          );
          return;
        }
      }

      Alert.alert("Profile", "Changes saved successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Edit Profile", error.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingWrap} edges={["top"]}>
        <ActivityIndicator size="large" color="#0B5FA5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#18233D" />
          </Pressable>
          <Text style={styles.logoText}>NutriHelp</Text>
          <View style={styles.iconSpacer} />
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.avatarAction}>
            <Ionicons name="camera-outline" size={18} color="#0B5FA5" />
          </View>
          <Text style={styles.editPhotoLabel}>Edit photo</Text>
        </View>

        <View style={styles.nameRow}>
          <View style={styles.nameHalf}>
            <Text style={styles.inputLabel}>FIRST NAME</Text>
            <TextInput
              style={[styles.input, errors.firstName ? styles.inputError : null]}
              placeholder="First name"
              placeholderTextColor="#9CA3AF"
              value={form.firstName}
              onChangeText={(v) => updateField("firstName", v)}
              autoCapitalize="words"
            />
            {errors.firstName ? (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            ) : null}
          </View>
          <View style={styles.nameHalfRight}>
            <Text style={styles.inputLabel}>LAST NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor="#9CA3AF"
              value={form.lastName}
              onChangeText={(v) => updateField("lastName", v)}
              autoCapitalize="words"
            />
          </View>
        </View>

        <LabeledInput
          label="EMAIL"
          placeholder="Enter your email"
          value={form.email}
          onChangeText={(v) => updateField("email", v)}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <LabeledInput
          label="PHONE"
          placeholder="+61 400 000 000"
          value={form.contactNumber}
          onChangeText={(v) => updateField("contactNumber", v)}
          keyboardType="phone-pad"
        />

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>DATE OF BIRTH</Text>
          <TextInput
            style={[styles.input, errors.dateOfBirth ? styles.inputError : null]}
            placeholder="YYYY-MM-DD  e.g. 1990-05-20"
            placeholderTextColor="#9CA3AF"
            value={form.dateOfBirth}
            onChangeText={(v) => updateField("dateOfBirth", v)}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          {errors.dateOfBirth ? (
            <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>DIETARY PREFERENCE</Text>
          <Pressable
            style={[styles.input, styles.pickerButton]}
            onPress={() => setDietPickerVisible(true)}
          >
            <Text style={[styles.pickerText, !form.dietaryPreference && styles.pickerPlaceholder]}>
              {form.dietaryPreference || "Select a preference..."}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        <LabeledInput
          label="ADDRESS"
          placeholder="Enter your address"
          value={form.address}
          onChangeText={(v) => updateField("address", v)}
        />

        <View style={styles.divider} />
        <Text style={styles.sectionHeading}>Change Password</Text>

        <LabeledInput
          label="CURRENT PASSWORD"
          placeholder="Enter current password"
          value={form.currentPassword}
          onChangeText={(v) => updateField("currentPassword", v)}
          autoCapitalize="none"
          secureTextEntry
          error={errors.currentPassword}
        />
        <LabeledInput
          label="NEW PASSWORD"
          placeholder="Min. 8 characters"
          value={form.newPassword}
          onChangeText={(v) => updateField("newPassword", v)}
          autoCapitalize="none"
          secureTextEntry
          error={errors.newPassword}
        />
        <LabeledInput
          label="CONFIRM PASSWORD"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChangeText={(v) => updateField("confirmPassword", v)}
          autoCapitalize="none"
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Pressable
          style={[styles.saveButton, saving ? styles.buttonDisabled : null]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : null}
          <Text style={styles.saveButtonText}>
            {saving ? "  Saving..." : "Save Changes"}
          </Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </ScrollView>

      <Modal
        transparent
        animationType="slide"
        visible={dietPickerVisible}
        onRequestClose={() => setDietPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.pickerBackdrop} onPress={() => setDietPickerVisible(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerSheetTitle}>Dietary Preference</Text>
            <ScrollView>
              {DIETARY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.pickerOption,
                    form.dietaryPreference === option && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    updateField("dietaryPreference", option);
                    setDietPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      form.dietaryPreference === option && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {form.dietaryPreference === option ? (
                    <Ionicons name="checkmark" size={20} color="#0B5FA5" />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingWrap: { flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 22, paddingBottom: 34 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  iconSpacer: { width: 36, height: 36 },
  logoText: { fontSize: 15, fontWeight: "700", color: "#18233D" },
  avatarSection: { alignItems: "center", marginBottom: 20 },
  avatarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#DCE7FB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 34, fontWeight: "900", color: "#173E6A" },
  avatarAction: {
    marginTop: -16,
    marginLeft: 72,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  editPhotoLabel: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#0B5FA5" },
  nameRow: { flexDirection: "row", marginBottom: 12 },
  nameHalf: { flex: 1, marginRight: 6 },
  nameHalfRight: { flex: 1, marginLeft: 6 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { marginBottom: 6, fontSize: 10, fontWeight: "800", color: "#6B7280" },
  input: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#EAF0FF",
    borderWidth: 1,
    borderColor: "#D8E1F5",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#18233D",
  },
  inputError: { borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
  errorText: { marginTop: 4, fontSize: 12, color: "#EF4444" },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 14,
  },
  pickerText: { fontSize: 14, color: "#18233D", flex: 1 },
  pickerPlaceholder: { color: "#9CA3AF" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 },
  sectionHeading: { fontSize: 14, fontWeight: "800", color: "#374151", marginBottom: 12 },
  saveButton: {
    marginTop: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#0B5FA5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  saveButtonText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  cancelButton: {
    marginTop: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E1E8F7",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: { fontSize: 15, fontWeight: "700", color: "#55627D" },
  buttonDisabled: { opacity: 0.7 },
  pickerOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" },
  pickerBackdrop: { flex: 1 },
  pickerSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: "60%",
  },
  pickerHandle: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D0D5DD",
    marginBottom: 16,
  },
  pickerSheetTitle: { fontSize: 18, fontWeight: "800", color: "#18233D", marginBottom: 12 },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerOptionSelected: { backgroundColor: "#EAF0FF", borderRadius: 8, paddingHorizontal: 8 },
  pickerOptionText: { fontSize: 16, color: "#374151" },
  pickerOptionTextSelected: { fontWeight: "700", color: "#0B5FA5" },
});
