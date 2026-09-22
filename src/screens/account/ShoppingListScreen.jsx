import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import useAppTheme from "../../hooks/useAppTheme";

const DEFAULT_CATEGORY = "Other";

export default function ShoppingListScreen() {
  const { colors } = useAppTheme();

  // TODO: Replace local state with Shopping List v2 backend CRUD integration
 // once the backend endpoints are available.

  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const groupedItems = useMemo(() => {
    return items.reduce((groups, item) => {
      const groupName = item.category || DEFAULT_CATEGORY;

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(item);
      return groups;
    }, {});
  }, [items]);

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setCategory("");
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || "");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setName("");
    setCategory("");
  };

  const saveItem = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    const trimmedCategory = category.trim() || DEFAULT_CATEGORY;

    if (editingItem) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                name: trimmedName,
                category: trimmedCategory,
              }
            : item
        )
      );
    } else {
      setItems((currentItems) => [
        ...currentItems,
        {
          id: Date.now().toString(),
          name: trimmedName,
          category: trimmedCategory,
          completed: false,
        },
      ]);
    }

    closeModal();
  };

  const toggleComplete = (id) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
            }
          : item
      )
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              Shopping List
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Keep track of the items you need to buy.
            </Text>
          </View>

          <Pressable
            style={[
              styles.addButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={openAddModal}
            accessibilityRole="button"
            accessibilityLabel="Add shopping list item"
          >
            <Ionicons
              name="add"
              size={24}
              color={colors.primaryText}
            />
          </Pressable>
        </View>

        {items.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="cart-outline"
              size={42}
              color={colors.textSecondary}
            />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Your shopping list is empty
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Add an item to start building your shopping list.
            </Text>

            <Pressable
              style={[
                styles.emptyAddButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={openAddModal}
            >
              <Text
                style={[
                  styles.emptyAddButtonText,
                  {
                    color: colors.primaryText,
                  },
                ]}
              >
                Add Item
              </Text>
            </Pressable>
          </View>
        ) : (
          Object.entries(groupedItems).map(([groupName, groupItems]) => (
            <View key={groupName} style={styles.categorySection}>
              <Text
                style={[
                  styles.categoryTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {groupName}
              </Text>

              {groupItems.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Pressable
                    style={styles.itemMain}
                    onPress={() => toggleComplete(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked: item.completed,
                    }}
                  >
                    <Ionicons
                      name={
                        item.completed
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={24}
                      color={
                        item.completed
                          ? colors.success
                          : colors.textSecondary
                      }
                    />

                    <Text
                      style={[
                        styles.itemText,
                        {
                          color: item.completed
                            ? colors.textSecondary
                            : colors.text,
                          textDecorationLine: item.completed
                            ? "line-through"
                            : "none",
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openEditModal(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                  >
                    <Ionicons
                      name="create-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {editingItem ? "Edit Item" : "Add Item"}
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Item name"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Category"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.cancelButton,
                  {
                    borderColor: colors.border,
                  },
                ]}
                onPress={closeModal}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={saveItem}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    {
                      color: colors.primaryText,
                    },
                  ]}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  headerTextWrap: {
    flex: 1,
    paddingRight: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 20,
  },

  emptyAddButton: {
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },

  emptyAddButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  categorySection: {
    marginBottom: 24,
  },

  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  itemRow: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },

  itemText: {
    fontSize: 16,
    marginLeft: 12,
    flexShrink: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 18,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },

  cancelButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginRight: 10,
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  saveButton: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});