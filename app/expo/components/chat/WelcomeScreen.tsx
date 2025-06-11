import React from 'react';
import { Image } from 'react-native';
import { YStack, Text } from 'tamagui';

export const WelcomeScreen: React.FC = () => {
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
        color="$gray800"
        marginBottom="$4"
        textAlign="center"
      >
        Welcome to Momiq AI Assistant
      </Text>
      <Text
        fontSize={16}
        color="$gray11"
        textAlign="center"
        marginBottom="$8"
        lineHeight={24}
      >
        I can help you track expenses, manage your budget, and provide financial
        insights.
      </Text>
      <Text
        fontSize={10}
        color="$gray9"
        textAlign="center"
        fontStyle="italic"
      >
        Hold the mic button and speak to start
      </Text>
    </YStack>
  );
}; 