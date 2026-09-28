import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { useAccessibility } from "../../context/AccessibilityContext";
import {
  getAppointmentDateTime,
  getAppointmentId,
  getAppointmentNotes,
  parseTime,
  toDateString,
  toTimeString,
} from "./appointmentHelpers";

import { colors } from "../../theme";
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize = "sentences",
}) {
  const { fs, sh } = useAccessibility();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { fontSize: fs(13) }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { fontSize: fs(14), minHeight: sh(48) },
          multiline ? [styles.inputMultiline, { minHeight: sh(90) }] : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={label}
      />
    </View>
  );
}

function PickerField({ label, value, placeholder, icon, onPress }) {
  const { fs, sh } = useAccessibility();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { fontSize: fs(13) }]}>{label}</Text>
      <Pressable
        style={[styles.input, styles.pickerInput, { minHeight: sh(48) }]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
      >
        <Text
          style={[
            styles.pickerText,
            { fontSize: fs(14) },
            value ? null : styles.pickerPlaceholder,
          ]}
        >
          {value || placeholder}
        </Text>
        <Ionicons name={icon} size={fs(18)} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function buildInitialValues(appointment = {}) {
  return {
    title: appointment.title || appointment.description || "",
    doctor: appointment.doctor || appointment.provider || "",
    type: appointment.type || "",
    date: appointment.date ? String(appointment.date).slice(0, 10) : "",
    time: appointment.time || "",
    location: appointment.location || "",
    notes: getAppointmentNotes(appointment),
  };
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatDateLabel(dateString) {
  const when = getAppointmentDateTime({ date: dateString });
  if (!when) {
    return "";
  }
  return when.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLabel(timeString) {
  const time = parseTime(timeString);
  if (!time) {
    return "";
  }
  const date = new Date();
  date.setHours(time.hours, time.minutes, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function BookAppointmentScreen({ navigation, route }) {
  const { fs } = useAccessibility();
  const mode = route?.params?.mode === "reschedule" ? "reschedule" : "create";
  const existing = route?.params?.appointment || {};
  const appointmentId = getAppointmentId(existing);

  const [values, setValues] = useState(() => buildInitialValues(existing));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [pickerMode, setPickerMode] = useState(null);

  const headerTitle = useMemo(
    () => (mode === "reschedule" ? "Reschedule" : "Book appointment"),
    [mode]
  );

  const pickerValue = useMemo(() => {
    const selected = getAppointmentDateTime({
      date: values.date,
      time: values.time || "09:00",
    });
    return selected && selected >= new Date() ? selected : new Date();
  }, [values.date, values.time]);

  const updateField = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handlePickerChange = (event, selected) => {
    if (Platform.OS === "android") {
      setPickerMode(null);
    }
    if (event?.type === "dismissed" || !selected) {
      return;
    }
    if (pickerMode === "date") {
      updateField("date", toDateString(selected));
    } else {
      updateField("time", toTimeString(selected));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.title.trim()) {
      nextErrors.title = "Title is required.";
    }
    if (!values.date) {
      nextErrors.date = "Please choose a date.";
    }
    if (!values.time) {
      nextErrors.time = "Please choose a time.";
    } else if (!parseTime(values.time)) {
      nextErrors.time = "Please choose a valid time.";
    }
    if (!nextErrors.date && !nextErrors.time) {
      const when = getAppointmentDateTime({ date: values.date, time: values.time });
      if (!when || when <= new Date()) {
        nextErrors.date = "Please choose a date and time in the future.";
      }
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
      date: values.date,
      time: values.time,
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

  const renderError = (key) =>
    errors[key] ? (
      <Text style={[styles.errorText, { fontSize: fs(12) }]}>{errors[key]}</Text>
    ) : null;

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
          {renderError("title")}

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

          <PickerField
            label="Date"
            value={formatDateLabel(values.date)}
            placeholder="Select a date"
            icon="calendar-outline"
            onPress={() => setPickerMode("date")}
          />
          {renderError("date")}

          <PickerField
            label="Time"
            value={formatTimeLabel(values.time)}
            placeholder="Select a time"
            icon="time-outline"
            onPress={() => setPickerMode("time")}
          />
          {renderError("time")}

          {pickerMode ? (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={pickerValue}
                mode={pickerMode}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={pickerMode === "date" ? startOfToday() : undefined}
                onChange={handlePickerChange}
              />
              {Platform.OS === "ios" ? (
                <Button
                  label="Done"
                  variant="secondary"
                  onPress={() => {
                    handlePickerChange({ type: "set" }, pickerValue);
                    setPickerMode(null);
                  }}
                />
              ) : null}
            </View>
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
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  inputMultiline: {
    textAlignVertical: "top",
  },
  pickerInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: {
    flex: 1,
    color: colors.textPrimary,
  },
  pickerPlaceholder: {
    color: colors.textMuted,
  },
  pickerWrap: {
    marginBottom: 12,
  },
  errorText: {
    marginTop: -6,
    marginBottom: 10,
    color: colors.dangerDark,
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
  },
});
