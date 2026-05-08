import baseApi from "./baseApi";

const { get, put } = baseApi;

const NOTIFICATION_ENDPOINTS = {
  preferences: "/api/notifications",
};

function ensureTokenArray(value) {
  if (!value) {
    return [];
  }
  return Array.from(
    new Set(Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean))
  );
}

function withPreferencesBody(preferences = {}) {
  return {
    notification_preferences: preferences,
  };
}

export async function getPreferences() {
  return get(NOTIFICATION_ENDPOINTS.preferences);
}

export async function updatePreferences(preferences) {
  return put(NOTIFICATION_ENDPOINTS.preferences, withPreferencesBody(preferences));
}

export async function registerDeviceToken(deviceToken) {
  if (!deviceToken) {
    throw new Error("registerDeviceToken() requires deviceToken.");
  }

  const current = await getPreferences();
  const currentPreferences = current?.data?.data?.notification_preferences || current?.data?.notification_preferences || {};
  const tokens = ensureTokenArray(currentPreferences.deviceTokens);

  if (!tokens.includes(deviceToken)) {
    tokens.push(deviceToken);
  }

  return updatePreferences({
    ...currentPreferences,
    deviceTokens: tokens,
  });
}

export async function deregisterDeviceToken(deviceToken) {
  if (!deviceToken) {
    throw new Error("deregisterDeviceToken() requires deviceToken.");
  }

  const current = await getPreferences();
  const currentPreferences = current?.data?.data?.notification_preferences || current?.data?.notification_preferences || {};
  const tokens = ensureTokenArray(currentPreferences.deviceTokens).filter(
    (token) => token !== deviceToken
  );

  return updatePreferences({
    ...currentPreferences,
    deviceTokens: tokens,
  });
}

const notificationApi = {
  getPreferences,
  updatePreferences,
  registerDeviceToken,
  deregisterDeviceToken,
};

export default notificationApi;
