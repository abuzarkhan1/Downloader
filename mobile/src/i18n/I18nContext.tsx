import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import { translations, Language } from './translations';

let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Fallback for non-native / test environment
}

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  isRTL: boolean;
}

const STORAGE_KEY = '@app_language_preference';
const memoryStore: Record<string, string> = {};

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => translations.en[key] || (key as string),
  isRTL: false,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    async function loadLang() {
      try {
        if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
          const savedLang = await AsyncStorage.getItem(STORAGE_KEY);
          if (savedLang === 'ur' || savedLang === 'en') {
            setLanguageState(savedLang);
            return;
          }
        }
      } catch (e) {}

      if (memoryStore[STORAGE_KEY] === 'ur' || memoryStore[STORAGE_KEY] === 'en') {
        setLanguageState(memoryStore[STORAGE_KEY] as Language);
      }
    }
    loadLang();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    memoryStore[STORAGE_KEY] = lang;
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
      }
    } catch (e) {}

    const shouldBeRTL = lang === 'ur';
    try {
      I18nManager.allowRTL(shouldBeRTL);
    } catch (e) {
      // Ignored in non-native or test environments
    }
  };

  const isRTL = language === 'ur';

  const t = (key: keyof typeof translations.en): string => {
    const currentDict = translations[language] || translations.en;
    return currentDict[key] || translations.en[key] || String(key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
