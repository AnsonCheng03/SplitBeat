import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { deviceLocale, resolveLocale, translate } from '@/i18n/translation';
import type { AppLocale, LanguagePreference } from '@/i18n/translation';

const LANGUAGE_STORAGE_KEY = 'split-beat.language.v1';

interface I18nContextValue {
  locale: AppLocale;
  preference: LanguagePreference;
  languageLoaded: boolean;
  setLanguage: (preference: LanguagePreference) => void;
  t: (source: string, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function restoredPreference(raw: string | null): LanguagePreference {
  return raw === 'en' || raw === 'zh-Hant' ? raw : 'system';
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [preference, setPreference] = useState<LanguagePreference>('system');
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [systemLocale] = useState(deviceLocale);
  const preferenceChangedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((raw) => {
        if (active && !preferenceChangedRef.current) setPreference(restoredPreference(raw));
      })
      .catch(() => {
        if (active && !preferenceChangedRef.current) setPreference('system');
      })
      .finally(() => {
        if (active) setLanguageLoaded(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (languageLoaded) void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, preference).catch(() => undefined);
  }, [languageLoaded, preference]);

  const locale = resolveLocale(preference, systemLocale);
  const t = useCallback(
    (source: string, values?: Record<string, string | number>) => translate(locale, source, values),
    [locale],
  );
  const setLanguage = useCallback((next: LanguagePreference) => {
    preferenceChangedRef.current = true;
    setPreference(next);
  }, []);
  const value = useMemo(
    () => ({ locale, preference, languageLoaded, setLanguage, t }),
    [locale, preference, languageLoaded, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
