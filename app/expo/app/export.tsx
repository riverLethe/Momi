import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeftIcon } from "lucide-react-native";
import { Button, H2, Text, XStack, YStack, View, useTheme } from "tamagui";
import { exportBillsAsCsv } from "@/utils/export.utils";
import { getBills } from "@/utils/bills.utils";
import { Alert } from "react-native";
import { addMonths, isAfter, startOfDay, endOfDay } from "date-fns";
import { useTranslation } from "react-i18next";
import DatePickerSheet from "@/components/ui/DatePickerSheet";

export default function ExportDataScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(1))); // First day of current month
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [hasBillsInRange, setHasBillsInRange] = useState<boolean>(false);
  const [loadingBills, setLoadingBills] = useState<boolean>(true);

  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);

  const today = new Date();

  const handleStartDateChange = (newDate: Date) => {
    const newStartDate = startOfDay(newDate);

    // If new start date would cause a range greater than 3 months, adjust the end date
    const maxEndDate = addMonths(newStartDate, 3);
    if (isAfter(endDate, maxEndDate)) {
      setEndDate(maxEndDate);
    }

    setStartDate(newStartDate);
  };

  const handleEndDateChange = (newDate: Date) => {
    // Ensure end date isn't after today
    const adjustedEndDate = isAfter(newDate, today) ? today : newDate;
    const newEndDate = endOfDay(adjustedEndDate);

    // If new end date would cause a range greater than 3 months, adjust the start date
    const minStartDate = addMonths(newEndDate, -3);
    if (startDate < minStartDate) {
      setStartDate(minStartDate);
    }

    setEndDate(newEndDate);
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
      await exportBillsAsCsv(startDate, endDate);
    } catch (err) {
      console.error(err);
      Alert.alert(t("Export failed"), t("Failed to export data. Please try again."));
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.get() }} edges={['top']}>
      <YStack flex={1} padding="$2" gap="$6" backgroundColor="$background">
        <XStack alignItems="center">
          <Button size="$3"
            circular borderRadius="$2"
            chromeless
            onPress={() => router.back()}
            icon={<ChevronLeftIcon size={20} color={theme.color?.get()} />}
            pressStyle={{
              backgroundColor: "transparent",
              opacity: 0.5,
              borderColor: "transparent",
            }}
          />
        </XStack>
        <YStack flex={1} paddingHorizontal="$4" paddingTop="$4">

          <YStack alignItems="center" gap="$2" marginTop="$4">
            <H2 color="$color">{t("Export Data")}</H2>
            <Text color="$color10" textAlign="center">
              {t("Select a date range to export your financial data")}
            </Text>
          </YStack>

          <YStack gap="$5" marginTop="$6">
            {/* Date Range Selection */}
            <YStack gap="$4">

              <YStack gap="$3">
                <Text>{t("Start Date")}</Text>
                <Button
                  onPress={() => setStartDatePickerOpen(true)}
                  theme={"gray" as any}
                  borderRadius="$4"
                  height={48}
                  justifyContent="flex-start"
                  paddingLeft="$3"
                  borderColor="$color10"
                >
                  {startDate.toLocaleDateString()}
                </Button>

                <Text marginTop="$2">{t("End Date")}</Text>
                <Button
                  onPress={() => setEndDatePickerOpen(true)}
                  theme={"gray" as any}
                  borderRadius="$4"
                  height={48}
                  justifyContent="flex-start"
                  paddingLeft="$3"
                  borderColor="$color10"
                >
                  {endDate.toLocaleDateString()}
                </Button>

                {loadingBills ? (
                  <Text color="$gray10">{t("Checking bills...")}</Text>
                ) : !hasBillsInRange ? (
                  <Text color="$red10">{t("No bills available for selected date range.")}</Text>
                ) : (
                  <></>
                )}
              </YStack>
            </YStack>

            {/* Export Button */}
            <Button
              backgroundColor="$blue9"
              color="white"
              onPress={handleExport}
              disabled={!hasBillsInRange}
              marginTop="$4"
              size="$4"
            >
              <Text color="white" fontWeight="$6">{t("Export as CSV")}</Text>
            </Button>
          </YStack>
        </YStack>
      </YStack>

      {/* Date Picker Sheets */}
      <DatePickerSheet
        open={startDatePickerOpen}
        onOpenChange={setStartDatePickerOpen}
        initialDate={startDate}
        onConfirm={handleStartDateChange}
        title={t("Select Start Date")}
        maximumDate={today}
      />

      <DatePickerSheet
        open={endDatePickerOpen}
        onOpenChange={setEndDatePickerOpen}
        initialDate={endDate}
        onConfirm={handleEndDateChange}
        title={t("Select End Date")}
        minimumDate={startDate}
        maximumDate={today}
      />
    </SafeAreaView>
  );
} 