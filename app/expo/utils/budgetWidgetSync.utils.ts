import { DatePeriodEnum, BudgetReportData } from "@/types/reports.types";
import { fetchBudgetReportData } from "./reports.utils";
import { updateBudgetWidgetForPeriod, BudgetSegment } from "./widgetData.utils";
import { formatCurrency } from "./format";
import i18n from "@/i18n";
import { generatePeriodSelectors } from "./date.utils";
import { getBills } from "./bills.utils";
import { getBudgets } from "./budget.utils";

/**
 * Fetches report data for week / month / year and updates the Budget widgets.
 * Optionally reuses already-fetched report data for the current period.
 */
export async function syncBudgetWidgets(
  options: {
    viewMode?: "personal" | "family";
    currentBudgetData?: BudgetReportData | null;
    currentPeriodType?: DatePeriodEnum;
    isDarkMode?: boolean;
    budgetVersion?: number;
  } = {}
): Promise<void> {
  const {
    viewMode = "personal",
    currentBudgetData,
    currentPeriodType,
    isDarkMode = false,
    budgetVersion,
  } = options;

  const mappings: Array<{
    key: "week" | "month" | "year";
    type: DatePeriodEnum;
  }> = [
    { key: "week", type: DatePeriodEnum.WEEK },
    { key: "month", type: DatePeriodEnum.MONTH },
    { key: "year", type: DatePeriodEnum.YEAR },
  ];

  // Determine the text colour for widgets based on the current theme.
  const textColor = isDarkMode ? "#FFFFFF" : "#000000";

  /** Translated label map for period keys */
  const _periodLabelMap: Record<"week" | "month" | "year", string> = {
    week: i18n.t("Week Health Score"),
    month: i18n.t("Month Health Score"),
    year: i18n.t("Year Health Score"),
  };
  await Promise.all(
    mappings.map(async ({ key, type }) => {
      let budgetReport: BudgetReportData;
      if (currentPeriodType === type && currentBudgetData) {
        budgetReport = currentBudgetData;
      } else {
        const firstSelectorId = generatePeriodSelectors(type)[0]?.id;

        // 获取数据
        const [bills, budgets] = await Promise.all([getBills(), getBudgets()]);

        // 对于家庭模式，目前只能使用个人数据，因为这里无法访问 DataProvider
        const billsForMode =
          viewMode === "personal"
            ? bills.filter((bill) => !bill.isFamilyBill)
            : bills; // 暂时使用所有账单作为回退

        // 直接获取预算报表
        budgetReport = await fetchBudgetReportData(
          type,
          viewMode,
          billsForMode,
          budgets,
          firstSelectorId,
          budgetVersion
        );
      }

      const budget = budgetReport.budget;
      if (!budget) {
        // No budget configured; skip this widget update
        return;
      }
      const total = budget.amount ?? 0;
      const spent = budget.spent;
      const remaining = budget.remaining;

      const segments = buildBudgetSegments(
        budget,
        total,
        spent,
        remaining,
        textColor,
        budgetReport.healthScore
      );

      const totalText = `${budgetReport.healthScore?.score ?? 0}`;
      const label = _periodLabelMap[key];

      await updateBudgetWidgetIfChanged(key, totalText, label, segments);
    })
  );
}

// ---------------------------------------------------------------------------
// Module-level helpers (initialised once) -----------------------------------

/** Cache of the last payload sent to each widget period (to avoid redundant bridge calls) */
const _lastWidgetPayload: Record<"week" | "month" | "year", string> = {
  week: "",
  month: "",
  year: "",
};

function severityColor(
  value: number,
  {
    danger,
    warning,
    invert = false,
  }: { danger: number; warning: number; invert?: boolean }
): string {
  if (invert) {
    // For metrics where LOWER is worse (e.g., recurring cover days)
    if (value <= danger) return "#EF4444";
    if (value <= warning) return "#F97316";
    return "#22C55E";
  }

  if (value >= danger) return "#EF4444";
  if (value >= warning) return "#F97316";
  return "#22C55E";
}

function buildBudgetSegments(
  budget: BudgetReportData["budget"] | undefined,
  total: number,
  spent: number,
  remaining: number,
  textColor: string,
  healthScore: BudgetReportData["healthScore"] | undefined
): BudgetSegment[] {
  const totalText = formatCurrency(total);
  const spentText = formatCurrency(spent);
  const remainingText = formatCurrency(remaining);

  const spentItem: BudgetSegment = {
    name: i18n.t("Spent"),
    amountText: spentText,
    percent: total ? spent / total : 0,
    color: "#EF4444",
  };

  const remainingItem: BudgetSegment = {
    name: i18n.t("Remaining"),
    amountText: remainingText,
    percent: total ? remaining / total : 0,
    color: remaining > 0 ? "#22C55E" : "#EF4444",
  };

  return [
    spentItem,
    remainingItem,
    {
      name: i18n.t("Total Budget"),
      amountText: totalText,
      percent: 0,
      color: textColor,
    },
    spentItem,
    remainingItem,
    {
      name: i18n.t("Used Percentage"),
      amountText: `${(budget?.percentage ?? 0).toFixed(2)}%`,
      percent: 0,
      color: "#EF4444",
    },
    {
      name: i18n.t("Volatility"),
      amountText: `${healthScore?.metrics?.volatilityPct ?? 0}%`,
      percent: 0,
      color: severityColor(healthScore?.metrics?.volatilityPct ?? 0, {
        danger: 60,
        warning: 40,
      }),
    },
    {
      name: i18n.t("Recurring cover"),
      amountText: `${healthScore?.metrics?.recurringCoverDays ?? 0}d`,
      percent: 0,
      color: severityColor(healthScore?.metrics?.recurringCoverDays ?? 0, {
        danger: 7,
        warning: 14,
        invert: true,
      }),
    },
  ];
}

async function updateBudgetWidgetIfChanged(
  periodKey: "week" | "month" | "year",
  totalText: string,
  label: string,
  segments: BudgetSegment[]
): Promise<void> {
  const payload = JSON.stringify({ totalText, label, segments });
  if (_lastWidgetPayload[periodKey] === payload) return;

  _lastWidgetPayload[periodKey] = payload;
  await updateBudgetWidgetForPeriod(periodKey, totalText, label, segments);
}

// ---------------------------------------------------------------------------
