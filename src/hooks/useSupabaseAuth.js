
import * as Linking from "expo-linking";
import { useCallback, useEffect } from "react";

import { useUser } from "../context/UserContext";
import supabase from "../utils/supabase";

function mapSupabaseUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    metadata: user.user_metadata || {},
  };
}

function parseAuthFragment(url) {
  const fragment = url.split("#")[1];
  if (!fragment) {
    return {};
  }
  return Object.fromEntries(new URLSearchParams(fragment).entries());
}

function hasSupabaseAuthParams(url) {
  return /(code=|access_token=|refresh_token=)/.test(url);
}

export function useSupabaseAuth() {
  const { login, logout } = useUser();

  const syncSessionToUserContext = useCallback(
    async (session) => {
      if (!session?.access_token) {
        await logout();
        return;
      }

      await login({
        token: session.access_token,
        user: mapSupabaseUser(session.user),
        expiresAt: session.expires_at ? session.expires_at * 1000 : null,
      });
    },
    [login, logout]
  );

  const handleOAuthCallback = useCallback(
    async (url) => {
      if (!url || !hasSupabaseAuthParams(url)) {
        return false;
      }

      const { queryParams } = Linking.parse(url);
      const code = typeof queryParams?.code === "string" ? queryParams.code : null;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          throw error;
        }
        return true;
      }

      const fragmentParams = parseAuthFragment(url);
      const accessToken = fragmentParams.access_token;
      const refreshToken = fragmentParams.refresh_token;

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          throw error;
        }
        return true;
      }

      return false;
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) {
          syncSessionToUserContext(data.session);
        }
      })
      .catch(() => {
        if (!cancelled) {
          logout();
        }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSessionToUserContext(session);
    });

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleOAuthCallback(url);
        }
      })
      .catch(() => {});

    const deepLinkSubscription = Linking.addEventListener("url", ({ url }) => {
      handleOAuthCallback(url);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
      deepLinkSubscription.remove();
    };
  }, [handleOAuthCallback, logout, syncSessionToUserContext]);

  return {
    handleOAuthCallback,
    syncSessionToUserContext,
  };
}

export default useSupabaseAuth;
