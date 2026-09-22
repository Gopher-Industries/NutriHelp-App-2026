import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCommunity } from "../../context/CommunityContext";

const PRIMARY = "#0B5FA5";

export default function PostDetailScreen({ navigation, route }) {
  const { getPostById, toggleLike } = useCommunity();
  const postId = route.params?.postId;
  const post = getPostById(postId);

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons color="#0F172A" name="arrow-back" size={24} />
          </Pressable>

          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.notFoundContainer}>
          <Ionicons
            color="#94A3B8"
            name="document-text-outline"
            size={52}
          />
          <Text style={styles.notFoundTitle}>Post not found</Text>
          <Text style={styles.notFoundText}>
            This community post may no longer be available.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Return to feed</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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

        <Text style={styles.headerTitle}>Community Post</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.postCard}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {post.author.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>{post.author}</Text>
              <Text style={styles.postTime}>{post.createdAt}</Text>
            </View>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{post.category}</Text>
            </View>
          </View>

          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postContent}>{post.content}</Text>

          <View style={styles.divider} />

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                post.liked ? "Remove like from post" : "Like post"
              }
              onPress={() => toggleLike(post.id)}
              style={styles.actionButton}
            >
              <Ionicons
                color={post.liked ? "#DC2626" : "#64748B"}
                name={post.liked ? "heart" : "heart-outline"}
                size={23}
              />
              <Text
                style={[
                  styles.actionText,
                  post.liked && styles.likedText,
                ]}
              >
                {post.likes} {post.likes === 1 ? "Like" : "Likes"}
              </Text>
            </Pressable>

            <View style={styles.actionButton}>
              <Ionicons
                color="#64748B"
                name="chatbubble-outline"
                size={21}
              />
              <Text style={styles.actionText}>
                {post.comments}{" "}
                {post.comments === 1 ? "Comment" : "Comments"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Community responses</Text>

          {post.comments > 0 ? (
            <>
              <View style={styles.commentCard}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>L</Text>
                </View>

                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>Lisa W.</Text>
                  <Text style={styles.commentText}>
                    Thank you for sharing this helpful idea with the
                    community!
                  </Text>
                </View>
              </View>

              <View style={styles.commentCard}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>J</Text>
                </View>

                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>James R.</Text>
                  <Text style={styles.commentText}>
                    This is a great reminder. Small healthy choices really
                    do make a difference.
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyComments}>
              <Ionicons
                color="#94A3B8"
                name="chatbubble-ellipses-outline"
                size={38}
              />
              <Text style={styles.emptyCommentsTitle}>
                No responses yet
              </Text>
              <Text style={styles.emptyCommentsText}>
                Community responses will appear here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    padding: 17,
  },
  authorRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#DCECF9",
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  avatarText: {
    color: PRIMARY,
    fontSize: 18,
    fontWeight: "700",
  },
  authorDetails: {
    flex: 1,
    marginLeft: 11,
  },
  authorName: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  postTime: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 3,
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
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 29,
    marginTop: 20,
  },
  postContent: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 25,
    marginTop: 11,
  },
  divider: {
    backgroundColor: "#E2E8F0",
    height: 1,
    marginVertical: 18,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  actionButton: {
    alignItems: "center",
    flexDirection: "row",
    marginRight: 22,
    minHeight: 40,
  },
  actionText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 7,
  },
  likedText: {
    color: "#DC2626",
  },
  commentsSection: {
    marginTop: 22,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  commentCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    padding: 14,
  },
  commentAvatar: {
    alignItems: "center",
    backgroundColor: "#EAF3FB",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  commentAvatarText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "700",
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
  },
  commentAuthor: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  commentText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  emptyComments: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 25,
  },
  emptyCommentsTitle: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 9,
  },
  emptyCommentsText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 5,
  },
  notFoundContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  notFoundTitle: {
    color: "#334155",
    fontSize: 19,
    fontWeight: "700",
    marginTop: 13,
  },
  notFoundText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 7,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});