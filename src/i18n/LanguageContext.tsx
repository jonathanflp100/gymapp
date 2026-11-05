import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { translations } from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatDate: (dateInput: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatWeight: (weightKg: number) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'gymapp_preferred_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode; defaultLang?: SupportedLanguage }> = ({
  children,
  defaultLang = 'pt-BR',
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (saved === 'pt-BR' || saved === 'es-PY') {
        return saved;
      }
    }
    return defaultLang;
  });

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to pt-BR if key is missing in es-PY
        let fallback: any = translations['pt-BR'];
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let result = current;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }

    return result;
  };

  const formatDate = (dateInput: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    try {
      // "2026-11-05" (só a data) é lida no fuso local, para não aparecer como o dia anterior.
      const date =
        typeof dateInput === 'string'
          ? /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
            ? new Date(`${dateInput}T12:00:00`)
            : new Date(dateInput)
          : dateInput;
      const locale = language === 'pt-BR' ? 'pt-BR' : 'es-PY';
      return new Intl.DateTimeFormat(locale, options || { day: '2-digit', month: 'short' }).format(date);
    } catch {
      return String(dateInput);
    }
  };

  const formatWeight = (weightKg: number): string => {
    return `${weightKg.toFixed(1).replace(/\.0$/, '')} kg`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate, formatWeight }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
