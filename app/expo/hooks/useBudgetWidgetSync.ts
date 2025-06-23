import { useEffect } from "react";
import { DatePeriodEnum, ReportData } from "@/types/reports.types";
import { syncBudgetWidgets } from "@/utils/budgetWidgetSync.utils";
import { useColorScheme } from "react-native";

/**
 * Synchronises the iOS Budget widgets (week/month/year) with latest data.
 */
export function useBudgetWidgetSync(
  reportData: ReportData | null,
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family"
) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  useEffect(() => {
    syncBudgetWidgets({
      viewMode,
      currentReportData: reportData,
      currentPeriodType: periodType,
      isDarkMode,
    }).catch((err) => console.warn("Failed to sync budget widgets:", err));
  }, [reportData, periodType, viewMode, isDarkMode]);
}
