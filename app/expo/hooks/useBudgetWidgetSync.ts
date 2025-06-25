import { useEffect } from "react";
import { DatePeriodEnum, BudgetReportData } from "@/types/reports.types";
import { syncBudgetWidgets } from "@/utils/budgetWidgetSync.utils";
import { useColorScheme } from "react-native";

/**
 * Synchronises the iOS Budget widgets (week/month/year) with latest data.
 */
export const useBudgetWidgetSync = (
  budgetData: BudgetReportData | null,
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family",
  disabled: boolean = false
) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  useEffect(() => {
    if (!budgetData || disabled) return;

    syncBudgetWidgets({
      viewMode,
      currentBudgetData: budgetData,
      currentPeriodType: periodType,
      isDarkMode,
      budgetVersion: Date.now(),
    }).catch(() => {});
  }, [budgetData, periodType, viewMode, isDarkMode, disabled]);
};
