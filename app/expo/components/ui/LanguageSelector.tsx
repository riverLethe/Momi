import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useLanguage } from "@/hooks/useLanguage";

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = React.memo(
  ({ className = "" }) => {
    const { currentLanguage, changeLanguage, t } = useLanguage();

    const languages = [
      { code: "en", label: "English" },
      { code: "zh", label: "中文" },
    ] as const;

    return (
      <View className={`flex-row bg-gray-100 rounded-lg p-1 ${className}`}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            onPress={() => changeLanguage(language.code)}
            className={`
              flex-1 py-2 px-4 rounded-md
              ${currentLanguage === language.code ? "bg-white shadow-sm" : "bg-transparent"}
            `}
            activeOpacity={0.8}
          >
            <Text
              className={`
                text-center font-medium
                ${currentLanguage === language.code ? "text-primary-600" : "text-gray-600"}
              `}
            >
              {language.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
);

LanguageSelector.displayName = "LanguageSelector";
