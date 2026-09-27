import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createAppointment,
  updateAppointment,
} from "../../api/appointmentApi";
import { toErrorMessage } from "../../api/baseApi";
import Button from "../../components/common/Button";
import NavigationHeader from "../../components/common/NavigationHeader";
import { getAppointmentId } from "./appointmentHelpers";

import { colors } from "../../theme";
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize = "sentences",
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline ? styles.inputMultiline : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function buildInitialValues(appointment = {}) {
  return {
    title: appointment.title || appointment.description || "",
    doctor: appointment.doctor || appointment.provider || "",
    type: appointment.type || "",
    date: appointment.date || "",
    time: appointment.time || "",
    location: appointment.location || "",
    notes: appointment.notes || appointment.description || "",
  };
}

export default function BookAppointmentScreen({ navigation, route }) {
  const mode = route?.params?.mode === "reschedule" ? "reschedule" : "create";
  const existing = route?.params?.appointment || {};
  const appointmentId = getAppointmentId(existing);

  const [values, setValues] = useState(() => buildInitialValues(existing));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const headerTitle = useMemo(
    () => (mode === "reschedule" ? "Reschedule" : "Book appointment"),
    [mode]
  );

  const updateField = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.title.trim()) {
      nextErrors.title = "Title is required.";
    }
    if (!values.date.trim()) {
      nextErrors.date = "Date is required (YYYY-MM-DD).";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date.trim())) {
      nextErrors.date = "Use YYYY-MM-DD format.";
    }
    if (!values.time.trim()) {
      nextErrors.time = "Time is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      title: values.title.trim(),
      doctor: values.doctor.trim() || undefined,
      type: values.type.trim() || undefined,
      date: values.date.trim(),
      time: values.time.trim(),
      location: values.location.trim() || undefined,
      notes: values.notes.trim() || undefined,
    };

    try {
      setSubmitting(true);

      if (mode === "reschedule") {
        if (!appointmentId) {
          throw new Error("Missing appointment ID for reschedule.");
        }
        await updateAppointment(appointmentId, payload);
        Alert.alert("Updated", "Appointment has been rescheduled.", [
          {
            text: "OK",
            onPress: () => navigation.navigate("AppointmentsScreen"),
          },
        ]);
        return;
      }

      await createAppointment(payload);
      Alert.alert("Booked", "Appointment has been created.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("AppointmentsScreen"),
        },
      ]);
    } catch (err) {
      Alert.alert(
        mode === "reschedule" ? "Reschedule failed" : "Booking failed",
        toErrorMessage(err, "Unable to save this appointment.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <NavigationHeader
        title={headerTitle}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field
            label="Title"
            value={values.title}
            onChangeText={(text) => updateField("title", text)}
            placeholder="e.g. GP checkup"
          />
          {errors.title ? (
            <Text style={styles.errorText}>{errors.title}</Text>
          ) : null}

          <Field
            label="Doctor / Provider"
            value={values.doctor}
            onChangeText={(text) => updateField("doctor", text)}
            placeholder="e.g. Dr. Smith"
          />

          <Field
            label="Type"
            value={values.type}
            onChangeText={(text) => updateField("type", text)}
            placeholder="e.g. Consultation"
          />

          <Field
            label="Date (YYYY-MM-DD)"
            value={values.date}
            onChangeText={(text) => updateField("date", text)}
            placeholder="2026-09-30"
            autoCapitalize="none"
          />
          {errors.date ? (
            <Text style={styles.errorText}>{errors.date}</Text>
          ) : null}

          <Field
            label="Time"
            value={values.time}
            onChangeText={(text) => updateField("time", text)}
            placeholder="e.g. 14:30"
            autoCapitalize="none"
          />
          {errors.time ? (
            <Text style={styles.errorText}>{errors.time}</Text>
          ) : null}

          <Field
            label="Location"
            value={values.location}
            onChangeText={(text) => updateField("location", text)}
            placeholder="Clinic or hospital name"
          />

          <Field
            label="Notes"
            value={values.notes}
            onChangeText={(text) => updateField("notes", text)}
            placeholder="Optional notes"
            multiline
          />

          <Button
            label={mode === "reschedule" ? "Save changes" : "Book appointment"}
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitButton}
            textStyle={styles.submitText}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    paddingTop: 8,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textGray700,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  errorText: {
    marginTop: -6,
    marginBottom: 10,
    color: colors.dangerDark,
    fontSize: 12,
  },
  submitButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
