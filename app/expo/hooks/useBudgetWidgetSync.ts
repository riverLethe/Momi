import { useEffect } from "react";
import { DatePeriodEnum, ReportData } from "@/types/reports.types";
import { syncBudgetWidgets } from "@/utils/budgetWidgetSync.utils";

/**
 * Synchronises the iOS Budget widgets (week/month/year) with latest data.
 */
export function useBudgetWidgetSync(
  reportData: ReportData | null,
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family"
) {
  useEffect(() => {
    syncBudgetWidgets({
      viewMode,
      currentReportData: reportData,
      currentPeriodType: periodType,
    }).catch((err) => console.warn("Failed to sync budget widgets:", err));
  }, [reportData, periodType, viewMode]);
}
