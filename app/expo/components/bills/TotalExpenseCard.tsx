import { useTranslation } from "react-i18next";
import { Card, Paragraph, Text, XStack } from "tamagui";
import { formatCurrency } from "@/utils/format";

interface TotalExpenseCardProps {
  totalExpense: number;
}

export const TotalExpenseCard: React.FC<TotalExpenseCardProps> = ({
  totalExpense,
}) => {
  const { t } = useTranslation();

  return (
    <Card
      backgroundColor="white"
      marginHorizontal="$3"
      marginVertical="$2"
      paddingVertical="$3"
      paddingHorizontal="$4"
      borderRadius="$4"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <Paragraph color="$gray11" fontWeight="500">
          {t("Total Expense")}
        </Paragraph>
        <Text fontSize={20} fontWeight="700" color="$red10">
          {formatCurrency(totalExpense)}
        </Text>
      </XStack>
    </Card>
  );
}; 