import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

import en from "./locales/en";
import zh from "./locales/zh";
import es from "./locales/es";

const LANGUAGE_DETECTOR = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // 1. Check if user has explicitly selected a language previously
      const savedLanguage = await AsyncStorage.getItem("user-language");
      if (savedLanguage) {
        return callback(savedLanguage);
      }

      // 2. Fallback to device locale (expo-localization), e.g. "en-US" => "en"
      const normalizedLocale = Localization.locale.replace("_", "-");
      const deviceLocale = normalizedLocale.split("-")[0].toLowerCase();
      if (["en", "zh", "es"].includes(deviceLocale)) {
        return callback(deviceLocale);
      }
    } catch (error) {
      console.log(
        "Error reading language from AsyncStorage or device locale:",
        error
      );
    }

    // 3. Final fallback
    return callback("en");
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem("user-language", lng);
    } catch (error) {
      console.log("Error saving language to AsyncStorage:", error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    resources: {
      en,
      zh,
      es,
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
