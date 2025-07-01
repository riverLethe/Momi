import React from "react";
import { Card, Text, XStack, Paragraph } from "tamagui";
import { formatCurrency } from "@/utils/format";
import { useTranslation } from "react-i18next";

export interface TotalExpenseCardProps {
  totalExpense: number;
}

export const TotalExpenseCard: React.FC<TotalExpenseCardProps> = ({
  totalExpense,
}) => {
  const { t } = useTranslation();

  return (
    <Card
      backgroundColor="$card"
      marginHorizontal="$3"
      marginVertical="$2"
      paddingVertical="$3"
      paddingHorizontal="$4"
      borderRadius="$4"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <Paragraph color="$color11" fontWeight="500">
          {t("Total Expense")}
        </Paragraph>
        <Text fontSize={20} fontWeight="700" color="$red10">
          {formatCurrency(totalExpense)}
        </Text>
      </XStack>
    </Card>
  );
}; 