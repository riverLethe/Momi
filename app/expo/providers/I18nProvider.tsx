import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import * as Localization from 'expo-localization';

type LanguageContextType = {
  /*
   * The user language preference. One of:
   *   - 'system'  => follow device locale
   *   - locale code like 'en', 'zh', 'es'
   */
  language: string;
  setLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'system',
  setLanguage: () => { }
});

export const useLanguage = () => useContext(LanguageContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // language holds the user preference ("system" | locale code)
  const [language, setLanguageState] = useState<string>('system');

  // On mount, load the saved preference (if any)
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('user-language');
        if (saved) {
          setLanguageState(saved);
        }
      } catch (err) {
        console.log('Error loading language preference:', err);
      }
    })();
  }, []);

  const setLanguage = async (lang: string) => {
    try {
      if (lang === 'system') {
        // Remove persisted preference and fall back to device locale
        await AsyncStorage.removeItem('user-language');
        const normalized = Localization.locale.replace('_', '-');
        const deviceLocale = normalized.split('-')[0].toLowerCase();
        i18n.changeLanguage(['en', 'zh', 'es'].includes(deviceLocale) ? deviceLocale : 'en');
        setLanguageState('system');
        return;
      }

      await AsyncStorage.setItem('user-language', lang);
      i18n.changeLanguage(lang);
      setLanguageState(lang);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </LanguageContext.Provider>
  );
};

export default I18nProvider;
