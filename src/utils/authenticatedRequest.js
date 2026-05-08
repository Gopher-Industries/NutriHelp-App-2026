import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "nutrihelp.auth.token";

export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

  if (!token) {
    throw new Error("No auth token found. Please login first.");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export default makeAuthenticatedRequest;
