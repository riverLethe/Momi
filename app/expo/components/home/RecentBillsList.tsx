import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import {
  ReceiptText,
  MessageSquarePlus,
} from "lucide-react-native";
import {
  Card,
  Text,
  XStack,
  YStack,
  Button,
  AnimatePresence,
  Spinner,
  Separator,
  useTheme,
} from "tamagui";

import { Bill } from "@/types/bills.types";
import { BillListItem } from "@/components/bills/BillListItem";

interface RecentBillsListProps {
  bills: Bill[];
  /** loading state (optional) */
  isLoading?: boolean;
  /** Maximum items to display */
  maxItems?: number;
}

export const RecentBillsList: React.FC<RecentBillsListProps> = ({
  bills,
  isLoading = false,
  maxItems = 4,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  // Always sort by date (latest first) and slice to maxItems
  const displayBills = useMemo(() => {
    // Always take the most recent records by date
    return [...bills]
      .sort((a, b) => {
        // Ensure we compare using timestamps to avoid potential type issues
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return timeB - timeA;
      })
      .slice(0, maxItems);
  }, [bills, maxItems]);

  return (
    <Card
      backgroundColor="$card"
      marginHorizontal="$3"
      paddingVertical="$3"
    >
      <YStack gap="$4">
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal="$3"
        >
          <XStack gap="$2" alignItems="center">
            <ReceiptText size={24} color={theme.blue9?.get()} />
            <Text fontSize="$4" fontWeight="$8" color="$color">
              {t("Recent Bills")}
            </Text>
          </XStack>

        </XStack>

        <AnimatePresence>
          {isLoading ? (
            <YStack
              padding="$6"
              alignItems="center"
              justifyContent="center"
              gap="$2"
            >
              <Spinner size="large" color="$blue9" />
              <Text color="$color9">{t("Loading...")}</Text>
            </YStack>
          ) : displayBills.length > 0 ? (
            <YStack gap="$2">
              {displayBills.map((bill, index) => (
                <React.Fragment key={bill.id}>
                  <BillListItem item={bill} />
                  {index < displayBills.length - 1 && (
                    <Separator marginVertical="$0" borderColor="$borderColor" />
                  )}
                </React.Fragment>
              ))}
            </YStack>
          ) : (
            <YStack padding="$6" alignItems="center" justifyContent="center">
              <Text color="$color9" fontSize="$3" textAlign="center">
                {t("No recent bills")}
              </Text>
              <Button
                marginTop="$3"
                onPress={() => router.push("/chat")}
                backgroundColor="$blue2"
                color="$blue9"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$blue6"
                flexDirection="row"
                alignItems="center"
                gap="$2"
              >
                <MessageSquarePlus size={16} color={theme.blue9?.get()} />
                <Text color="$blue9" fontWeight="$6">
                  {t("Add Your First Bill")}
                </Text>
              </Button>
            </YStack>
          )}
        </AnimatePresence>
      </YStack>
    </Card>
  );
};

export default RecentBillsList;
