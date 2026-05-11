import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUser } from "../../context/UserContext";

const SUMMARY_ROWS = [
  { label: "Protein", value: "56 g", progress: 0.66, color: "#1877F2" },
  { label: "Fiber", value: "18 g", progress: 0.56, color: "#39D353" },
  { label: "Sugar", value: "24 g", progress: 0.45, color: "#FF4D00" },
  { label: "Sodium", value: "2.5 g", progress: 0.34, color: "#FFC400" },
];

const MEALS = [
  { label: "Breakfast", done: true, accent: "#31D26A", icon: "checkmark-circle-outline" },
  { label: "Lunch", done: false, accent: "#F5B400", icon: "timer-outline" },
  { label: "Dinner", done: false, accent: "#7A7A7A", icon: "ellipse-outline" },
];

function CircularGoal() {
  return (
    <View style={styles.goalWrap}>
      <View style={styles.goalRing}>
        <View style={styles.goalRingBlue} />
        <View style={styles.goalRingGray} />
        <View style={styles.goalInner}>
          <Text style={styles.goalValue}>3350/</Text>
          <Text style={styles.goalValue}>4000</Text>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useUser();

  const displayName = user?.full_name
    || user?.name
    || (user?.email ? user.email.split("@")[0] : "NutriHelp User");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcome}>Hi, Welcome to NutriHelp 👋</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>

          <View style={styles.headerIcons}>
            <Ionicons name="heart-outline" size={30} color="#FF4B44" />
            <Ionicons name="timer-outline" size={32} color="#FF4D00" />
            <Ionicons name="notifications-outline" size={31} color="#1877F2" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today Nutrition</Text>

        <View style={styles.topCardRow}>
          <Pressable
            style={[styles.panelCard, styles.goalCard]}
            onPress={() => navigation.navigate("GoalDetailsScreen")}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="locate-outline" size={28} color="#111111" />
              <Text style={styles.cardTitle}>Goal</Text>
            </View>
            <CircularGoal />
          </Pressable>

          <View style={[styles.panelCard, styles.alertCard]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="heart-dislike-outline" size={28} color="#E6402C" />
              <Text style={styles.alertTitle}>Allergen Alert</Text>
            </View>
            <Text style={styles.alertHeadline}>Avoid nuts today</Text>
            <Text style={styles.alertBody}>
              Based on your health profile and recent scans, nuts may cause an
              allergic reaction.
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.summaryCard}
          onPress={() => navigation.navigate("NutritionSummaryScreen")}
        >
          <Text style={styles.summaryTitle}>Nutrition Summary</Text>
          {SUMMARY_ROWS.map((item) => (
            <View key={item.label} style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: item.color }]}>
                {item.label}
              </Text>
              <View style={styles.summaryTrack}>
                <View
                  style={[
                    styles.summaryFill,
                    { width: `${item.progress * 100}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          ))}
        </Pressable>

        <View style={styles.bottomCardRow}>
          <Pressable
            style={[styles.panelCard, styles.bottomInfoCard]}
            onPress={() => navigation.navigate("MealPlanOverviewScreen")}
          >
            <Text style={styles.bottomCardTitle}>Meals Today</Text>
            {MEALS.map((meal) => (
              <View key={meal.label} style={styles.mealRow}>
                <View style={styles.mealLabelRow}>
                  <Ionicons name={meal.icon} size={26} color={meal.accent} />
                  <Text style={styles.mealText}>{meal.label}</Text>
                </View>
                <Ionicons
                  name={meal.done ? "checkmark" : "timer-outline"}
                  size={22}
                  color={meal.done ? "#444444" : "#6B6B6B"}
                />
              </View>
            ))}
          </Pressable>

          <Pressable
            style={[styles.panelCard, styles.bottomInfoCard]}
            onPress={() => navigation.navigate("RecommendedDetailsScreen")}
          >
            <Text style={styles.bottomCardTitle}>Recommended for you</Text>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=600&q=80",
              }}
              style={styles.recommendImage}
            />
            <Text style={styles.recommendLabel}>High in protein</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  welcome: {
    fontSize: 15,
    color: "#222222",
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 18,
  },
  topCardRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  panelCard: {
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  goalCard: {
    flex: 1,
    minHeight: 238,
  },
  alertCard: {
    flex: 1,
    minHeight: 238,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: "#111111",
  },
  goalWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  goalRing: {
    width: 138,
    height: 138,
    borderRadius: 69,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  goalRingBlue: {
    position: "absolute",
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 13,
    borderColor: "#1877F2",
    borderRightColor: "#B7B7B7",
    borderTopColor: "#1877F2",
    transform: [{ rotate: "-35deg" }],
  },
  goalRingGray: {
    position: "absolute",
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 13,
    borderColor: "transparent",
    borderTopColor: "#B7B7B7",
    borderRightColor: "#B7B7B7",
    transform: [{ rotate: "50deg" }],
  },
  goalInner: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  goalValue: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "800",
    color: "#111111",
  },
  alertTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
  alertHeadline: {
    fontSize: 22,
    fontWeight: "400",
    color: "#111111",
    marginBottom: 12,
  },
  alertBody: {
    fontSize: 15,
    lineHeight: 21,
    color: "#111111",
  },
  summaryCard: {
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 34,
    paddingHorizontal: 22,
    paddingVertical: 20,
    marginBottom: 18,
  },
  summaryTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    width: 66,
    fontSize: 17,
    fontWeight: "500",
  },
  summaryTrack: {
    flex: 1,
    height: 10,
    borderRadius: 99,
    backgroundColor: "#D9D9D9",
    marginHorizontal: 14,
    overflow: "hidden",
  },
  summaryFill: {
    height: "100%",
    borderRadius: 99,
  },
  summaryValue: {
    width: 52,
    textAlign: "right",
    fontSize: 16,
    color: "#111111",
  },
  bottomCardRow: {
    flexDirection: "row",
    gap: 14,
  },
  bottomInfoCard: {
    flex: 1,
    minHeight: 215,
  },
  bottomCardTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 14,
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mealLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mealText: {
    fontSize: 20,
    color: "#111111",
  },
  recommendImage: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    marginBottom: 10,
  },
  recommendLabel: {
    fontSize: 17,
    color: "#111111",
  },
});
