import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MessageSquarePlus, ArrowRight, FileText, BarChart } from "lucide-react-native";
import { 
  Card, 
  Text, 
  XStack, 
  YStack,
  H4,
  Button,
  Image,
  Paragraph,
} from "tamagui";

interface WelcomeScreenProps {
  onStartChatPress: () => void;
  onSetBudgetPress: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartChatPress,
  onSetBudgetPress,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  
  return (
    <YStack flex={1} paddingHorizontal="$4" paddingVertical="$6" space="$5" justifyContent="center">
      <YStack alignItems="center" space="$2">
        <Image
          source={require("@/assets/images/welcome-illustration.png")}
          width={240}
          height={180}
          alt="Welcome"
          resizeMode="contain"
          opacity={0.9}
        />
        <H4 textAlign="center" marginTop="$4" color="$color">
          {t("Welcome to Momi")}
        </H4>
        <Paragraph textAlign="center" color="$gray11" paddingHorizontal="$4">
          {t("Your personal finance tracker to help you manage expenses and reach your financial goals")}
        </Paragraph>
      </YStack>
      
      <YStack space="$4" marginTop="$2">
        <Card 
          padding="$4" 
          bordered 
          borderRadius="$4"
          pressStyle={{ scale: 0.98 }}
          backgroundColor="white"
          onPress={onStartChatPress}
        >
          <XStack alignItems="center" space="$3">
            <YStack
              width={48}
              height={48}
              borderRadius="$4"
              backgroundColor="$blue2"
              alignItems="center"
              justifyContent="center"
            >
              <MessageSquarePlus size={24} color="#3B82F6" />
            </YStack>
            <YStack flex={1}>
              <Text fontWeight="$6" fontSize="$4" color="$color">
                {t("Record your first expense")}
              </Text>
              <Text fontSize="$2" color="$gray10">
                {t("Use our AI chat to easily log your expenses")}
              </Text>
            </YStack>
            <ArrowRight size={18} color="#3B82F6" />
          </XStack>
        </Card>
        
        <Card 
          padding="$4" 
          bordered 
          borderRadius="$4"
          pressStyle={{ scale: 0.98 }}
          backgroundColor="white"
          onPress={onSetBudgetPress}
        >
          <XStack alignItems="center" space="$3">
            <YStack
              width={48}
              height={48}
              borderRadius="$4"
              backgroundColor="$green2"
              alignItems="center"
              justifyContent="center"
            >
              <BarChart size={24} color="#10B981" />
            </YStack>
            <YStack flex={1}>
              <Text fontWeight="$6" fontSize="$4" color="$color">
                {t("Set up your budget")}
              </Text>
              <Text fontSize="$2" color="$gray10">
                {t("Define budgets to track your spending habits")}
              </Text>
            </YStack>
            <ArrowRight size={18} color="#10B981" />
          </XStack>
        </Card>
        
        <Card 
          padding="$4" 
          bordered 
          borderRadius="$4"
          pressStyle={{ scale: 0.98 }}
          backgroundColor="white"
          onPress={() => router.push("/bills")}
        >
          <XStack alignItems="center" space="$3">
            <YStack
              width={48}
              height={48}
              borderRadius="$4"
              backgroundColor="$purple2"
              alignItems="center"
              justifyContent="center"
            >
              <FileText size={24} color="#8B5CF6" />
            </YStack>
            <YStack flex={1}>
              <Text fontWeight="$6" fontSize="$4" color="$color">
                {t("Explore features")}
              </Text>
              <Text fontSize="$2" color="$gray10">
                {t("Discover all the features Momi has to offer")}
              </Text>
            </YStack>
            <ArrowRight size={18} color="#8B5CF6" />
          </XStack>
        </Card>
      </YStack>
    </YStack>
  );
};

export default WelcomeScreen; 