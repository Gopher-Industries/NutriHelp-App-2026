import * as Linking from "expo-linking";
import { useEffect, useState } from "react";

/**
 * Deep link URL scheme configuration
 * Must match app.json scheme
 */
const linking = {
  prefixes: ["nutrihelp://", "https://nutrihelp.com"],
  config: {
    screens: {
      "auth-callback": {
        path: "auth-callback",
        parse: {
          // Extract all query parameters from the deep link
          // URL: nutrihelp://auth-callback?code=xyz&state=abc
          code: (code) => `${code}`,
          state: (state) => `${state}`,
        },
      },
      // Add other routes as needed
      // home: "home/:id",
      // modal: "modal",
    },
  },
};

/**
 * Hook to handle deep links in your app
 * Use this in your main App.js/index.js to set up deep link listeners
 * 
 * Usage:
 * const { initialUrl, linkingUrl } = useDeepLinking();
 * 
 * Then use with NavigationContainer:
 * <NavigationContainer linking={linking} fallback={<SplashScreen />}>
 *   {/* Your navigation */}
 * </NavigationContainer>
 */
export const useDeepLinking = () => {
  const [initialUrl, setInitialUrl] = useState(null);
  const [linkingUrl, setLinkingUrl] = useState(null);

  // Handle initial URL when app is launched from a deep link
  useEffect(() => {
    const getInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url != null) {
        console.log("Initial URL:", url);
        setInitialUrl(url);
      }
    };

    getInitialUrl();
  }, []);

  // Handle subsequent deep links (when app is already running)
  useEffect(() => {
    const listener = Linking.addEventListener("url", ({ url }) => {
      console.log("Received URL:", url);
      setLinkingUrl(url);
    });

    return () => {
      listener.remove();
    };
  }, []);

  return {
    initialUrl,
    linkingUrl,
    linking,
  };
};

export default linking;
