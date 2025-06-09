import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MessageSquarePlus, ArrowRight, FileText, BarChart, PiggyBank } from "lucide-react-native";
import { 
  Card, 
  Text, 
  XStack, 
  YStack,
  H4,
  Button,
  Image,
  Paragraph,
  Separator,
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
                Record Your First Expense
              </Text>
              <Text fontSize="$2.5" color="$gray10" marginTop="$1">
                Use our AI chat to easily log your expenses
              </Text>
            </YStack>
            <ArrowRight size={20} color="#3B82F6" />
          </XStack>
        </Card>
        
        <Card 
          padding="$4" 
          bordered 
          borderRadius="$4"
          pressStyle={{ scale: 0.98 }}
          backgroundColor="white"
          elevation={2}
          shadowColor="rgba(0,0,0,0.1)"
          shadowRadius={8}
          onPress={onSetBudgetPress}
        >
          <XStack alignItems="center" space="$3">
            <YStack
              width={52}
              height={52}
              borderRadius="$5"
              backgroundColor="$green2"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="$green4"
            >
              <PiggyBank size={28} color="#10B981" />
            </YStack>
            <YStack flex={1}>
              <Text fontWeight="$7" fontSize="$4" color="$gray12">
                Set Up Your Budget
              </Text>
              <Text fontSize="$2.5" color="$gray10" marginTop="$1">
                Define budgets to track your spending habits
              </Text>
            </YStack>
            <ArrowRight size={20} color="#10B981" />
          </XStack>
        </Card>
        
        {/* <Card 
          padding="$4" 
          bordered 
          borderRadius="$4"
          pressStyle={{ scale: 0.98 }}
          backgroundColor="white"
          elevation={2}
          shadowColor="rgba(0,0,0,0.1)"
          shadowRadius={8}
          onPress={() => router.push("/bills")}
        >
          <XStack alignItems="center" space="$3">
            <YStack
              width={52}
              height={52}
              borderRadius="$5"
              backgroundColor="$purple2"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="$purple4"
            >
              <FileText size={28} color="#8B5CF6" />
            </YStack>
            <YStack flex={1}>
              <Text fontWeight="$7" fontSize="$4" color="$gray12">
                Explore Features
              </Text>
              <Text fontSize="$2.5" color="$gray10" marginTop="$1">
                Discover all the features Momi has to offer
              </Text>
            </YStack>
            <ArrowRight size={20} color="#8B5CF6" />
          </XStack>
        </Card> */}
      </YStack>
    </YStack>
  );
};

export default WelcomeScreen; 