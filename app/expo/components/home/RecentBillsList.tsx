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
  isLoading?: boolean;
  maxItems?: number;
}

export const RecentBillsList: React.FC<RecentBillsListProps> = ({
  bills,
  isLoading = false,
  maxItems = 4,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  // Sort bills by date (most recent first) and then take the first `maxItems` items
  const displayBills = useMemo(() => {
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
      backgroundColor="white"
      marginHorizontal="$2"
      marginTop="$4"
      padding="$0"
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

          {bills.length > 0 && (
            <Button
              size="$2"
              color="$blue9"
              onPress={() => router.push("/bills")}
              paddingHorizontal="$2"
              borderWidth={1}
              borderColor="$blue6"
              backgroundColor="$blue2"
            >
              <Text color="$blue9" fontSize="$2">
                {t("View All")}
              </Text>
              <ChevronRight size={12} />
            </Button>
          )}
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
