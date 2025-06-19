import { useEffect } from "react";
import { DatePeriodEnum, ReportData } from "@/types/reports.types";
import { syncSpendingWidgets } from "@/utils/spendingWidgetSync.utils";

/**
 * Syncs the iOS Total Spending widgets (week/month/year) with the latest numbers.
 * Centralised here so multiple screens可以重用, keeping UI components clean.
 */
export function useSpendingWidgetSync(
  reportData: ReportData | null,
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family"
) {
  useEffect(() => {
    syncSpendingWidgets({
      viewMode,
      currentReportData: reportData,
      currentPeriodType: periodType,
    }).catch((err) => console.warn("Failed to sync spending widgets:", err));
  }, [reportData, periodType, viewMode]);
}
