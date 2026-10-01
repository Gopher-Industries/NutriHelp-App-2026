import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCommunity } from "../../context/CommunityContext";

const PRIMARY = "#2B78C5";

export default function CommunityFeedScreen({ navigation }) {
  const { posts, toggleLike } = useCommunity();

  const openPost = useCallback(
    (postId) => {
      navigation.navigate("PostDetailScreen", { postId });
    },
    [navigation]
  );

  const renderPost = ({ item }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open post: ${item.title}`}
      onPress={() => openPost(item.id)}
      style={({ pressed }) => [
        styles.postCard,
        pressed && styles.pressedCard,
      ]}
    >
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.author.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.authorDetails}>
          <Text style={styles.authorName}>{item.author}</Text>
          <Text style={styles.postTime}>{item.createdAt}</Text>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>

      <Text numberOfLines={3} style={styles.postContent}>
        {item.content}
      </Text>

      <View style={styles.divider} />

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            item.liked ? "Remove like from post" : "Like post"
          }
          onPress={(event) => {
            event.stopPropagation();
            toggleLike(item.id);
          }}
          style={styles.actionButton}
        >
          <Ionicons
            color={item.liked ? "#DC2626" : "#64748B"}
            name={item.liked ? "heart" : "heart-outline"}
            size={21}
          />

          <Text
            style={[
              styles.actionText,
              item.liked && styles.likedText,
            ]}
          >
            {item.likes}
          </Text>
        </Pressable>

        <View style={styles.actionButton}>
          <Ionicons
            color="#64748B"
            name="chatbubble-outline"
            size={20}
          />

          <Text style={styles.actionText}>{item.comments}</Text>
        </View>

        <View style={styles.readMore}>
          <Text style={styles.readMoreText}>View post</Text>

          <Ionicons
            color={PRIMARY}
            name="chevron-forward"
            size={17}
          />
        </View>
      </View>
    </Pressable>
  );

  const listHeader = (
    <View>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeIcon}>
          <Ionicons color="#FFFFFF" name="people" size={28} />
        </View>

        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeTitle}>
            Welcome to the community
          </Text>

          <Text style={styles.welcomeText}>
            Connect with others and share your wellness journey.
          </Text>
        </View>
      </View>

      <View style={styles.createPostWrapper}>
        <Button
          title="Create Post"
          color={PRIMARY}
          onPress={() => navigation.navigate("CreatePostScreen")}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Community</Text>

          <Text style={styles.subheading}>
            Share, learn and grow together
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open community leaderboard"
          onPress={() => navigation.navigate("LeaderboardScreen")}
          style={({ pressed }) => [
            styles.leaderboardButton,
            pressed && styles.pressedButton,
          ]}
        >
          <Ionicons
            color={PRIMARY}
            name="trophy-outline"
            size={23}
          />
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={[
          styles.listContent,
          posts.length === 0 && styles.emptyListContent,
        ]}
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              color="#94A3B8"
              name="chatbubbles-outline"
              size={48}
            />

            <Text style={styles.emptyTitle}>
              No community posts yet
            </Text>

            <Text style={styles.emptyText}>
              Be the first person to share something with the
              community.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#F4F7FB",
    flex: 1,
  },

  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  heading: {
    color: "#17233C",
    fontSize: 26,
    fontWeight: "700",
  },

  subheading: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },

  leaderboardButton: {
    alignItems: "center",
    backgroundColor: "#EAF3FB",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },

  pressedButton: {
    opacity: 0.7,
  },

  listContent: {
    padding: 16,
    paddingBottom: 120,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  welcomeCard: {
    alignItems: "center",
    backgroundColor: PRIMARY,
    borderRadius: 16,
    flexDirection: "row",
    marginBottom: 12,
    padding: 16,
  },

  welcomeIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    width: 50,
  },

  welcomeTextContainer: {
    flex: 1,
    marginLeft: 13,
  },

  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  welcomeText: {
    color: "#EAF3FB",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  createPostWrapper: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 16,
    overflow: "hidden",
  },

  postCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },

  pressedCard: {
    opacity: 0.85,
  },

  authorRow: {
    alignItems: "center",
    flexDirection: "row",
  },

  avatar: {
    alignItems: "center",
    backgroundColor: "#DCECF9",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },

  avatarText: {
    color: PRIMARY,
    fontSize: 17,
    fontWeight: "700",
  },

  authorDetails: {
    flex: 1,
    marginLeft: 10,
  },

  authorName: {
    color: "#17233C",
    fontSize: 14,
    fontWeight: "700",
  },

  postTime: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },

  categoryBadge: {
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  categoryText: {
    color: "#047857",
    fontSize: 11,
    fontWeight: "600",
  },

  postTitle: {
    color: "#17233C",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 14,
  },

  postContent: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },

  divider: {
    backgroundColor: "#E2E8F0",
    height: 1,
    marginVertical: 13,
  },

  actionRow: {
    alignItems: "center",
    flexDirection: "row",
  },

  actionButton: {
    alignItems: "center",
    flexDirection: "row",
    marginRight: 20,
    minHeight: 36,
    paddingVertical: 6,
  },

  actionText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  likedText: {
    color: "#DC2626",
  },

  readMore: {
    alignItems: "center",
    flexDirection: "row",
    marginLeft: "auto",
  },

  readMoreText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "700",
  },

  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 50,
  },

  emptyTitle: {
    color: "#334155",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 12,
  },

  emptyText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
});