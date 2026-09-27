import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
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
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";

import { colors } from "../../theme";
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
        placeholderTextColor={colors.textMuted}
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
  const { showToast } = useToast();
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

      showToast("Changes saved successfully.", "success");
      navigation.goBack();
    } catch (error) {
      showToast(error.message || "Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingWrap} edges={["top"]}>
        <LoadingSpinner />
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
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.logoText}>NutriHelp</Text>
          <View style={styles.iconSpacer} />
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.avatarAction}>
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.editPhotoLabel}>Edit photo</Text>
        </View>

        <View style={styles.nameRow}>
          <View style={styles.nameHalf}>
            <Text style={styles.inputLabel}>FIRST NAME</Text>
            <TextInput
              style={[styles.input, errors.firstName ? styles.inputError : null]}
              placeholder="First name"
              placeholderTextColor={colors.textMuted}
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
              placeholderTextColor={colors.textMuted}
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
            placeholderTextColor={colors.textMuted}
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
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
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

        <Button
          label="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
        />

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
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
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
  safeArea: { flex: 1, backgroundColor: colors.white },
  loadingWrap: { flex: 1, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  screen: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 22, paddingBottom: 34 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  iconSpacer: { width: 36, height: 36 },
  logoText: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  avatarSection: { alignItems: "center", marginBottom: 20 },
  avatarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.c_dce7fb,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 34, fontWeight: "900", color: colors.c_173e6a },
  avatarAction: {
    marginTop: -16,
    marginLeft: 72,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  editPhotoLabel: { marginTop: 6, fontSize: 12, fontWeight: "700", color: colors.primary },
  nameRow: { flexDirection: "row", marginBottom: 12 },
  nameHalf: { flex: 1, marginRight: 6 },
  nameHalfRight: { flex: 1, marginLeft: 6 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { marginBottom: 6, fontSize: 10, fontWeight: "800", color: colors.textSecondary },
  input: {
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.c_eaf0ff,
    borderWidth: 1,
    borderColor: colors.c_d8e1f5,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.danger, backgroundColor: colors.c_fff5f5 },
  errorText: { marginTop: 4, fontSize: 12, color: colors.danger },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 14,
  },
  pickerText: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  pickerPlaceholder: { color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  sectionHeading: { fontSize: 14, fontWeight: "800", color: colors.textGray700, marginBottom: 12 },
  saveButton: {
    marginTop: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  saveButtonText: { fontSize: 15, fontWeight: "800", color: colors.white },
  cancelButton: {
    marginTop: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.c_e1e8f7,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: { fontSize: 15, fontWeight: "700", color: colors.c_55627d },
  pickerOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" },
  pickerBackdrop: { flex: 1 },
  pickerSheet: {
    backgroundColor: colors.white,
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
    backgroundColor: colors.c_d0d5dd,
    marginBottom: 16,
  },
  pickerSheetTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginBottom: 12 },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceGray,
  },
  pickerOptionSelected: { backgroundColor: colors.c_eaf0ff, borderRadius: 8, paddingHorizontal: 8 },
  pickerOptionText: { fontSize: 16, color: colors.textGray700 },
  pickerOptionTextSelected: { fontWeight: "700", color: colors.primary },
});
