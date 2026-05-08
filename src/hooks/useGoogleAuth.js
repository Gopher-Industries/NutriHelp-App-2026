import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";

import supabase from "../utils/supabaseClient";
import { exchangeGoogleToken } from "../api/authApi";

WebBrowser.maybeCompleteAuthSession();

const getRedirectUrl = () => {
  const url = Linking.createURL("auth-callback");
  console.log("[OAuth] Redirect URL:", url);
  return url;
};


export const useGoogleAuth = ({ onSuccess } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const callbackInProgress = useRef(false);

  /**
   * Step 1: Handle OAuth callback.
   * Implicit flow puts tokens in the URL hash fragment:
   * nutrihelp://auth-callback#access_token=xxx&refresh_token=xxx&...
   */
  const handleOAuthCallback = useCallback(async (url) => {
    if (!url?.includes("auth-callback")) return false;

    // Guard against duplicate calls (Android fires both openAuthSessionAsync
    // result and a Linking URL event for the same redirect)
    if (callbackInProgress.current) return false;
    callbackInProgress.current = true;

    try {
      // Parse tokens from the URL hash fragment (implicit flow)
      const fragment = url.includes("#") ? url.split("#")[1] : "";
      const params = new URLSearchParams(fragment);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      console.log("[OAuth] Callback URL:", url);
      console.log("[OAuth] Access token present:", !!accessToken);

      if (!accessToken) {
        throw new Error("No access token in OAuth callback URL");
      }

      // Register the session with the Supabase client so it can refresh automatically
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? "",
      });
      if (sessionError) {
        throw new Error(`Supabase session error: ${sessionError.message}`);
      }

      // Exchange the Supabase token with the backend.
      // exchangeGoogleToken returns { token, refreshToken, user } — the shape login() expects.
      const authData = await exchangeGoogleToken(accessToken);

      setLoading(false);
      if (onSuccess) {
        await onSuccess(authData);
      }
      return true;
    } catch (err) {
      const errorMessage = err.message || "OAuth callback handling failed";
      setError(errorMessage);
      console.error("OAuth callback error:", err);
      setLoading(false);
      return false;
    } finally {
      callbackInProgress.current = false;
    }
  }, [onSuccess]);

  /**
   * Step 2: Initiate OAuth — opens browser with Google login.
   */
  const initiateGoogleSignIn = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const redirectUrl = getRedirectUrl();

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw new Error(`Supabase OAuth error: ${oauthError.message}`);
      if (!data?.url) throw new Error("No OAuth URL returned from Supabase");

      // On iOS, ASWebAuthenticationSession intercepts the redirect internally
      // and returns it as result.url — Linking events are never fired.
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl, {
        showInRecents: true,
      });

      if (result.type === "success" && result.url) {
        await handleOAuthCallback(result.url);
      } else if (result.type === "cancel" || result.type === "dismiss") {
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err.message || "Google sign-in initiation failed";
      setError(errorMessage);
      console.error("OAuth initiation error:", err);
      setLoading(false);
      throw err;
    }
  }, [handleOAuthCallback]);

  // Android: Linking URL event fires in addition to openAuthSessionAsync result
  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleOAuthCallback(url);
    });
    return () => subscription.remove();
  }, [handleOAuthCallback]);

  return {
    initiateGoogleSignIn,
    handleOAuthCallback,
    loading,
    error,
  };
};

export default useGoogleAuth;
