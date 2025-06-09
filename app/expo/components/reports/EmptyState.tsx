import React from "react";
import { useTranslation } from "react-i18next";
import { 
  YStack, 
  Text, 
  Button,
  Card,
  Image,
  XStack
} from "tamagui";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message 
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card
      backgroundColor="white"
      borderRadius="$4"
      elevate
      shadowColor="rgba(0,0,0,0.05)"
      marginVertical="$6"
      padding="$6"
    >
      <YStack
        space="$4"
        alignItems="center"
        paddingHorizontal="$4"
        paddingVertical="$6"
      >
        <Image
          source={require("@/assets/images/no-data.png")}
          alt="No data"
          width={200}
          height={160}
          resizeMode="contain"
        />
        
        <Text
          fontSize="$5"
          fontWeight="$7"
          color="$gray11"
          textAlign="center"
        >
          {t("No Data Available")}
        </Text>
        
        <Text
          fontSize="$3"
          color="$gray9"
          textAlign="center"
          marginBottom="$2"
        >
          {message || t("Start tracking your expenses to see reports")}
        </Text>
        
        <Button
          backgroundColor="$blue9"
          size="$4"
          paddingHorizontal="$4"
          borderRadius="$4"
          color="white"
          pressStyle={{ opacity: 0.8 }}
          onPress={() => router.push("/(tabs)/chat" as any)}
        >
          <XStack alignItems="center" space="$2">
            <Plus size={16} color="white" />
            <Text color="white" fontWeight="$6">
              {t("Add Expense")}
            </Text>
          </XStack>
        </Button>
      </YStack>
    </Card>
  );
};

export default EmptyState; 