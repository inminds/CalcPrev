import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";

export type AppLanguage = "pt-BR" | "en-US";

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  tx: (ptBr: string, enUs: string) => string;
  dateLocale: Locale;
};

const STORAGE_KEY = "calc-prev.language";
const DEFAULT_LANGUAGE: AppLanguage = "pt-BR";

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "pt-BR" || stored === "en-US") return stored;
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(resolveInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
  }, []);

  const tx = useCallback(
    (ptBr: string, enUs: string) => (language === "pt-BR" ? ptBr : enUs),
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, tx, dateLocale: language === "pt-BR" ? ptBR : enUS }),
    [language, setLanguage, tx],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
