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

export const BillDateGroup: React.FC<BillDateGroupProps> = ({ item }) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Card
      marginHorizontal="$3.5"
      marginBottom="$3"
      borderRadius="$4"
      overflow="hidden"
      elevation={0.5}
      backgroundColor="white"
    >
     <XStack
          justifyContent="space-between"
          paddingHorizontal="$4"
          paddingVertical="$3.5"
          alignItems="center"
          backgroundColor="white"
        >
          <XStack alignItems="center" space="$1.5">
            <Calendar size={16} color="#777777" />
            <Text fontSize="$3" color="$gray10" fontWeight="600">
              {formatDate(item.date, t)}
            </Text>
          </XStack>
          <Text fontSize="$3" color="$gray10">
            -¥{item.totalAmount.toFixed(2)}
          </Text>
        </XStack>

      {!collapsed && (
        <>
          <Separator />
          <YStack paddingVertical="$2" >
            {item.bills.map((bill, index) => (
              <React.Fragment key={bill.id}>
                <BillListItem item={bill} />
                {index < item.bills.length - 1 && (
                  <Separator marginVertical="$2" borderColor="$gray3" />
                )}
              </React.Fragment>
            ))}
          </YStack>
        </>
      )}
    </Card>
  );
}; 