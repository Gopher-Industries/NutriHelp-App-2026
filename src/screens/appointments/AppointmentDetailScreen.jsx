import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  cancelAppointment,
} from "../../api/appointmentApi";
import { toErrorMessage } from "../../api/baseApi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import NavigationHeader from "../../components/common/NavigationHeader";
import { useAccessibility } from "../../context/AccessibilityContext";
import {
  formatAppointmentWhen,
  getAppointmentId,
  getAppointmentNotes,
  getAppointmentTitle,
} from "./appointmentHelpers";

import { colors } from "../../theme";
function DetailRow({ label, value, icon }) {
  const { fs, sh } = useAccessibility();
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { width: sh(28) }]}>
        <Ionicons name={icon} size={fs(18)} color={colors.primary} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={[styles.detailLabel, { fontSize: fs(12) }]}>{label}</Text>
        <Text style={[styles.detailValue, { fontSize: fs(14) }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function AppointmentDetailScreen({ navigation, route }) {
  const { fs } = useAccessibility();
  const initialAppointment = route?.params?.appointment || {};
  const [appointment] = useState(initialAppointment);
  const [busy, setBusy] = useState(false);

  const appointmentId = useMemo(
    () => getAppointmentId(appointment),
    [appointment]
  );

  const handleCancel = () => {
    if (!appointmentId) {
      Alert.alert("Unable to cancel", "This appointment is missing an ID.");
      return;
    }

    Alert.alert(
      "Cancel appointment?",
      "This will remove the appointment. This action cannot be undone.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel appointment",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy(true);
              await cancelAppointment(appointmentId);
              Alert.alert("Cancelled", "The appointment has been cancelled.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert(
                "Cancel failed",
                toErrorMessage(err, "Unable to cancel this appointment.")
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleReschedule = () => {
    if (!appointmentId) {
      Alert.alert("Unable to reschedule", "This appointment is missing an ID.");
      return;
    }

    Alert.alert(
      "Reschedule appointment?",
      "You will be able to update the date and time on the next screen.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Continue",
          onPress: () =>
            navigation.navigate("BookAppointmentScreen", {
              mode: "reschedule",
              appointment,
            }),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <NavigationHeader
        title="Appointment"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {busy ? (
        <View style={styles.centered}>
          <LoadingSpinner message="Please wait..." />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { fontSize: fs(22) }]}>
            {getAppointmentTitle(appointment)}
          </Text>
          <Text style={[styles.when, { fontSize: fs(14) }]}>
            {formatAppointmentWhen(appointment)}
          </Text>

          <Card style={styles.card}>
            <DetailRow
              label="Doctor / Provider"
              value={appointment.doctor || appointment.provider}
              icon="person-outline"
            />
            <DetailRow
              label="Type"
              value={appointment.type}
              icon="medkit-outline"
            />
            <DetailRow
              label="Location"
              value={appointment.location}
              icon="location-outline"
            />
            <DetailRow
              label="Address"
              value={appointment.address}
              icon="map-outline"
            />
            <DetailRow
              label="Phone"
              value={appointment.phone}
              icon="call-outline"
            />
            <DetailRow
              label="Notes"
              value={getAppointmentNotes(appointment)}
              icon="document-text-outline"
            />
          </Card>

          <Button
            label="Reschedule"
            onPress={handleReschedule}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          />

          <Button
            label="Cancel appointment"
            onPress={handleCancel}
            variant="secondary"
            style={styles.dangerButton}
            textStyle={styles.dangerButtonText}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  title: {
    fontWeight: "800",
    color: colors.textPrimary,
  },
  when: {
    marginTop: 6,
    marginBottom: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailIcon: {
    marginTop: 2,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
  dangerButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRed,
    borderWidth: 1,
    borderColor: colors.borderDanger,
    borderRadius: 10,
    paddingVertical: 14,
  },
  dangerButtonText: {
    color: colors.dangerDark,
    fontWeight: "700",
  },
});
