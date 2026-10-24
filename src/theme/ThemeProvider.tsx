import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { darkColors, lightColors } from '@/theme';
import type { ThemeColors } from '@/theme';

const THEME_STORAGE_KEY = 'split-beat.appearance.v1';

export type ColorMode = 'dark' | 'light';

interface ThemeContextValue {
  mode: ColorMode;
  colors: ThemeColors;
  setMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ColorMode>('dark');
  const modeChangedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedMode) => {
        if (active && !modeChangedRef.current && (savedMode === 'light' || savedMode === 'dark')) setModeState(savedMode);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const setMode = useCallback((nextMode: ColorMode) => {
    modeChangedRef.current = true;
    setModeState(nextMode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ mode, colors: mode === 'light' ? lightColors : darkColors, setMode }),
    [mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
