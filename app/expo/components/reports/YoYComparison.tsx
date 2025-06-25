import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import {
  Card,
  XStack,
  YStack,
  Text,
  Button,
  View,
  Separator
} from "tamagui";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight
} from "lucide-react-native";
import { TopSpendingCategory } from "@/types/reports.types";
import { formatCurrency } from "@/utils/format";

interface YoYComparisonProps {
  topCategories: TopSpendingCategory[];
}

const YoYComparison: React.FC<YoYComparisonProps> = ({ topCategories }) => {
  const { t } = useTranslation();
  const router = useRouter();

  if (!topCategories || topCategories.length === 0) {
    return null;
  }

  return (
    <Card
      padding="$4"
      borderRadius="$4"
      backgroundColor="white"
      marginBottom="$4"
      shadowColor="rgba(0,0,0,0.05)"
      shadowRadius={2}
      shadowOffset={{ width: 0, height: 1 }}
      elevation={1}
    >
      <Text fontSize={20} fontWeight="$7" marginBottom="$3" color="$gray12">
        {t("Top Spending Categories")}
      </Text>

      <YStack space="$3">
        {topCategories.map((category, index) => {
          // Determine change indicator
          const hasChange = category.changePercentage !== undefined;
          const isIncrease = hasChange && (category.changePercentage! > 0);
          const isDecrease = hasChange && (category.changePercentage! < 0);

          return (
            <YStack key={index}>
              <XStack justifyContent="space-between" alignItems="center">
                <XStack space="$2" alignItems="center">
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      backgroundColor: category.color,
                    }}
                  />
                  <Text fontWeight="$6" fontSize="$3">{t(category.category)}</Text>
                </XStack>
                <Text fontWeight="$7" fontSize="$3">
                  {formatCurrency(category.amount)}
                </Text>
              </XStack>

              {hasChange && (
                <XStack marginTop="$1" marginLeft="$5" space="$1" alignItems="center">
                  {isIncrease ? (
                    <>
                      <ArrowUpRight size={14} color="#EF4444" />
                      <Text fontSize={12} color="#EF4444">
                        {category.changePercentage}% {t("from last year")}
                      </Text>
                    </>
                  ) : isDecrease ? (
                    <>
                      <ArrowDownRight size={14} color="#10B981" />
                      <Text fontSize={12} color="#10B981">
                        {Math.abs(category.changePercentage!)}% {t("from last year")}
                      </Text>
                    </>
                  ) : (
                    <Text fontSize={12} color="$gray10">
                      {t("No change from last year")}
                    </Text>
                  )}
                </XStack>
              )}

              <XStack marginTop="$2" marginBottom="$2">
                <View
                  style={{
                    height: 8,
                    backgroundColor: category.color,
                    borderRadius: 4,
                    width: `${Math.min(100, Math.max(5, category.percentage))}%`,
                  }}
                />
              </XStack>

              {index < topCategories.length - 1 && (
                <Separator marginVertical="$1.5" />
              )}
            </YStack>
          );
        })}
      </YStack>

      <Button
        marginTop="$3"
        backgroundColor="$gray1"
        borderColor="$gray4"
        borderWidth={1}
        onPress={() => {
          // Navigate to bills screen with filters
          router.push({
            pathname: "/bills",
            params: { category: topCategories[0].category }
          });
        }}
      >
        <XStack space="$1" alignItems="center">
          <Text color="$gray12" fontWeight="$6">
            {t("View All Bills")}
          </Text>
          <ArrowRight size={16} color="#64748B" />
        </XStack>
      </Button>
    </Card>
  );
};

export default YoYComparison; 