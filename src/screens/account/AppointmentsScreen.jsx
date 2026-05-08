import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { cancelAppointment, getAppointments } from '../../api/appointmentApi';
import { colors, screenPadding, shadow, spacing } from '../../theme/nutriTheme';

export default function AppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getAppointments().then((response) => {
      const nextAppointments =
        response?.data?.items ||
        response?.data ||
        response?.appointments ||
        response?.items ||
        response ||
        [];
      setAppointments(Array.isArray(nextAppointments) ? nextAppointments : []);
    });
  }, []);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return appointments.filter((item) =>
      tab === 'upcoming' ? item.date >= today : item.date < today
    );
  }, [appointments, tab]);

  const confirmCancel = async () => {
    if (!selected) return;
    await cancelAppointment(selected.id);
    setAppointments((current) =>
      current.map((item) =>
        item.id === selected.id ? { ...item, status: 'Cancelled' } : item
      )
    );
    setSelected(null);
    Alert.alert('Appointment cancelled');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>Account</Text>
            <Text style={styles.title}>Appointments</Text>
            <View style={styles.segment}>
              {['upcoming', 'past'].map((item) => (
                <Text
                  key={item}
                  onPress={() => setTab(item)}
                  style={[styles.segmentItem, tab === item && styles.segmentActive]}
                >
                  {item}
                </Text>
              ))}
            </View>
            <Pressable
              style={styles.bookButton}
              onPress={() => navigation?.navigate?.('BookAppointment')}
            >
              <Text style={styles.bookText}>Book new appointment</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{item.type}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.detail}>{item.date} at {item.time}</Text>
            {tab === 'upcoming' && item.status !== 'Cancelled' && (
              <Pressable onPress={() => setSelected(item)}>
                <Text style={styles.cancelText}>Cancel appointment</Text>
              </Pressable>
            )}
          </View>
        )}
      />

      <Modal transparent visible={Boolean(selected)} animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Cancel appointment?</Text>
            <Text style={styles.detail}>
              This will cancel {selected?.type} on {selected?.date}.
            </Text>
            <Pressable style={styles.dangerButton} onPress={confirmCancel}>
              <Text style={styles.dangerText}>Confirm cancel</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>Keep appointment</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { ...screenPadding, paddingBottom: spacing.xl },
  eyebrow: { color: colors.primary, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginBottom: spacing.md },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmentItem: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 6,
    color: colors.muted,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  segmentActive: { backgroundColor: colors.surface, color: colors.primaryDark },
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bookText: { color: colors.surface, fontWeight: '900' },
  card: { ...shadow, backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { flex: 1, color: colors.ink, fontSize: 17, fontWeight: '900' },
  status: { color: colors.info, fontWeight: '900' },
  detail: { color: colors.muted, lineHeight: 22, marginTop: 6 },
  cancelText: { color: colors.danger, fontWeight: '900', marginTop: spacing.md },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.36)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 8, borderTopRightRadius: 8, padding: spacing.lg },
  sheetTitle: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  dangerButton: { backgroundColor: colors.danger, borderRadius: 8, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  dangerText: { color: colors.surface, fontWeight: '900' },
  closeButton: { padding: spacing.md, alignItems: 'center' },
  closeText: { color: colors.primary, fontWeight: '900' },
});
