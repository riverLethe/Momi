import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { 
  Card, 
  Text, 
  XStack, 
  YStack,
  H5, 
  H6,
  Button,
  Circle,
} from "tamagui";

import { getCategoryIcon } from "@/constants/categories";

interface CategorySpending {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  lightColor: string;
  icon: string;
}

interface SpendingAnalysisPreviewProps {
  topCategories: CategorySpending[];
  period: "weekly" | "monthly" | "yearly";
  currency?: string;
  isPersonalView?: boolean;
}

export const SpendingAnalysisPreview: React.FC<SpendingAnalysisPreviewProps> = ({
  topCategories,
  period,
  currency = "¥",
  isPersonalView = true,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  
  const formatCurrency = (amount: number): string => {
    return `${currency}${amount.toLocaleString()}`;
  };
  
  return (
    <YStack marginTop="$4" marginHorizontal="$4" marginBottom="$8">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
        <H5 color="$color" fontWeight="$7">{t("Spending Analysis")}</H5>
        <Button
          chromeless
          padding="$1.5"
          height="auto"
          onPress={() => router.push("/reports")}
          pressStyle={{ opacity: 0.7 }}
        >
          <XStack alignItems="center" space="$1">
            <Text color="$blue9" fontWeight="$5">{t("Details")}</Text>
            <ChevronRight size={16} color="#3B82F6" />
          </XStack>
        </Button>
      </XStack>

      <Card 
        padding="$4" 
        bordered 
        borderRadius="$4"
        elevate
        animation="bouncy"
        scale={1}
        pressStyle={{ scale: 0.98 }}
        onPress={() => router.push("/reports")}
        backgroundColor="white"
      >
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
          <H6 color="$color">{t("Top Categories")}</H6>
          <Text fontSize="$2" color="$gray10">
            {t("This")} {t(period === "weekly" ? "Week" : period === "monthly" ? "Month" : "Year")}
          </Text>
        </XStack>
        
        {topCategories.length > 0 ? (
          <XStack justifyContent="space-around" flexWrap="wrap">
            {topCategories.map((category) => {
              const CategoryIcon = getCategoryIcon(category.id);
              return (
                <YStack key={category.id} alignItems="center" space="$1" padding="$2" width="33%">
                  <Circle size="$5" backgroundColor={category.lightColor} marginBottom="$1">
                    <CategoryIcon size={22} color={category.color} />
                  </Circle>
                  <Text color="$gray11" fontSize="$2" textAlign="center">
                    {t(category.name)}
                  </Text>
                  <Text fontWeight="$7" color="$color">
                    {formatCurrency(category.amount)}
                  </Text>
                  <Text fontSize="$1" color="$gray9">
                    {category.percentage}%
                  </Text>
                </YStack>
              );
            })}
          </XStack>
        ) : (
          <YStack alignItems="center" padding="$4">
            <Text color="$gray9">{t("No spending data available")}</Text>
          </YStack>
        )}
      </Card>
    </YStack>
  );
};

export default SpendingAnalysisPreview; 