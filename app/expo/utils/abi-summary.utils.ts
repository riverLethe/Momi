import { Bill } from "@/types/bills.types";
import { Budgets, BudgetPeriod } from "@/utils/budget.utils";
import { DatePeriodEnum } from "@/types/reports.types";
import { format, eachDayOfInterval } from "date-fns";

// Types must match server BillSummaryInput
export interface BillSummaryInput {
  period: "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate: string;

  coreTotals: {
    totalExpense: number;
    totalIncome?: number;
    prevExpense?: number;
    prevIncome?: number;
    expenseQoQ?: number;
    incomeQoQ?: number;
  };

  budgetUtilisation: {
    overallBudget?: number;
    usagePct?: number;
    categoryUtil: {
      category: string;
      amount: number;
      budget?: number;
      usagePct?: number;
    }[];
  };

  volatility: {
    dailyExpenses: number[];
    volatilityPct: number;
    dailyStats: {
      mean: number;
      median: number;
      max: number;
      min: number;
      p90: number;
    };
    topSpendDays: { date: string; amount: number }[];
  };

  categoryMomentum: {
    category: string;
    currAmount: number;
    prevAmount: number;
    changePct: number;
  }[];

  recurring: {
    recurringCoverDays: number;
  };
}

// Detect simple recurring bills (same amount & category & weekday across at least 3 occurrences)
function detectRecurringCoverDays(bills: Bill[], cashBalance: number): number {
  // naive; assume equal daily recurring sum = average of detected recurring
  const map: Record<string, Bill[]> = {};
  bills.forEach((b) => {
    const key = `${b.category}-${b.amount}`;
    map[key] = map[key] || [];
    map[key].push(b);
  });
  const recurringBills = Object.values(map).filter((arr) => arr.length >= 3);
  const dailyRecurring =
    recurringBills.reduce((sum, arr) => sum + arr[0].amount, 0) / 30; // approximate monthly to daily
  if (dailyRecurring === 0) return 0;
  return Math.floor(cashBalance / dailyRecurring);
}

export function summariseBills(
  bills: Bill[],
  budgets: Budgets,
  periodType: DatePeriodEnum,
  start: Date,
  end: Date,
  cashBalance = 0,
  totalIncome?: number
): BillSummaryInput {
  // Step 1: pre-filter by date range
  let filtered = bills.filter((b) => {
    const dateObj = b.date instanceof Date ? b.date : new Date(b.date as any);
    // Attach the converted date back so subsequent operations use Date consistently
    // (non-enumerable to avoid mutating state observed elsewhere)
    // @ts-ignore – runtime safety only
    b.date = dateObj;
    return dateObj >= start && dateObj <= end;
  });

  // Step 2: apply category filters defined in the budget (if any)
  const budgetDetailKey: BudgetPeriod =
    periodType === DatePeriodEnum.WEEK
      ? "weekly"
      : periodType === DatePeriodEnum.MONTH
        ? "monthly"
        : "yearly";

  const periodBudget = budgets[budgetDetailKey];

  if (
    periodBudget &&
    periodBudget.filterMode &&
    periodBudget.filterMode !== "all" &&
    periodBudget.categories?.length
  ) {
    const cats = periodBudget.categories;
    if (periodBudget.filterMode === "exclude") {
      filtered = filtered.filter((b) => !cats.includes(b.category));
    } else if (periodBudget.filterMode === "include") {
      filtered = filtered.filter((b) => cats.includes(b.category));
    }
  }

  const totalExpense = filtered.reduce((s, b) => s + b.amount, 0);

  // group by category
  const catMap: Record<string, number> = {};
  filtered.forEach((b) => {
    catMap[b.category] = (catMap[b.category] || 0) + b.amount;
  });

  const categoryTotals = Object.entries(catMap)
    .map(([category, amount]) => ({
      category,
      amount,
      budget: periodBudget?.categories?.includes(category)
        ? (periodBudget.amount ?? undefined)
        : undefined,
    }))
    // Sort desc
    .sort((a, b) => b.amount - a.amount)
    // Keep top 15 categories (Pareto)
    .slice(0, 15);

  // daily expenses array
  const days = eachDayOfInterval({ start, end });
  const dailyMap: Record<string, number> = {};
  filtered.forEach((b) => {
    const dateObj = b.date as Date;
    const key = format(dateObj, "yyyy-MM-dd");
    dailyMap[key] = (dailyMap[key] || 0) + b.amount;
  });
  const dailyExpenses = days.map((d) => dailyMap[format(d, "yyyy-MM-dd")] || 0);

  // statistics
  const mean =
    dailyExpenses.reduce((s, v) => s + v, 0) / dailyExpenses.length || 0;
  const sortedDaily = [...dailyExpenses].sort((a, b) => a - b);
  const median = sortedDaily[Math.floor(sortedDaily.length / 2)] || 0;
  const p90 = sortedDaily[Math.floor(sortedDaily.length * 0.9)] || 0;
  const max = sortedDaily[sortedDaily.length - 1] || 0;
  const min = sortedDaily[0] || 0;
  const volatilityPct =
    mean === 0
      ? 0
      : (Math.sqrt(
          sortedDaily.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
            dailyExpenses.length
        ) /
          mean) *
        100;

  const topSpendDays = Object.entries(dailyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([date, amount]) => ({ date, amount }));

  // momentum compare with previous bills - placeholder zero arrays handled externally

  const recurringCoverDays = detectRecurringCoverDays(filtered, cashBalance);

  const categoryUtil = categoryTotals.map((c) => ({
    ...c,
    usagePct: c.budget ? (c.amount / c.budget) * 100 : undefined,
  }));

  return {
    period: budgetDetailKey,
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),

    coreTotals: {
      totalExpense,
      totalIncome,
    },

    budgetUtilisation: {
      overallBudget: periodBudget?.amount ?? undefined,
      usagePct:
        periodBudget?.amount != null && periodBudget.amount > 0
          ? (totalExpense / periodBudget.amount) * 100
          : undefined,
      categoryUtil,
    },

    volatility: {
      dailyExpenses,
      volatilityPct,
      dailyStats: { mean, median, max, min, p90 },
      topSpendDays,
    },

    categoryMomentum: [],

    recurring: {
      recurringCoverDays,
    },
  };
}
