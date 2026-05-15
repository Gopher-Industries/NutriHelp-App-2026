import AsyncStorage from "@react-native-async-storage/async-storage";

const BOOKMARK_KEY_PREFIX = "nutrihelp.recipeBookmarks";

function resolveStorageKey(userId) {
  const safeUser = userId == null || userId === "" ? "guest" : String(userId);
  return `${BOOKMARK_KEY_PREFIX}.${safeUser}`;
}

function normalizeRecipeId(recipeId) {
  if (recipeId == null || recipeId === "") {
    return "";
  }
  return String(recipeId);
}

function toBookmarkRecord(recipe) {
  const recipeId = normalizeRecipeId(recipe?.id ?? recipe?.recipe_id ?? recipe?.recipeId);
  if (!recipeId) {
    return null;
  }

  return {
    ...recipe,
    id: recipeId,
    savedAt: new Date().toISOString(),
  };
}

async function readBookmarks(userId) {
  const key = resolveStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => ({
        ...item,
        id: normalizeRecipeId(item?.id ?? item?.recipe_id ?? item?.recipeId),
      }))
      .filter((item) => item.id.length > 0);
  } catch {
    return [];
  }
}

async function writeBookmarks(userId, bookmarks) {
  const key = resolveStorageKey(userId);
  if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, JSON.stringify(bookmarks));
}

export async function getBookmarkedRecipes(userId) {
  const bookmarks = await readBookmarks(userId);
  return bookmarks.sort((a, b) => {
    const aMs = Date.parse(a?.savedAt || "") || 0;
    const bMs = Date.parse(b?.savedAt || "") || 0;
    return bMs - aMs;
  });
}

export async function isRecipeBookmarked(userId, recipeId) {
  const id = normalizeRecipeId(recipeId);
  if (!id) {
    return false;
  }
  const bookmarks = await readBookmarks(userId);
  return bookmarks.some((item) => item.id === id);
}

export async function addRecipeBookmark(userId, recipe) {
  const record = toBookmarkRecord(recipe);
  if (!record) {
    return false;
  }

  const bookmarks = await readBookmarks(userId);
  const withoutDuplicate = bookmarks.filter((item) => item.id !== record.id);
  await writeBookmarks(userId, [record, ...withoutDuplicate]);
  return true;
}

export async function removeRecipeBookmark(userId, recipeId) {
  const id = normalizeRecipeId(recipeId);
  if (!id) {
    return false;
  }

  const bookmarks = await readBookmarks(userId);
  const filtered = bookmarks.filter((item) => item.id !== id);
  await writeBookmarks(userId, filtered);
  return filtered.length !== bookmarks.length;
}

