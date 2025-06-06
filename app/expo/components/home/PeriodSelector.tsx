import React from "react";
import { useTranslation } from "react-i18next";
import { 
  XStack, 
  Text, 
  Button,
} from "tamagui";

export type BudgetPeriod = "weekly" | "monthly" | "yearly";

interface PeriodSelectorProps {
  value: BudgetPeriod;
  onChange: (period: BudgetPeriod) => void;
  compact?: boolean;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  value,
  onChange,
  compact = false,
}) => {
  const { t } = useTranslation();
  
  const periods: { value: BudgetPeriod; label: string }[] = [
    { value: "weekly", label: t("Weekly") },
    { value: "monthly", label: t("Monthly") },
    { value: "yearly", label: t("Yearly") },
  ];

  return (
    <XStack 
      backgroundColor="$gray2" 
      borderRadius="$4" 
      padding="$0.5"
      height={compact ? 30 : 36}
    >
      {periods.map((period) => (
        <Button
          key={period.value}
          size={compact ? "$2" : "$3"}
          flexGrow={1}
          backgroundColor={value === period.value ? "$blue9" : "transparent"}
          color={value === period.value ? "white" : "$gray11"}
          fontWeight={value === period.value ? "$7" : "$5"}
          onPress={() => onChange(period.value)}
          pressStyle={{ opacity: 0.8 }}
          borderRadius="$3"
          paddingHorizontal="$1"
        >
          <Text 
            fontSize={compact ? "$1" : "$2"} 
            color={value === period.value ? "white" : "$gray11"}
            fontWeight={value === period.value ? "$7" : "$5"}
          >
            {period.label}
          </Text>
        </Button>
      ))}
    </XStack>
  );
};

export default PeriodSelector; 