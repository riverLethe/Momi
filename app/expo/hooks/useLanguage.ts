import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = "app_language";

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = async (language: "en" | "zh") => {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  };

  const getCurrentLanguage = () => {
    return i18n.language as "en" | "zh";
  };

  const initializeLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "zh")) {
        await i18n.changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error("Failed to initialize language:", error);
    }
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    initializeLanguage,
    currentLanguage: getCurrentLanguage(),
  };
};
