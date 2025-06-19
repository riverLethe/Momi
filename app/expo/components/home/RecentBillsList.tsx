import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import {
  ChevronRight,
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
} from "tamagui";

import { Bill } from "@/types/bills.types";
import { BillListItem } from "@/components/bills/BillListItem";

interface RecentBillsListProps {
  bills: Bill[];
  /** loading state (optional) */
  isLoading?: boolean;
  /** Maximum items to display */
  maxItems?: number;
  /** Optional start date for filtering (inclusive) */
  periodStart?: Date;
  /** Optional end date for filtering (inclusive) */
  periodEnd?: Date;
}

export const RecentBillsList: React.FC<RecentBillsListProps> = ({
  bills,
  isLoading = false,
  maxItems = 4,
  periodStart,
  periodEnd,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  // Filter by period if provided, then sort by date (latest first), slice to maxItems
  const displayBills = useMemo(() => {
    let list = bills;

    if (periodStart && periodEnd) {
      list = list.filter((b) => {
        const d = new Date(b.date);
        return d >= periodStart && d <= periodEnd;
      });
    }

    return [...list]
      .sort((a, b) => {
        // Ensure we compare using timestamps to avoid potential type issues
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return timeB - timeA;
      })
      .slice(0, maxItems);
  }, [bills, maxItems, periodStart, periodEnd]);

  return (
    <Card
      backgroundColor="white"
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
            <ReceiptText size={24} color="#6366F1" />
            <Text fontSize="$4" fontWeight="$8" color="$gray12">
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
              <Text color="$gray9">{t("Loading...")}</Text>
            </YStack>
          ) : displayBills.length > 0 ? (
            <YStack gap="$2">
              {displayBills.map((bill, index) => (
                <React.Fragment key={bill.id}>
                  <BillListItem item={bill} />
                  {index < displayBills.length - 1 && (
                    <Separator marginVertical="$0" borderColor="$gray3" />
                  )}
                </React.Fragment>
              ))}
            </YStack>
          ) : (
            <YStack padding="$6" alignItems="center" justifyContent="center">
              <Text color="$gray9" fontSize="$3" textAlign="center">
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
                <MessageSquarePlus size={16} color="#3B82F6" />
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
