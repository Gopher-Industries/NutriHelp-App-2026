const AI_MODEL_BASE_URL =
  process.env.EXPO_PUBLIC_AI_MODEL_URL || "http://localhost:8000";

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

function ensureAiBaseUrl() {
  if (!AI_MODEL_BASE_URL) {
    throw new Error("Missing EXPO_PUBLIC_AI_MODEL_URL for shared scan history.");
  }
  return AI_MODEL_BASE_URL.replace(/\/+$/, "");
}

async function parseJsonSafe(response) {
  return response.json().catch(() => null);
}

export async function saveScannedMeal(payload) {
  const response = await fetch(`${ensureAiBaseUrl()}/ai-model/meals/log-scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || "Failed to save scan history.");
  }
  return data;
}

export async function fetchMealLogs({ date, userId } = {}) {
  const response = await fetch(
    `${ensureAiBaseUrl()}/ai-model/meals/logs${buildQuery({ date, user_id: userId })}`
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
