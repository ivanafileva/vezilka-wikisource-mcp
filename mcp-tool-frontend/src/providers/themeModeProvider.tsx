import { useCallback, useEffect, useMemo, useState } from 'react';
import * as React from 'react';
import { CssBaseline, ThemeProvider, type PaletteMode } from '@mui/material';
import ThemeModeContext from '../contexts/themeModeContext.ts';
import { createAppTheme } from '../theme/theme.ts';

const STORAGE_KEY = 'themeMode';

const initialMode = (): PaletteMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Storage unavailable (private mode) - fall back to the OS preference.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** Provides the MUI theme and a light/dark toggle, remembered per browser. */
const ThemeModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>(initialMode);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore - the choice just will not be remembered.
    }
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ThemeModeContext value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline/>
        {children}
      </ThemeProvider>
    </ThemeModeContext>
  );
};

export default ThemeModeProvider;
