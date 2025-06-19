import {
  DatePeriodEnum,
  ReportData,
  CategoryData,
} from "@/types/reports.types";
import { fetchReportData } from "./reports.utils";
import { updateSpendingWidgetForPeriod } from "./widgetData.utils";
import { formatCurrency } from "./format";
import i18n from "@/i18n";

/**
 * Fetches report data for week / month / year and pushes it to the corresponding
 * iOS spending widgets. Can optionally reuse the report data that the caller
 * already has for the current period to avoid redundant network / disk work.
 */
export async function syncSpendingWidgets(
  options: {
    /** Either "personal" (default) or "family" depending on current view */
    viewMode?: "personal" | "family";
    /** Already fetched report data for the currently displayed period */
    currentReportData?: ReportData | null;
    /** Period type of the currentReportData */
    currentPeriodType?: DatePeriodEnum;
  } = {}
): Promise<void> {
  const {
    viewMode = "personal",
    currentReportData,
    currentPeriodType,
  } = options;

  const mappings: Array<{
    key: "week" | "month" | "year";
    type: DatePeriodEnum;
  }> = [
    { key: "week", type: DatePeriodEnum.WEEK },
    { key: "month", type: DatePeriodEnum.MONTH },
    { key: "year", type: DatePeriodEnum.YEAR },
  ];

  const buildLabelForKey = (key: "week" | "month" | "year") => {
    if (key === "week") return i18n.t("This Week Total Expense");
    if (key === "month")
      return i18n.t("{{month}} Month Total Expense", {
        month: new Date().getMonth() + 1,
      });
    return i18n.t("{{year}} Year Total Expense", {
      year: new Date().getFullYear(),
    });
  };

  await Promise.all(
    mappings.map(async ({ key, type }) => {
      let report: ReportData;
      if (currentPeriodType === type && currentReportData) {
        report = currentReportData;
      } else {
        report = await fetchReportData(type, viewMode);
      }

      const catData = report.categoryData || [];
      const spentTotal = catData.reduce<number>(
        (sum: number, c: CategoryData) => sum + c.value,
        0
      );

      const categoriesPayload = catData.map((c) => ({
        name: i18n.t(c.label),
        amountText: formatCurrency(c.value),
        percent: spentTotal ? c.value / spentTotal : 0,
        color: c.color,
      }));

      const totalText = formatCurrency(spentTotal);
      const label = buildLabelForKey(key);

      await updateSpendingWidgetForPeriod(
        key,
        totalText,
        label,
        categoriesPayload
      );
    })
  );
}
