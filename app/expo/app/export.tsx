import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Download } from "lucide-react-native";
import { Button, H2, Text, XStack, YStack, Card } from "tamagui";
import { exportBillsAsCsv } from "@/utils/export.utils";
import { getBills } from "@/utils/bills.utils";
import { Alert } from "react-native";
import { DateRangeSheet } from "@/components/ui/DateRangeSheet";
import { addMonths, isAfter } from "date-fns";
import { useTranslation } from "react-i18next";

export default function ExportDataScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [rangeSheetOpen, setRangeSheetOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [hasBillsInRange, setHasBillsInRange] = useState<boolean>(false);
  const [loadingBills, setLoadingBills] = useState<boolean>(true);

  const today = new Date();

  const onApplyRange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const refreshBillsStatus = async (s: Date | null, e: Date | null) => {
    setLoadingBills(true);
    const bills = await getBills();
    if (!bills.length) {
      setHasBillsInRange(false);
      setLoadingBills(false);
      return;
    }
    const filtered = bills.filter((b) => {
      const d = new Date(b.date);
      if (s && d < s) return false;
      if (e && d > e) return false;
      return true;
    });
    setHasBillsInRange(filtered.length > 0);
    setLoadingBills(false);
  };

  useEffect(() => {
    refreshBillsStatus(startDate, endDate);
  }, [startDate, endDate]);

  // initial fetch
  useEffect(() => {
    refreshBillsStatus(null, null);
  }, []);

  const handleExport = async () => {
    try {
      // Validate range & bills existence
      if (!startDate || !endDate) {
        Alert.alert(t("Select Range"), t("Please select a start and end date first."));
        return;
      }

      if (!hasBillsInRange) {
        Alert.alert(t("No Bills"), t("No bills available for export."));
        return;
      }

      if (isAfter(endDate, today)) {
        Alert.alert(t("Invalid Range"), t("End date cannot be later than today."));
        return;
      }

      const maxEnd = addMonths(startDate, 3);
      if (isAfter(endDate, maxEnd)) {
        Alert.alert(t("Too Large Range"), t("You can only export up to 3 months of bills at once."));
        return;
      }

      const uri = await exportBillsAsCsv(startDate, endDate);
      if (uri) {
        console.log(`Exported to ${uri}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t("Export failed"), t("Failed to export data. Please try again."));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <YStack flex={1} padding="$4">
        <XStack alignItems="center" marginBottom="$4">
          <Button
            size="$3"
            circular
            icon={<ArrowLeft size={24} color="#000" />}
            onPress={() => router.back()}
          />
          <H2 marginLeft="$2">{t("Export Data")}</H2>
        </XStack>

        <YStack space="$4" marginTop="$4">
          {/* Date Range Picker */}
          <Card padding="$4" elevate>
            <Text fontSize="$5" fontWeight="$6" marginBottom="$2">
              {t("Date Range")}
            </Text>
            {startDate && endDate ? (
              <Text marginBottom="$3">
                {startDate.toDateString()} - {endDate.toDateString()}
              </Text>
            ) : (
              <Text marginBottom="$3" color="$gray10">
                {t("No range selected")}
              </Text>
            )}
            <Button onPress={() => setRangeSheetOpen(true)} theme="blue">
              {t("Select Range")}
            </Button>
          </Card>

          <Card padding="$4" elevate>
            <Text fontSize="$5" fontWeight="$6" marginBottom="$2">
              {t("Export Options")}
            </Text>
            <Text color="$gray10" marginBottom="$4">
              {t("Choose a format to export your financial data")}
            </Text>

            {loadingBills ? (
              <Text color="$gray10">{t("Checking bills...")}</Text>
            ) : !hasBillsInRange ? (
              <Text color="$red10">{t("No bills available for export.")}</Text>
            ) : null}

            <YStack space="$3">
              <Button
                icon={<Download size={20} color="#fff" />}
                backgroundColor="$blue9"
                onPress={handleExport}
                disabled={!hasBillsInRange}
              >
                <Text color="white" fontWeight="$6">{t("Export as CSV")}</Text>
              </Button>
            </YStack>
          </Card>
        </YStack>

        {/* Range selection sheet */}
        <DateRangeSheet
          isOpen={rangeSheetOpen}
          setIsOpen={setRangeSheetOpen}
          onApply={onApplyRange}
          initialStartDate={startDate}
          initialEndDate={endDate}
          maxDate={today}
          maxRangeMonths={3}
        />
      </YStack>
    </SafeAreaView>
  );
} 