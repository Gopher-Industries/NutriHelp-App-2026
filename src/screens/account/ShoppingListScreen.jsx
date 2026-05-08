import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import {
  addShoppingItem,
  deleteShoppingItem,
  getShoppingItems,
  updateShoppingItem,
} from '../../api/shoppingListApi';
import { colors, screenPadding, shadow, spacing } from '../../theme/nutriTheme';

export default function ShoppingListScreen() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    getShoppingItems().then(setItems);
  }, []);

  const addItem = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const created = await addShoppingItem(trimmed);
    setItems((current) => [created, ...current]);
    setTitle('');
  };

  const toggleItem = async (item) => {
    const completed = !item.completed;
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, completed } : entry))
    );
    await updateShoppingItem(item.id, { completed });
  };

  const removeItem = async (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
    await deleteShoppingItem(id);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Account</Text>
            <Text style={styles.title}>Shopping list</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable style={styles.deleteAction} onPress={() => removeItem(item.id)}>
                <Text style={styles.deleteActionText}>Delete</Text>
              </Pressable>
            )}
          >
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.itemCard}>
              <Pressable onPress={() => toggleItem(item)} style={styles.itemRow}>
                <View style={[styles.checkbox, item.completed && styles.checkboxActive]} />
                <Text style={[styles.itemText, item.completed && styles.itemTextDone]}>
                  {item.title}
                </Text>
              </Pressable>
            </Animated.View>
          </Swipeable>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Add grocery item"
          placeholderTextColor={colors.muted}
          style={styles.input}
          onSubmitEditing={addItem}
        />
        <Pressable style={styles.addButton} onPress={addItem}>
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { ...screenPadding, paddingBottom: 96 },
  header: { marginBottom: spacing.md },
  eyebrow: { color: colors.primary, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  itemCard: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.md,
  },
  checkboxActive: { backgroundColor: colors.primary },
  itemText: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  itemTextDone: { color: colors.muted, textDecorationLine: 'line-through' },
  deleteAction: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  deleteActionText: { color: colors.surface, fontWeight: '900' },
  inputBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    ...shadow,
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.ink,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  addText: { color: colors.surface, fontWeight: '900' },
});
