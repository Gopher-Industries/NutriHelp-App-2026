import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY,   setAuthToken, setUnauthorizedHandler } from "../api/baseApi";
import { logoutUser, refreshAccessToken } from "../api/authApi";

const USER_STORAGE_KEY = "nutrihelp.auth.user";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

const UserContext = createContext(null);

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }

  throw new Error("No base64 decoder available in this runtime.");
}

function getTokenExpiryMs(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (!payload?.exp || typeof payload.exp !== "number") {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
// Track whether the current login should persist across app relaunches.
  const persistSessionRef = useRef(false);
// Keep the latest refresh token available to stable callbacks.
   const refreshTokenRef = useRef(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
  refreshTokenRef.current = refreshToken;
}, [refreshToken]);

  const appStateRef = useRef(AppState.currentState);
  const backgroundAtRef = useRef(null);
  const autoLogoutTimerRef = useRef(null);
  // Ref so the setTimeout callback always calls the latest scheduleAutoLogout.
  const scheduleAutoLogoutRef = useRef(null);

  const clearAutoLogoutTimer = useCallback(() => {
    if (autoLogoutTimerRef.current) {
      clearTimeout(autoLogoutTimerRef.current);
      autoLogoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    clearAutoLogoutTimer();
  // Temporary sessions may only have the refresh token in memory.
   const currentRefreshToken =
    refreshTokenRef.current ||
    (await SecureStore.getItemAsync(REFRESH_TOKEN_KEY));

    await logoutUser(currentRefreshToken);

    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setExpiresAt(null);
    
    // Remove the token used by API requests.
    setAuthToken(null);
// Clear session flags after logout.
     persistSessionRef.current = false;
     refreshTokenRef.current = null;

    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_STORAGE_KEY),
    ]);
  }, [clearAutoLogoutTimer]);

  // Silently attempt a token refresh. Returns new expiresAt on success, null on failure.
  const attemptTokenRefresh = useCallback(async () => {
    try {
      // Use the in-memory refresh token first so temporary sessions can still refresh.
   const storedRefresh = refreshTokenRef.current ||
       (await SecureStore.getItemAsync(REFRESH_TOKEN_KEY));
   if (!storedRefresh) return null;
  const result = await refreshAccessToken(storedRefresh);

      if (!result?.token) return null;
     // Only persist refreshed access tokens for remembered sessions.
      if (persistSessionRef.current) {
         await SecureStore.setItemAsync(AUTH_TOKEN_KEY, result.token);
      }
      // Update the token used by API requests after a successful refresh.
      setAuthToken(result.token);
      setToken(result.token);
      setExpiresAt(result.expiresAt || null);
      
      return result.expiresAt || null;
    } catch {
      return null;
    }
  }, []);

  const scheduleAutoLogout = useCallback(
    (nextExpiresAt) => {
      clearAutoLogoutTimer();
      if (!nextExpiresAt) return;

      const remaining = nextExpiresAt - Date.now();

      if (remaining <= 0) {
        // Already expired — try to silently refresh before giving up.
        attemptTokenRefresh().then((newExpiry) => {
          if (newExpiry) scheduleAutoLogoutRef.current?.(newExpiry);
          else logout();
        });
        return;
      }

      // Fire 60 s before expiry so we can refresh proactively.
      const delay = Math.max(remaining - 60_000, 0);
      autoLogoutTimerRef.current = setTimeout(async () => {
        const newExpiry = await attemptTokenRefresh();
        if (newExpiry) scheduleAutoLogoutRef.current?.(newExpiry);
        else logout();
      }, delay);
    },
    [clearAutoLogoutTimer, logout, attemptTokenRefresh]
  );

  // Keep the ref pointing at the latest version so setTimeout callbacks use it.
  useEffect(() => {
    scheduleAutoLogoutRef.current = scheduleAutoLogout;
  }, [scheduleAutoLogout]);

  const login = useCallback(
    async (authOrToken,
       maybeUser = null, 
       maybeExpiresAt = null,
       rememberMe = true
      ) => {
      console.log("[UserContext] login() called with:", { authOrToken, maybeUser, maybeExpiresAt });
      
      const authObject =
        authOrToken && typeof authOrToken === "object" && !Array.isArray(authOrToken)
          ? authOrToken
          : null;

      const nextToken = authObject
        ? authObject.token || authObject.accessToken
        : authOrToken;
      const nextRefreshToken = authObject?.refreshToken || null;
      const nextUser = authObject ? authObject.user ?? null : maybeUser;
      const nextExpiresAt =
        authObject && authObject.expiresAt
          ? authObject.expiresAt
          : maybeExpiresAt || getTokenExpiryMs(nextToken);

      // Make sure a valid token exists before creating the session.
      if (!nextToken) {
        throw new Error("login() requires a JWT token.");
      }

      // Do not start a session with an already expired token.
      if (nextExpiresAt && nextExpiresAt <= Date.now()) {
      await logout();
      return false;
      }
       // Save the user's Remember Me choice for this session.
          persistSessionRef.current = rememberMe;
          refreshTokenRef.current = nextRefreshToken;
       // Keep the token available for API requests during the current session.
          setAuthToken(nextToken);

     // Persist auth data only when Remember Me is enabled.
  if (rememberMe) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, nextToken);

  if (nextRefreshToken) {
    await SecureStore.setItemAsync(
      REFRESH_TOKEN_KEY,
      nextRefreshToken
    );
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }

  if (nextUser) {
    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(nextUser)
    );
  } else {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }
} else {
  // Temporary sessions should not remain after the app is relaunched.
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    AsyncStorage.removeItem(USER_STORAGE_KEY),
  ]);
}

      setToken(nextToken);
      setRefreshToken(nextRefreshToken);
      setUser(nextUser);
      setExpiresAt(nextExpiresAt || null);
      scheduleAutoLogout(nextExpiresAt || null);
      return true;
    },
    [logout, scheduleAutoLogout]
  );

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      try {
        const [storedToken, storedRefresh, storedUser] = await Promise.all([
          SecureStore.getItemAsync(AUTH_TOKEN_KEY),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);

        console.log("[UserContext] Bootstrap auth - storedToken:", storedToken ? "***" : null, "storedUser:", storedUser ? "***" : null);

        if (!storedToken) {
          console.log("[UserContext] No stored token");
          return;
        }
        // A session restored from SecureStore is a remembered session.
        persistSessionRef.current = true;
        refreshTokenRef.current = storedRefresh || null;

        let activeToken = storedToken;
        let nextExpiresAt = getTokenExpiryMs(storedToken);

        if (nextExpiresAt && nextExpiresAt <= Date.now()) {
          // Stored token expired — try refresh before forcing a new login.
          const refreshed = await attemptTokenRefresh();
          if (!refreshed) {
            await logout();
            return;
          }
          // attemptTokenRefresh already updated SecureStore + state, just reschedule.
          if (isMounted) scheduleAutoLogout(refreshed);
          return;
        }

        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        if (!isMounted) return;
        // Restore the token used by API requests for remembered sessions.
        setAuthToken(activeToken);
        setToken(activeToken);
        setRefreshToken(storedRefresh || null);
        setUser(parsedUser);
        setExpiresAt(nextExpiresAt || null);
        scheduleAutoLogout(nextExpiresAt || null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
      clearAutoLogoutTimer();
    };
  }, [clearAutoLogoutTimer, logout, scheduleAutoLogout, attemptTokenRefresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === "background" || nextState === "inactive") {
        backgroundAtRef.current = Date.now();
        return;
      }

      if (
        previousState.match(/background|inactive/) &&
        nextState === "active" &&
        backgroundAtRef.current
      ) {
        const inactiveFor = Date.now() - backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (inactiveFor >= INACTIVITY_TIMEOUT_MS) {
          logout();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const isAuthenticated = Boolean(token);

  const value = useMemo(
    () => ({
      user,
      token,
      refreshToken,
      loading,
      isAuthenticated,
      login,
      logout,
    }),
    [user, token, refreshToken, loading, isAuthenticated, login, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within <UserProvider />");
  }
  return context;
}
