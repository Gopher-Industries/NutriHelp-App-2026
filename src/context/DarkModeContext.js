import React, { createContext, useMemo, useState } from 'react';

export const DarkModeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

export function DarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const value = useMemo(
    () => ({
      darkMode,
      toggleDarkMode: () => setDarkMode((current) => !current),
    }),
    [darkMode]
  );

  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
}
