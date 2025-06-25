import React, { useMemo, useCallback } from "react";
import { Alert, TouchableOpacity } from "react-native";
import { Avatar, Card, Text, XStack, YStack } from "tamagui";
import { Calendar, MapPin } from "lucide-react-native";
import { getCategoryById, getCategoryIcon } from "@/constants/categories";
import { useTranslatedCategoryName } from "@/constants/categories";
import { Bill } from "@/types/bills.types";
import { formatCurrency } from "@/utils/format";
import { useBillActions } from "@/hooks/useBillActions";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/useLocale";

interface ExpenseItemProps {
  expense: Bill;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense }) => {
  const router = useRouter();

  // 缓存日期格式化
  const formattedDate = useMemo(() =>
    new Date(expense.date).toLocaleDateString(),
    [expense.date]
  );

  // 缓存金额格式化
  const formattedAmount = useMemo(() =>
    formatCurrency(expense.amount),
    [expense.amount]
  );

  // 缓存分类信息
  const categoryInfo = useMemo(() => {
    const category = getCategoryById(expense.category);
    const CategoryIcon = getCategoryIcon(expense.category);
    return { category, CategoryIcon };
  }, [expense.category]);

  const categoryName = useTranslatedCategoryName(expense.category);

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/bills/details",
      params: { id: expense.id },
    });
  }, [router, expense.id]);

  const { category, CategoryIcon } = categoryInfo;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={{ marginVertical: 4 }}>
      <Card
        elevate
        size="$2"
        backgroundColor="white"
        borderWidth={1}
        borderColor="$gray4"
        borderRadius="$4"
        padding="$3"
      >
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap="$3" flex={1}>
            <CategoryIcon size={24} color={category?.color || "#64748B"} />
            <YStack flex={1} gap="$1">
              <Text fontSize="$3" fontWeight="$6" numberOfLines={1}>
                {categoryName}
              </Text>
              <Text fontSize="$2" color="$gray10" numberOfLines={1}>
                {formattedDate}
              </Text>
            </YStack>
          </XStack>

          <YStack alignItems="flex-end">
            <Text fontSize="$3" fontWeight="$6" color="$blue9">
              {formattedAmount}
            </Text>
            {expense.merchant && (
              <Text fontSize="$2" color="$gray10" numberOfLines={1}>
                {expense.merchant}
              </Text>
            )}
          </YStack>
        </XStack>
      </Card>
    </TouchableOpacity>
  );
};

export default React.memo(ExpenseItem);
