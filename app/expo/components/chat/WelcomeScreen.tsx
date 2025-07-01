import React from 'react';
import { Image } from 'react-native';
import { YStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';

export const WelcomeScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      paddingHorizontal="$5"
    >
      <Image
        source={require('@/assets/images/welcome-chat.png')}
        style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 24 }}
      />
      <Text
        fontSize={22}
        fontWeight="bold"
        color="$color"
        marginBottom="$4"
        textAlign="center"
      >
        {t("Welcome to MomiQ AI Assistant")}
      </Text>
      <Text
        fontSize={16}
        color="$color10"
        textAlign="center"
        marginBottom="$8"
        lineHeight={24}
      >
        {t("I can help you track expenses, manage your budget, and provide financial insights.")}
      </Text>
      <Text
        fontSize={10}
        color="$color9"
        textAlign="center"
        fontStyle="italic"
      >
        {t("Hold the mic button and speak to start")}
      </Text>
    </YStack>
  );
}; 