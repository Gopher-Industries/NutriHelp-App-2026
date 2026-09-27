import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
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
import {
  formatAppointmentWhen,
  getAppointmentId,
  getAppointmentTitle,
  normalizeAppointmentsResponse,
} from "./appointmentHelpers";

import { colors } from "../../theme";
function AppointmentCard({ appointment, onPress }) {
  const title = getAppointmentTitle(appointment);
  const when = formatAppointmentWhen(appointment);
  const doctor = appointment?.doctor || appointment?.provider || "";
  const location = appointment?.location || "";

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardIcon}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.cardMeta}>{when}</Text>
          {doctor ? (
            <Text style={styles.cardSub} numberOfLines={1}>
              {doctor}
            </Text>
          ) : null}
          {location ? (
            <Text style={styles.cardSub} numberOfLines={1}>
              {location}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

export default function AppointmentsScreen({ navigation }) {
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
          >
            <Ionicons name="add" size={26} color={colors.primary} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <LoadingSpinner message="Loading appointments..." />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item, index) =>
            String(getAppointmentId(item) ?? `appointment-${index}`)
          }
          contentContainerStyle={
            appointments.length === 0 ? styles.emptyList : styles.list
          }
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
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={() => loadAppointments()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !error ? (
              <EmptyState message="No upcoming appointments. Tap + to book one." />
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceBlueTint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardMeta: {
    marginTop: 2,
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  cardSub: {
    marginTop: 2,
    fontSize: 12,
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
    fontSize: 13,
  },
  retryText: {
    marginTop: 8,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});
