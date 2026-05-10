import * as SecureStore from "expo-secure-store";

export const AUTH_TOKEN_KEY = "nutrihelp.auth.token";
export const REFRESH_TOKEN_KEY = "nutrihelp.auth.refreshToken";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "Missing EXPO_PUBLIC_API_BASE_URL. Set it in .env before making API calls."
  );
}

let onUnauthorized = null;
let unauthorizedInProgress = false;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(toErrorMessage(data, toErrorMessage(message)));
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function toErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof ApiError) {
    return toErrorMessage(error.data, error.message || fallback);
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "object") {
    return (
      toErrorMessage(error.message, "") ||
      toErrorMessage(error.error, "") ||
      toErrorMessage(error.errors?.[0], "") ||
      fallback
    );
  }

  return String(error);
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === "function" ? handler : null;
}

function toAbsoluteUrl(path, query) {
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path || ""}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

async function parseResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

async function triggerUnauthorizedHandler() {
  if (!onUnauthorized || unauthorizedInProgress) {
    console.log("[baseApi] Unauthorized handler not set or already in progress");
    return;
  }

  console.log("[baseApi] Triggering unauthorized handler");
  unauthorizedInProgress = true;
  try {
    await onUnauthorized();
  } finally {
    unauthorizedInProgress = false;
  }
}

export async function request(method, path, options = {}) {
  const { body, headers = {}, query, skipAuth = false, signal } = options;

  const requestHeaders = { ...headers };

  if (!skipAuth) {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let requestBody = body;
  const isJsonBody =
    body !== null &&
    body !== undefined &&
    typeof body === "object" &&
    !(body instanceof FormData);

  if (isJsonBody) {
    requestBody = JSON.stringify(body);
    if (!requestHeaders["Content-Type"] && !requestHeaders["content-type"]) {
      requestHeaders["Content-Type"] = "application/json";
    }
  }

  const url = toAbsoluteUrl(path, query);
  console.log(`[baseApi] ${method} ${url}`, { body });

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal,
  });

  const data = await parseResponseBody(response);

  console.log(`[baseApi] Response status: ${response.status}`, { 
    data: data ? JSON.stringify(data) : null 
  });

  if (response.status === 401) {
    await triggerUnauthorizedHandler();
    throw new ApiError("Unauthorized", response.status, data);
  }

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  return data;
}

export const get = (path, options = {}) => request("GET", path, options);
export const post = (path, body, options = {}) =>
  request("POST", path, { ...options, body });
export const put = (path, body, options = {}) =>
  request("PUT", path, { ...options, body });
export const deleteRequest = (path, options = {}) =>
  request("DELETE", path, options);

const baseApi = {
  get,
  post,
  put,
  delete: deleteRequest,
  request,
};

export default baseApi;
