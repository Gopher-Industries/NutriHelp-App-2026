import { post, ApiError } from "./baseApi";

/**
 * Transforms backend auth response to match UserContext.login() requirements
 */
function transformAuthResponse(response) {
  console.log("[authApi] Backend response:", JSON.stringify(response, null, 2));
  
  if (!response) {
    throw new Error("Invalid response from auth server");
  }

  // Check if MFA is required in the response body
  if (response.requiresMFA || response.mfaRequired || response.needsMFA) {
    console.log("[authApi] MFA required flag detected in response");
    const error = new Error("MFA required");
    error.code = "MFA_REQUIRED";
    error.status = 202;
    throw error;
  }

  // Handle both camelCase (accessToken) and snake_case (access_token) responses
  const token = response.accessToken || response.access_token || response.token;
  
  if (!token) {
    console.error("[authApi] No token in response:", response);
    throw new Error("No access token in response from server");
  }

  const transformed = {
    token,
    user: response.user
      ? {
          id: response.user.id || response.user.user_id,
          email: response.user.email,
          name:
            response.user.name ||
            response.user.full_name ||
            `${response.user.first_name || ''} ${response.user.last_name || ''}`.trim(),
          role: response.user.role || response.user.role_name,
          firstName: response.user.first_name,
          lastName: response.user.last_name,
        }
      : null,
    expiresAt: response.expiresIn ? Date.now() + response.expiresIn * 1000 : null,
  };

  console.log("[authApi] Transformed response:", JSON.stringify(transformed, null, 2));
  return transformed;
}

export async function loginUser(email, password, rememberMe = false) {
  const response = await post(
    "/api/login",
    {
      email: email.trim(),
      password,
    },
    { skipAuth: true }
  );

  console.log("[authApi] loginUser response:", JSON.stringify(response, null, 2));

  const mfaEnabled = response?.mfa_enabled || response?.user?.mfa_enabled;
  console.log("[authApi] mfaEnabled check:", mfaEnabled);

  if (mfaEnabled) {
    console.log("[authApi] MFA required, returning MFA object");
    return {
      mfaRequired: true,
      email: email.trim(),
      password,
      response,
    };
  }

  console.log("[authApi] No MFA, transforming response");
  return transformAuthResponse(response);
}

export async function registerUser(firstName, lastName, email, password) {
  console.log("[authApi] Registering user:", { firstName, lastName, email });
  
  try {
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

    console.log("[authApi] Register response:", JSON.stringify(response));

    let parsedResponse = response;
    if (typeof response === "string") {
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        parsedResponse = response;
      }
    }

    // Register endpoint might not return full auth response, just success
    if (parsedResponse && parsedResponse.success === false) {
      console.error("[authApi] Registration failed:", parsedResponse.errors || parsedResponse.error || parsedResponse);
      throw new Error(
        parsedResponse.errors?.[0]?.message || 
        parsedResponse.error || 
        "Registration failed"
      );
    }

    return parsedResponse;
  } catch (error) {
    console.error("[authApi] Register error:", error);
    throw error;
  }
}

export async function verifyMFA(email, password, code) {
  const response = await post(
    "/api/login/mfa",
    {
      email: email.trim(),
      password,
      mfa_token: code,
    },
    { skipAuth: true }
  );

  return transformAuthResponse(response);
}

export async function resendMFACode(email) {
  const response = await post(
    "/api/login/resend-mfa",
    {
      email: email.trim(),
    },
    { skipAuth: true }
  );

  return response;
}

export async function requestPasswordReset(email) {
  const response = await post(
    "/api/auth/forgot-password",
    {
      email: email.trim(),
    },
    { skipAuth: true }
  );

  return response;
}

export async function verifyPasswordResetCode(email, code) {
  const response = await post(
    "/api/auth/verify-reset-code",
    {
      email: email.trim(),
      code,
    },
    { skipAuth: true }
  );

  return response;
}

export async function resetPassword(email, code, password) {
  const response = await post(
    "/api/auth/reset-password",
    {
      email: email.trim(),
      code,
      password,
    },
    { skipAuth: true }
  );

  return response;
}

export async function logout() {
  try {
    const response = await post("/api/auth/logout", {});
    return response;
  } catch {
    // Logout can fail on network error, but we still clear local data
    return { success: true };
  }
}

export async function refreshToken() {
  const response = await post("/api/auth/refresh", {});
  
  if (response.accessToken) {
    return transformAuthResponse(response);
  }
  
  return response;
}

export default {
  loginUser,
  registerUser,
  verifyMFA,
  resendMFACode,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword,
  logout,
  refreshToken,
};
