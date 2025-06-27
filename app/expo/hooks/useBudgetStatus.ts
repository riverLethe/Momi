import { useEffect, useState } from "react";
import type { Bill } from "@/types/bills.types";
import type { Transaction } from "@/types/transactions.types";
import { Budgets, BudgetPeriod } from "@/utils/budget.utils";
import { getCategoryById } from "@/constants/categories";
import {
  BudgetStatusInfo,
  CategorySpending,
} from "@/components/home/BudgetSummaryCard";
import { DatePeriodEnum } from "@/types/reports.types";

interface Params {
  bills: Bill[];
  transactions: Transaction[];
  periodType: DatePeriodEnum;
  budgets: Budgets;
  includedCategories: string[];
  excludedCategories: string[];
  /** Explicit start date for the period (overrides internal calculation when provided) */
  periodStart?: Date;
  /** Explicit end date for the period (overrides internal calculation when provided) */
  periodEnd?: Date;
}

export const useBudgetStatus = ({
  bills,
  transactions,
  periodType,
  budgets,
  includedCategories,
  excludedCategories,
  periodStart,
  periodEnd,
}: Params) => {
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatusInfo>({
    status: "none",
    remaining: 0,
    spent: 0,
    total: 0,
    percentage: 0,
  });

  const [categories, setCategories] = useState<CategorySpending[]>([]);

  // Derive period key from enum
  const budgetPeriod: BudgetPeriod =
    periodType === DatePeriodEnum.WEEK
      ? "weekly"
      : periodType === DatePeriodEnum.MONTH
        ? "monthly"
        : "yearly";

  useEffect(() => {
    // Determine the effective date range -----------------------------------
    const today = new Date();

    // If explicit periodStart/End provided, use those; otherwise derive based on today
    let startDate: Date;
    let endDate: Date;

    if (periodStart && periodEnd) {
      startDate = new Date(periodStart);
      endDate = new Date(periodEnd);
      // Normalise time to ensure inclusivity
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Fallback to current-period calculation (original behaviour)
      if (budgetPeriod === "weekly") {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (budgetPeriod === "monthly") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      }
    }

    // Calculate previous period range --------------------------------------
    const periodDurationMs = endDate.getTime() - startDate.getTime() + 1; // inclusive duration
    const prevEndDate = new Date(startDate.getTime() - 1);
    prevEndDate.setHours(23, 59, 59, 999);
    const prevStartDate = new Date(
      prevEndDate.getTime() - periodDurationMs + 1
    );
    prevStartDate.setHours(0, 0, 0, 0);

    // Filter helpers -------------------------------------------------------
    const isCategorySkipped = (category: string) =>
      (includedCategories.length > 0 &&
        !includedCategories.includes(category)) ||
      (includedCategories.length === 0 &&
        excludedCategories.includes(category));

    // Helper to filter by period -------------------------------------------
    const filterByPeriod = <T extends { date: string | number | Date }>(
      items: T[],
      s: Date,
      e: Date
    ) =>
      items.filter((it) => {
        const d = new Date(it.date);
        return d >= s && d <= e;
      });

    // Transactions ---------------------------------------------------------
    const filteredCurrentTransactions = filterByPeriod(
      transactions.filter(
        (tx) => !isCategorySkipped(tx.category) && tx.type === "expense"
      ),
      startDate,
      endDate
    );

    const filteredPrevTransactions = filterByPeriod(
      transactions.filter(
        (tx) => !isCategorySkipped(tx.category) && tx.type === "expense"
      ),
      prevStartDate,
      prevEndDate
    );

    // Bills ----------------------------------------------------------------
    const filteredCurrentBills = filterByPeriod(
      bills.filter((bill) => !isCategorySkipped(bill.category)),
      startDate,
      endDate
    );

    const filteredPrevBills = filterByPeriod(
      bills.filter((bill) => !isCategorySkipped(bill.category)),
      prevStartDate,
      prevEndDate
    );

    // Totals ---------------------------------------------------------------
    const transactionsSpent = filteredCurrentTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    const billsSpent = filteredCurrentBills.reduce(
      (sum, bill) => sum + bill.amount,
      0
    );
    const totalSpent = transactionsSpent + billsSpent;

    const periodDetail = budgets[budgetPeriod] || {
      amount: null,
      filterMode: "all" as const,
      categories: [],
    };

    const total = periodDetail.amount || 0;
    const remaining = Math.max(0, total - totalSpent);
    const percentage = total > 0 ? Math.round((totalSpent / total) * 100) : 0;

    let status: "good" | "warning" | "danger" | "none" = "none";
    if (periodDetail.amount == null) status = "none";
    else if (percentage >= 90) status = "danger";
    else if (percentage >= 70) status = "warning";
    else status = "good";

    setBudgetStatus({
      status,
      remaining,
      spent: totalSpent,
      total,
      percentage,
    });

    // Category breakdown ---------------------------------------------------
    const buildCategoryMap = (txs: typeof transactions, bs: typeof bills) => {
      const map = new Map<string, number>();
      txs.forEach((tx) => {
        map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
      });
      bs.forEach((bill) => {
        map.set(bill.category, (map.get(bill.category) || 0) + bill.amount);
      });
      return map;
    };

    const currentCategoryMap = buildCategoryMap(
      filteredCurrentTransactions,
      filteredCurrentBills
    );
    const prevCategoryMap = buildCategoryMap(
      filteredPrevTransactions,
      filteredPrevBills
    );

    const categorySpending: CategorySpending[] = Array.from(
      currentCategoryMap.entries()
    )
      .map(([id, amount]) => {
        const categoryInfo = getCategoryById(id);
        const prevAmount = prevCategoryMap.get(id) || 0;
        const changePerc =
          prevAmount === 0 ? 100 : ((amount - prevAmount) / prevAmount) * 100;

        // Keep old status logic for compatibility --------------------------
        const categoryPercentage =
          total > 0 ? Math.round((amount / total) * 100) : 0;
        let legacyStatus: "normal" | "exceeding" | "save" = "normal";
        if (categoryPercentage >= 25) legacyStatus = "exceeding";
        else if (categoryPercentage <= 10) legacyStatus = "save";

        return {
          id,
          label: categoryInfo?.name || id,
          amount,
          previousAmount: prevAmount,
          changePercentage: Math.round(changePerc),
          budget: undefined,
          status: legacyStatus,
          percentage:
            legacyStatus === "exceeding"
              ? categoryPercentage - 25
              : categoryPercentage,
          color: categoryInfo?.color || "#999",
        } as CategorySpending;
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    setCategories(categorySpending);
  }, [
    bills,
    transactions,
    periodType,
    budgets,
    includedCategories,
    excludedCategories,
    periodStart,
    periodEnd,
  ]);

  return { budgetStatus, categories };
};
