import { DatePeriodEnum, ReportData } from "@/types/reports.types";
import { fetchReportData } from "./reports.utils";
import { updateBudgetWidgetForPeriod, BudgetSegment } from "./widgetData.utils";
import { formatCurrency } from "./format";
import i18n from "@/i18n";

/**
 * Fetches report data for week / month / year and updates the Budget widgets.
 * Optionally reuses already-fetched report data for the current period.
 */
export async function syncBudgetWidgets(
  options: {
    viewMode?: "personal" | "family";
    currentReportData?: ReportData | null;
    currentPeriodType?: DatePeriodEnum;
    isDarkMode?: boolean;
  } = {}
): Promise<void> {
  const {
    viewMode = "personal",
    currentReportData,
    currentPeriodType,
    isDarkMode = false,
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
    if (key === "week") return i18n.t("Week Health Score");
    if (key === "month") return i18n.t("Month Health Score");
    return i18n.t("Year Health Score"); // Same label, but kept for future localisation
  };

  // Since iOS widgets typically display on light backgrounds (even in dark mode),
  // we'll use appropriate text color based on system theme
  const textColor = isDarkMode ? "#FFFFFF" : "#000000";

  await Promise.all(
    mappings.map(async ({ key, type }) => {
      let report: ReportData;
      if (currentPeriodType === type && currentReportData) {
        report = currentReportData;
      } else {
        report = await fetchReportData(type, viewMode);
      }

      const budget = report.budget;
      if (!budget || budget.amount == null) {
        // No budget configured; skip this widget update
        return;
      }

      const total = budget.amount;
      const spent = budget.spent;
      const remaining = Math.max(0, total - spent);
      // Align segment colours with those used in BudgetHealthCard
      // Spent: uses default text colour (black) in card
      const spentItem = {
        name: i18n.t("Spent"),
        amountText: formatCurrency(spent),
        percent: total ? spent / total : 0,
        color: "#EF4444", // red-500
      };

      // Remaining: green when positive, red when negative/zero – same logic as card
      const remainingColour =
        remaining > 0 ? "#22C55E" /* green9 */ : "#EF4444"; /* red9 */
      const remainingItem = {
        name: i18n.t("Remaining"),
        amountText: formatCurrency(remaining),
        percent: total ? remaining / total : 0,
        color: remainingColour,
      };

      const segments: BudgetSegment[] = [
        spentItem,
        remainingItem,
        {
          name: i18n.t("Total Budget"),
          amountText: formatCurrency(total),
          percent: 0,
          color: textColor, // Using color based on iOS system theme
        },
        spentItem,
        remainingItem,
        {
          name: i18n.t("Used Percentage"),
          amountText: `${(budget.percentage ?? 0).toFixed(2)}%`,
          percent: 0,
          color: "#EF4444",
        },
        {
          name: i18n.t("Volatility"),
          amountText: `${report.healthScore?.metrics?.volatilityPct ?? 0}%`,
          percent: 0,
          color: (() => {
            const value = report.healthScore?.metrics?.volatilityPct ?? 0;
            const severity =
              value >= 60 ? "danger" : value >= 40 ? "warning" : "good";
            return severity === "danger"
              ? "#EF4444"
              : severity === "warning"
                ? "#F97316"
                : "#22C55E";
          })(),
        },
        {
          name: i18n.t("Recurring cover"),
          amountText: `${report.healthScore?.metrics?.recurringCoverDays ?? 0}d`,
          percent: 0,
          color: (() => {
            const value = report.healthScore?.metrics?.recurringCoverDays ?? 0;
            const severity =
              value < 7 ? "danger" : value < 14 ? "warning" : "good";
            return severity === "danger"
              ? "#EF4444"
              : severity === "warning"
                ? "#F97316"
                : "#22C55E";
          })(),
        },
      ];

      const totalText = formatCurrency(total);
      const label = buildLabelForKey(key);

      await updateBudgetWidgetForPeriod(key, totalText, label, segments);
    })
  );
}
