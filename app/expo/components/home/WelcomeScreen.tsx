import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ArrowRight, ChevronRight, MessageSquarePlus } from "lucide-react-native";
import { 
  Text, 
  YStack,
  Button,
  Image,
  Paragraph,
  XStack,
  H4,
  Card,
} from "tamagui";

interface WelcomeScreenProps {
  onStartChatPress: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartChatPress,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  
  return (
    <YStack flex={1} paddingHorizontal="$4" paddingVertical="$6" space="$5" justifyContent="center">

      
      {/* Logo and Title Section */}
      <YStack alignItems="center" space="$2">
        <Image
          source={require("@/assets/images/welcome-illustration.png")}
          width={180}
          height={180}
          alt="Momi Logo"
          resizeMode="contain"
          borderRadius={32}
        />
        
        <YStack space="$2" alignItems="center">
          <H4 textAlign="center" marginTop="$4" color="$color">
          {t("Welcome to Momi")}
        </H4>
          
          <Paragraph textAlign="center" color="$gray11" paddingHorizontal="$4">
          {t("Your personal finance tracker to help you manage expenses and reach your financial goals")}
        </Paragraph>
        </YStack>
      </YStack>
      
     <YStack space="$4" marginTop="$2">
        <Card 
          padding="$4" 
          bordered 
          borderRadius="$4"
          pressStyle={{ scale: 0.98 }}
          backgroundColor="white"
          elevation={2}
          shadowColor="rgba(0,0,0,0.1)"
          shadowRadius={8}
          onPress={onStartChatPress}
        >
          <XStack alignItems="center" space="$3">
            <YStack
              width={52}
              height={52}
              borderRadius="$5"
              backgroundColor="$blue2"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="$blue4"
            >
              <MessageSquarePlus size={28} color="#3B82F6" />
            </YStack>
            <YStack flex={1}>
              <Text fontWeight="$7" fontSize="$4" color="$gray12">
                {t("Record your first bill")}
              </Text>
              <Text fontSize="$2.5" color="$gray10" marginTop="$1">
                {t("Use our AI chat to easily log your expenses")}
              </Text>
            </YStack>
            <ChevronRight size={20} color="#3B82F6" />
          </XStack>
        </Card>
      </YStack>
    </YStack>
  );
};

export default WelcomeScreen; 