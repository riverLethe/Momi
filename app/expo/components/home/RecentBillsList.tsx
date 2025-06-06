import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ChevronRight, ReceiptText } from "lucide-react-native";
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
  currency?: string;
  maxItems?: number;
}

export const RecentBillsList: React.FC<RecentBillsListProps> = ({
  bills,
  isLoading = false,
  currency = "¥",
  maxItems = 4,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  
  const displayBills = bills.slice(0, maxItems);
  
  return (
    <Card
      backgroundColor="white"
      borderRadius="$6"
      marginHorizontal="$4"
      marginBottom="$4"
      padding="$4"
      elevate
      shadowColor="rgba(0,0,0,0.08)"
      shadowRadius={8}
    >
      <YStack space="$4">
        <XStack 
          justifyContent="space-between" 
          alignItems="center"
        >
          <XStack space="$2" alignItems="center">
            <ReceiptText size={24} color="#6366F1" />
            <Text 
              fontSize="$4" 
              fontWeight="$8" 
              color="$gray12"
            >
              {t("Recent Bills")}
            </Text>
          </XStack>
          
          {bills.length > 0 && (
            <Button
              size="$2"
              color="$blue9"
              onPress={() => router.push("/bills")}
              paddingLeft="$2"
              paddingRight="$1"
              space="$1"
              borderWidth={1}
              borderColor="$blue6"
              backgroundColor="$blue2"
            >
              <Text fontSize="$2.5" color="$blue9">{t("View All")}</Text>
              <ChevronRight size={12} />
            </Button>
          )}
        </XStack>

        <AnimatePresence>
          {isLoading ? (
            <YStack padding="$6" alignItems="center" justifyContent="center" space="$2">
              <Spinner size="large" color="$blue9" />
              <Text color="$gray9">{t("Loading...")}</Text>
            </YStack>
          ) : displayBills.length > 0 ? (
            <YStack space="$2">
              {displayBills.map((bill, index) => (
                <React.Fragment key={bill.id}>
                  <BillListItem item={bill} />
                  {index < displayBills.length - 1 && (
                    <Separator marginVertical="$1" />
                  )}
                </React.Fragment>
              ))}
            </YStack>
          ) : (
            <YStack padding="$6" alignItems="center" justifyContent="center">
              <Text color="$gray9" fontSize="$3" textAlign="center">{t("No recent bills")}</Text>
              <Button
                marginTop="$3"
                onPress={() => router.push("/bills/add")}
                backgroundColor="$blue2"
                color="$blue9"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$blue6"
              >
                <Text color="$blue9" fontWeight="$6">{t("Add Your First Bill")}</Text>
              </Button>
            </YStack>
          )}
        </AnimatePresence>
      </YStack>
    </Card>
  );
};

export default RecentBillsList; 