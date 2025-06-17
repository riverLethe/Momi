import { useMemo } from "react";
import { Budgets } from "@/utils/budget.utils";
import { Bill } from "@/types/bills.types";
import { Transaction } from "@/types/transactions.types";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export interface BudgetStatsResult {
  budget: number | null;
  spent: number;
  remaining: number;
  percentage: number;
  status: "good" | "warning" | "danger" | "none";
}

/**
 * Compute budget statistics for the given period using bills and transactions list.
 * This hook is *pure UI*: it does not fetch nor mutate data.
 */
export const useBudgetStats = (
  period: BudgetPeriod,
  budgets: Budgets,
  bills: Bill[],
  transactions: Transaction[],
  /**
   * If provided, these category arrays will be used to include/exclude categories
   * when calculating the expenses.
   */
  options?: {
    includedCategories?: string[];
    excludedCategories?: string[];
  }
): BudgetStatsResult => {
  const { includedCategories = [], excludedCategories = [] } = options || {};

  // Memoised calculation
  return useMemo(() => {
    const budget = budgets[period]?.amount ?? null;

    // Determine date range for the given period
    const today = new Date();
    let start: Date;
    let end: Date;
    if (period === "weekly") {
      start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      end = endOfWeek(today, { weekStartsOn: 1 });
    } else if (period === "monthly") {
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else {
      start = startOfYear(today);
      end = endOfYear(today);
    }

    const filterFn = (item: Bill | Transaction) => {
      const d = new Date(item.date);
      if (d < start || d > end) return false;

      // Only expenses (transactions may have income)
      if ((item as Transaction).type && (item as Transaction).type !== "expense") {
        return false;
      }

      // Category filter
      const skip = (includedCategories.length > 0 && !includedCategories.includes(item.category)) ||
        (includedCategories.length === 0 && excludedCategories.includes(item.category));

      return !skip;
    };

    const combined: (Bill | Transaction)[] = [...bills, ...transactions].filter(filterFn);

    const spent = combined.reduce((s, i) => s + i.amount, 0);
    const remaining = budget ? Math.max(budget - spent, 0) : 0;
    const percentage = budget ? Math.min((spent / budget) * 100, 100) : 0;

    let status: "good" | "warning" | "danger" | "none" = "none";
    if (budget === null) {
      status = "none";
    } else if (percentage >= 90) {
      status = "danger";
    } else if (percentage >= 70) {
      status = "warning";
    } else {
      status = "good";
    }

    return {
      budget,
      spent,
      remaining,
      percentage,
      status,
    };
  }, [period, budgets, bills, transactions, includedCategories, excludedCategories]);
}; 