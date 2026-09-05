import React, { createContext, useContext, useState, useEffect } from 'react';
import cs from './cs.json';
import en from './en.json';

type Language = 'cs' | 'en';
type Translations = typeof cs;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, any>) => string;
}

const translations: Record<Language, any> = { cs, en };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('hestia_lang');
    if (saved === 'cs' || saved === 'en') return saved;
    return navigator.language.startsWith('cs') || navigator.language.startsWith('sk') ? 'cs' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hestia_lang', lang);
  };

  const t = (path: string, params?: Record<string, any>): string => {
    const keys = path.split('.');
    let current = translations[language];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English, then Czech
        let fallback = translations['en'];
        for (const k of keys) {
          if (fallback && typeof fallback === 'object' && k in fallback) {
            fallback = fallback[k];
          } else {
            return path;
          }
        }
        current = typeof fallback === 'string' ? fallback : path;
        break;
      }
    }
    let res = typeof current === 'string' ? current : path;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        res = res.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return res;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
