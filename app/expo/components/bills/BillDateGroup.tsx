import { Bill } from "@/types/bills.types";
import { Calendar } from "lucide-react-native";
import React, { useState } from "react";
import { Card, Text, XStack, YStack, Separator } from "tamagui";
import { BillListItem } from "./BillListItem";
import { useTranslation } from "react-i18next";

interface BillDateGroupProps {
  item: {
    date: string;
    bills: Bill[];
    totalAmount: number;
  };
  onDelete?: (bill: Bill) => void;
}

const formatDate = (dateStr: string, t: (key: string) => string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return t("Today");
  } else if (date.toDateString() === yesterday.toDateString()) {
    return t("Yesterday");
  } else {
    return date.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    });
  }
};

export const BillDateGroup: React.FC<BillDateGroupProps> = ({
  item,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Card
      marginHorizontal="$0"
      borderRadius="$0"
      overflow="hidden"
      elevation={0.5}
      backgroundColor="white"
    >
      <XStack
        justifyContent="space-between"
        paddingHorizontal="$4"
        paddingVertical="$2"
        alignItems="center"
        backgroundColor="$gray2"
      >
        <XStack alignItems="center" gap="$2">
          <Calendar size={12} color="#777777" />
          <Text fontSize={12} color="$gray10" fontWeight="600">
            {formatDate(item.date, t)}
          </Text>
        </XStack>
        <Text fontSize={12} color="$gray10">
          -¥{item.totalAmount.toFixed(2)}
        </Text>
      </XStack>

      {!collapsed && (
        <>
          <YStack paddingVertical="$2">
            {item.bills.map((bill, index) => (
              <React.Fragment key={bill.id}>
                <BillListItem item={bill} onDelete={onDelete} />
                {index < item.bills.length - 1 && (
                  <Separator marginVertical="$0" borderColor="$gray3" />
                )}
              </React.Fragment>
            ))}
          </YStack>
        </>
      )}
    </Card>
  );
};
