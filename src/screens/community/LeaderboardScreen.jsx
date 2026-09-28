import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCommunity } from "../../context/CommunityContext";

const PRIMARY = "#0B5FA5";

const RANK_COLOURS = {
  1: "#F59E0B",
  2: "#64748B",
  3: "#B45309",
};

export default function LeaderboardScreen({ navigation }) {
  const { leaders } = useCommunity();

  const renderLeader = ({ item, index }) => {
    const rank = index + 1;
    const rankColour = RANK_COLOURS[rank] || PRIMARY;

    return (
      <View style={styles.leaderCard}>
        <View
          style={[
            styles.rankContainer,
            { backgroundColor: `${rankColour}18` },
          ]}
        >
          {rank <= 3 ? (
            <Ionicons color={rankColour} name="trophy" size={21} />
          ) : (
            <Text style={[styles.rankText, { color: rankColour }]}>
              {rank}
            </Text>
          )}
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberBadge}>{item.badge}</Text>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.points}>{item.points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>points</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to community feed"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons color="#0F172A" name="arrow-back" size={24} />
        </Pressable>

        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={leaders}
        keyExtractor={(item) => item.id}
        renderItem={renderLeader}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Ionicons color="#FFFFFF" name="trophy" size={32} />
              </View>

              <Text style={styles.heroTitle}>Community Champions</Text>

              <Text style={styles.heroDescription}>
                Celebrate members who encourage healthy habits and
                positively support the NutriHelp community.
              </Text>
            </View>

            <View style={styles.yourProgressCard}>
              <View style={styles.yourProgressIcon}>
                <Ionicons color={PRIMARY} name="person" size={22} />
              </View>

              <View style={styles.yourProgressDetails}>
                <Text style={styles.yourProgressTitle}>Your progress</Text>
                <Text style={styles.yourProgressText}>
                  Share helpful posts and support others to earn points.
                </Text>
              </View>

              <View style={styles.yourPoints}>
                <Text style={styles.yourPointsValue}>120</Text>
                <Text style={styles.yourPointsLabel}>points</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Top contributors</Text>
          </>
        }
        ListFooterComponent={
          <View style={styles.informationCard}>
            <Ionicons
              color="#047857"
              name="information-circle-outline"
              size={21}
            />
            <Text style={styles.informationText}>
              This MVP leaderboard uses demonstration data. Future API
              integration can calculate rankings from real community
              activity.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              color="#94A3B8"
              name="trophy-outline"
              size={48}
            />
            <Text style={styles.emptyTitle}>No rankings available</Text>
            <Text style={styles.emptyText}>
              Community rankings will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 60,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: PRIMARY,
    borderRadius: 18,
    marginBottom: 14,
    padding: 22,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 31,
    height: 62,
    justifyContent: "center",
    width: 62,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "700",
    marginTop: 13,
  },
  heroDescription: {
    color: "#E5F2FC",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    textAlign: "center",
  },
  yourProgressCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 22,
    padding: 14,
  },
  yourProgressIcon: {
    alignItems: "center",
    backgroundColor: "#EAF3FB",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  yourProgressDetails: {
    flex: 1,
    marginLeft: 11,
  },
  yourProgressTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  yourProgressText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  yourPoints: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  yourPointsValue: {
    color: PRIMARY,
    fontSize: 18,
    fontWeight: "800",
  },
  yourPointsLabel: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 1,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 11,
  },
  leaderCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    padding: 13,
  },
  rankContainer: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  rankText: {
    fontSize: 15,
    fontWeight: "800",
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#DCECF9",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    marginLeft: 9,
    width: 42,
  },
  avatarText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: "700",
  },
  memberDetails: {
    flex: 1,
    marginLeft: 10,
  },
  memberName: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  memberBadge: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 3,
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  points: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: "800",
  },
  pointsLabel: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 2,
  },
  informationCard: {
    alignItems: "flex-start",
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 12,
    padding: 13,
  },
  informationText: {
    color: "#047857",
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    marginLeft: 9,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 5,
  },
});