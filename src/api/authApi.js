import { get, post } from "./baseApi";

// For POST /api/auth/login 200 response:
// { success: true, data: { user: { id, email, name, role }, session: { accessToken, refreshToken } } }
function transformLoginResponse(response) {
  const session = response.data?.session;
  const token = session?.accessToken;

  if (!token) {
    throw new Error("No access token in login response");
  }

  const user = response.data?.user;
  return {
    token,
    refreshToken: session?.refreshToken || null,
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      : null,
    expiresAt: null,
  };
}


// Returns { mfaRequired: true, email } on 202, or transformed auth object on 200
export async function loginUser(email, password) {
  const response = await post(
    "/api/auth/login",
    { email: email.trim(), password },
    { skipAuth: true }
  );

  // 202: { success: true, data: { mfaRequired: true, email, message } }
  if (response?.data?.mfaRequired) {
    return {
      mfaRequired: true,
      email: response.data.email || email.trim(),
    };
  }

  // 200: { success: true, data: { user, session: { accessToken, refreshToken } } }
  return transformLoginResponse(response);
}

export async function registerUser(firstName, lastName, email, password) {
  const response = await post(
    "/api/auth/register",
    {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
      name: `${firstName.trim()} ${lastName.trim()}`,
      contact_number: "0000000000",
      contactNumber: "0000000000",
      address: "Not provided",
    },
    { skipAuth: true }
  );

  if (response && response.success === false) {
    throw new Error(
      response.errors?.[0]?.message ||
        response.error ||
        "Registration failed"
    );
  }

  return response;
}

// POST /api/login/mfa → { success: true, data: { user, session: { accessToken } } }
// No axios interceptor exists — post() returns raw JSON, so token is at response.data.session.accessToken
function transformMFAResponse(response) {
  console.log("MFA raw response:", JSON.stringify(response?.data));
  const inner = response?.data;
  const token = inner?.session?.accessToken;

  if (!token) {
    throw new Error("No access token in response from server");
  }

  const user = inner?.user;
  return {
    token,
    refreshToken: inner?.session?.refreshToken || null,
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      : null,
    expiresAt: null,
  };
}

export async function verifyMFA(email, password, code) {
  const response = await post(
    "/api/login/mfa",
    { email: email.trim(), password, mfa_token: code },
    { skipAuth: true }
  );

  return transformMFAResponse(response);
}


export async function requestPasswordReset(email) {
  return post(
    "/api/password/request-reset",
    { email: email.trim() },
    { skipAuth: true }
  );
}

// Returns { success, message, resetToken, expiresIn } on success
export async function verifyPasswordResetCode(email, code) {
  const response = await post(
    "/api/password/verify-code",
    { email: email.trim(), code },
    { skipAuth: true }
  );

  return response?.data || response;
}

export async function resetPassword(email, resetToken, newPassword) {
  return post(
    "/api/password/reset",
    { email: email.trim(), resetToken, newPassword },
    { skipAuth: true }
  );
}

export async function exchangeGoogleToken(supabaseAccessToken) {
  const response = await post(
    "/api/auth/google/exchange",
    { supabaseAccessToken, provider: "google" },
    { skipAuth: true }
  );

  const payload = response?.data || response;
  const session = payload?.session || {};
  const user = payload?.user || null;
  const token = payload?.accessToken || payload?.token || session.accessToken;

  if (!token || !user?.id) {
    throw new Error("Unable to complete Google sign-in.");
  }

  return {
    token,
    refreshToken: payload?.refreshToken || session.refreshToken || null,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    expiresAt: session.expiresIn
      ? Date.now() + session.expiresIn * 1000
      : null,
  };
}

// Spec: POST /api/auth/refresh — body: { refreshToken }
export async function refreshAccessToken(refreshToken) {
  const response = await post(
    "/api/auth/refresh",
    { refreshToken },
    { skipAuth: true }
  );

  return {
    token: response.accessToken || response.access_token,
    expiresAt: response.expiresIn
      ? Date.now() + response.expiresIn * 1000
      : null,
  };
}

// Spec: POST /api/auth/logout — body: { refreshToken }, no auth header required
export async function logoutUser(refreshToken) {
  try {
    await post("/api/auth/logout", { refreshToken }, { skipAuth: true });
  } catch {
    // Always clear local state even if server call fails
  }
}

// Spec: POST /api/auth/logout-all — requires Bearer token
export async function logoutAllDevices() {
  try {
    await post("/api/auth/logout-all", {});
  } catch {
    // Always clear local state even if server call fails
  }
}

// Spec: GET /api/auth/profile — requires Bearer token
export async function getProfile() {
  return get("/api/auth/profile");
}

// Exchange Supabase access token for backend JWT
// POST /api/auth/google/exchange — body: { supabaseAccessToken, provider }
export async function exchangeGoogleToken(supabaseAccessToken) {
  try {
    const response = await post(
      "/api/auth/google/exchange",
      {
        supabaseAccessToken,
        provider: "google",
      },
      { skipAuth: true }
    );

    // Backend returns: { success, accessToken, refreshToken, user, session: { accessToken, refreshToken } }
    const token = response.accessToken || response.session?.accessToken;
    const user = response.user;

    if (!token) {
      throw new Error("No access token in exchange response");
    }

    return {
      token,
      refreshToken: response.refreshToken || response.session?.refreshToken || null,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        : null,
      expiresAt: null,
    };
  } catch (error) {
    console.error("Google token exchange error:", error);
    throw error;
  }
}

export default {
  loginUser,
  registerUser,
  verifyMFA,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  getProfile,
  exchangeGoogleToken,
};
