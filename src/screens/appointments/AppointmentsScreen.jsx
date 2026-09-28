import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAppointments } from "../../api/appointmentApi";
import { toErrorMessage } from "../../api/baseApi";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import NavigationHeader from "../../components/common/NavigationHeader";
import { useAccessibility } from "../../context/AccessibilityContext";
import {
  formatAppointmentWhen,
  getAppointmentId,
  getAppointmentTitle,
  normalizeAppointmentsResponse,
  splitAppointments,
} from "./appointmentHelpers";

import { colors } from "../../theme";
function AppointmentCard({ appointment, onPress }) {
  const { fs, sh } = useAccessibility();
  const title = getAppointmentTitle(appointment);
  const when = formatAppointmentWhen(appointment);
  const doctor = appointment?.doctor || appointment?.provider || "";
  const location = appointment?.location || "";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${when}`}
    >
      <Card style={styles.card}>
        <View
          style={[
            styles.cardIcon,
            { width: sh(40), height: sh(40), borderRadius: sh(20) },
          ]}
        >
          <Ionicons name="calendar-outline" size={fs(20)} color={colors.primary} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { fontSize: fs(15) }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.cardMeta, { fontSize: fs(13) }]}>{when}</Text>
          {doctor ? (
            <Text style={[styles.cardSub, { fontSize: fs(12) }]} numberOfLines={2}>
              {doctor}
            </Text>
          ) : null}
          {location ? (
            <Text style={[styles.cardSub, { fontSize: fs(12) }]} numberOfLines={2}>
              {location}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={fs(18)} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

export default function AppointmentsScreen({ navigation }) {
  const { fs, sh } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = useCallback(async ({ isRefresh = false } = {}) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const response = await getAppointments({ page: 1, pageSize: 50 });
      setAppointments(normalizeAppointmentsResponse(response));
    } catch (err) {
      setError(toErrorMessage(err, "Unable to load appointments."));
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const sections = useMemo(() => {
    const { upcoming, past } = splitAppointments(appointments);
    const result = [{ key: "upcoming", title: "Upcoming", data: upcoming }];
    if (past.length > 0) {
      result.push({ key: "past", title: "Past", data: past });
    }
    return result;
  }, [appointments]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <NavigationHeader
        title="Appointments"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightAction={
          <Pressable
            onPress={() => navigation.navigate("BookAppointmentScreen")}
            hitSlop={8}
            style={[styles.addButton, { minWidth: sh(44), minHeight: sh(44) }]}
            accessibilityRole="button"
            accessibilityLabel="Book appointment"
          >
            <Ionicons name="add" size={fs(26)} color={colors.primary} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <LoadingSpinner message="Loading appointments..." />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) =>
            String(getAppointmentId(item) ?? `appointment-${index}`)
          }
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAppointments({ isRefresh: true })}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            error ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { fontSize: fs(13) }]}>{error}</Text>
                <Pressable
                  onPress={() => loadAppointments()}
                  style={{ minHeight: sh(44), justifyContent: "center" }}
                  accessibilityRole="button"
                >
                  <Text style={[styles.retryText, { fontSize: fs(13) }]}>Try again</Text>
                </Pressable>
              </View>
            ) : null
          }
          renderSectionHeader={({ section }) => (
            <Text
              style={[styles.sectionTitle, { fontSize: fs(13) }]}
              accessibilityRole="header"
            >
              {section.title}
            </Text>
          )}
          renderSectionFooter={({ section }) =>
            section.key === "upcoming" && section.data.length === 0 && !error ? (
              <EmptyState
                message="No upcoming appointments. Tap + to book one."
                style={styles.empty}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() =>
                navigation.navigate("AppointmentDetailScreen", {
                  appointment: item,
                })
              }
            />
          )}
        />
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
  addButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empty: {
    marginTop: 16,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardIcon: {
    backgroundColor: colors.surfaceBlueTint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardMeta: {
    marginTop: 2,
    color: colors.primary,
    fontWeight: "600",
  },
  cardSub: {
    marginTop: 2,
    color: colors.textSecondary,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: colors.borderDanger,
    backgroundColor: colors.surfaceRed,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: colors.dangerDark,
  },
  retryText: {
    marginTop: 8,
    color: colors.primary,
    fontWeight: "700",
  },
});
