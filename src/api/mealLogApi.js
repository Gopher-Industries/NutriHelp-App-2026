import AsyncStorage from "@react-native-async-storage/async-storage";

const AI_MODEL_BASE_URL = process.env.EXPO_PUBLIC_AI_MODEL_URL;
const SCAN_HISTORY_KEY = "nutrihelp_scan_history_v1";

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function parseJsonSafe(response) {
  return response.json().catch(() => null);
}

async function saveToLocalHistory(payload) {
  const raw = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
  const history = raw ? JSON.parse(raw) : [];
  history.unshift({ ...payload, saved_at: new Date().toISOString() });
  await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  return payload;
}

async function fetchFromLocalHistory({ date, userId } = {}) {
  const raw = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
  const history = raw ? JSON.parse(raw) : [];
  return history.filter((entry) => {
    if (date && entry.date !== date) return false;
    if (userId && entry.user_id !== String(userId)) return false;
    return true;
  });
}

export async function saveScannedMeal(payload) {
  if (!AI_MODEL_BASE_URL) {
    return saveToLocalHistory(payload);
  }
  const base = AI_MODEL_BASE_URL.replace(/\/+$/, "");
  const response = await fetch(`${base}/ai-model/meals/log-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || "Failed to save scan history.");
  }
  return data;
}

export async function fetchMealLogs({ date, userId } = {}) {
  if (!AI_MODEL_BASE_URL) {
    return fetchFromLocalHistory({ date, userId });
  }
  const base = AI_MODEL_BASE_URL.replace(/\/+$/, "");
  const response = await fetch(
    `${base}/ai-model/meals/logs${buildQuery({ date, user_id: userId })}`
  );
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || "Failed to load scan history.");
  }
  return Array.isArray(data) ? data : [];
}

const mealLogApi = {
  saveScannedMeal,
  fetchMealLogs,
};

export default mealLogApi;
