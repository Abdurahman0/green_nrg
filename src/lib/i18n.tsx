import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import uz from '@/locales/uz.json';
import ru from '@/locales/ru.json';

type Language = 'uz' | 'ru';

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  uz,
  ru,
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const detectInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'ru';
  const saved = window.localStorage.getItem('lang');
  if (saved === 'uz' || saved === 'ru') return saved;
  return navigator.language.toLowerCase().startsWith('uz') ? 'uz' : 'ru';
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => detectInitialLanguage());

  const setLang = (next: Language) => {
    if (next !== 'uz' && next !== 'ru') return;
    setLangState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', next);
    }
  };

  const t = useMemo(
    () => (key: string) => translations[lang][key] ?? translations.ru[key] ?? key,
    [lang]
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};

