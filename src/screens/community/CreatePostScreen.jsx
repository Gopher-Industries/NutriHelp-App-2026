import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Button,
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

import { useCommunity } from "../../context/CommunityContext";

const PRIMARY = "#2B78C5";

const CATEGORIES = [
  "Healthy Eating",
  "Wellness",
  "Recipes",
  "Community Tip",
];

export default function CreatePostScreen({ navigation }) {
  const { addPost } = useCommunity();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const nextErrors = {};
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      nextErrors.title = "Please enter a post title.";
    } else if (trimmedTitle.length < 5) {
      nextErrors.title =
        "The title must contain at least 5 characters.";
    }

    if (!trimmedContent) {
      nextErrors.content =
        "Please enter your community message.";
    } else if (trimmedContent.length < 10) {
      nextErrors.content =
        "The message must contain at least 10 characters.";
    }

    if (!category) {
      nextErrors.category = "Please select a category.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handlePublish = () => {
    if (!validateForm()) {
      return;
    }

    addPost({
      title,
      content,
      category,
    });

    Alert.alert(
      "Post published",
      "Your post has been added to the Community Feed.",
      [
        {
          text: "View feed",
          onPress: () => navigation.popToTop(),
        },
      ]
    );
  };

  const updateTitle = (value) => {
    setTitle(value);

    if (errors.title) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        title: undefined,
      }));
    }
  };

  const updateContent = (value) => {
    setContent(value);

    if (errors.content) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        content: undefined,
      }));
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel creating post"
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons color="#17233C" name="close" size={26} />
        </Pressable>

        <Text style={styles.headerTitle}>Create Post</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introduction}>
            <View style={styles.introductionIcon}>
              <Ionicons
                color={PRIMARY}
                name="create-outline"
                size={26}
              />
            </View>

            <View style={styles.introductionText}>
              <Text style={styles.introductionTitle}>
                Share with the community
              </Text>

              <Text style={styles.introductionDescription}>
                Share a healthy tip, recipe idea or update from your
                wellness journey.
              </Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Post title <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              accessibilityLabel="Post title"
              maxLength={80}
              onChangeText={updateTitle}
              placeholder="Enter a short and meaningful title"
              placeholderTextColor="#94A3B8"
              style={[
                styles.input,
                errors.title && styles.inputError,
              ]}
              value={title}
            />

            <View style={styles.fieldFooter}>
              <Text style={styles.errorText}>
                {errors.title || " "}
              </Text>

              <Text style={styles.characterCount}>
                {title.length}/80
              </Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.categoryContainer}>
              {CATEGORIES.map((item) => {
                const selected = category === item;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={item}
                    onPress={() => {
                      setCategory(item);

                      setErrors((currentErrors) => ({
                        ...currentErrors,
                        category: undefined,
                      }));
                    }}
                    style={[
                      styles.categoryButton,
                      selected && styles.selectedCategoryButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selected && styles.selectedCategoryText,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {errors.category ? (
              <Text style={styles.categoryError}>
                {errors.category}
              </Text>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Your message <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              accessibilityLabel="Community post message"
              maxLength={500}
              multiline
              onChangeText={updateContent}
              placeholder="What would you like to share?"
              placeholderTextColor="#94A3B8"
              style={[
                styles.input,
                styles.messageInput,
                errors.content && styles.inputError,
              ]}
              textAlignVertical="top"
              value={content}
            />

            <View style={styles.fieldFooter}>
              <Text style={styles.errorText}>
                {errors.content || " "}
              </Text>

              <Text style={styles.characterCount}>
                {content.length}/500
              </Text>
            </View>
          </View>

          <View style={styles.guidelineCard}>
            <Ionicons
              color="#047857"
              name="shield-checkmark-outline"
              size={23}
            />

            <View style={styles.guidelineTextContainer}>
              <Text style={styles.guidelineTitle}>
                Community reminder
              </Text>

              <Text style={styles.guidelineText}>
                Be respectful and avoid sharing sensitive personal or
                medical information.
              </Text>
            </View>
          </View>

          <View style={styles.publishButtonWrapper}>
            <Button
              title="Publish Post"
              color={PRIMARY}
              onPress={handlePublish}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel creating post"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#F4F7FB",
    flex: 1,
  },

  keyboardContainer: {
    flex: 1,
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

  headerButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },

  headerTitle: {
    color: "#17233C",
    fontSize: 18,
    fontWeight: "700",
  },

  headerSpacer: {
    width: 40,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 140,
  },

  introduction: {
    alignItems: "center",
    backgroundColor: "#EAF3FB",
    borderRadius: 15,
    flexDirection: "row",
    marginBottom: 24,
    padding: 15,
  },

  introductionIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },

  introductionText: {
    flex: 1,
    marginLeft: 12,
  },

  introductionTitle: {
    color: "#17233C",
    fontSize: 15,
    fontWeight: "700",
  },

  introductionDescription: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  formGroup: {
    marginBottom: 18,
  },

  label: {
    color: "#17233C",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },

  required: {
    color: "#DC2626",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 11,
    borderWidth: 1,
    color: "#17233C",
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  messageInput: {
    minHeight: 145,
  },

  inputError: {
    borderColor: "#DC2626",
  },

  fieldFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  errorText: {
    color: "#DC2626",
    flex: 1,
    fontSize: 12,
  },

  characterCount: {
    color: "#94A3B8",
    fontSize: 12,
    marginLeft: 10,
  },

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  selectedCategoryButton: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  categoryButtonText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },

  selectedCategoryText: {
    color: "#FFFFFF",
  },

  categoryError: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 6,
  },

  guidelineCard: {
    alignItems: "flex-start",
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 18,
    padding: 13,
  },

  guidelineTextContainer: {
    flex: 1,
    marginLeft: 10,
  },

  guidelineTitle: {
    color: "#065F46",
    fontSize: 13,
    fontWeight: "700",
  },

  guidelineText: {
    color: "#047857",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  publishButtonWrapper: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
  },

  cancelButton: {
    alignItems: "center",
    minHeight: 44,
    padding: 12,
  },

  cancelButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
});