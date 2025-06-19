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
}

export const useBudgetStatus = ({
  bills,
  transactions,
  periodType,
  budgets,
  includedCategories,
  excludedCategories,
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
    const today = new Date();

    // Filter helpers -------------------------------------------------------
    const isCategorySkipped = (category: string) =>
      (includedCategories.length > 0 &&
        !includedCategories.includes(category)) ||
      (includedCategories.length === 0 &&
        excludedCategories.includes(category));

    // Transactions ---------------------------------------------------------
    const filteredTransactions = transactions.filter((tx) => {
      if (isCategorySkipped(tx.category)) return false;

      const txDate = new Date(tx.date);
      if (budgetPeriod === "weekly") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return txDate >= startOfWeek && tx.type === "expense";
      }
      if (budgetPeriod === "monthly") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return txDate >= startOfMonth && tx.type === "expense";
      }
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return txDate >= startOfYear && tx.type === "expense";
    });

    // Bills ----------------------------------------------------------------
    const filteredBills = bills.filter((bill) => {
      if (isCategorySkipped(bill.category)) return false;

      const billDate = new Date(bill.date);
      if (budgetPeriod === "weekly") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return billDate >= startOfWeek;
      }
      if (budgetPeriod === "monthly") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return billDate >= startOfMonth;
      }
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return billDate >= startOfYear;
    });

    // Totals ---------------------------------------------------------------
    const transactionsSpent = filteredTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    const billsSpent = filteredBills.reduce(
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
    const categoryMap = new Map<string, number>();
    filteredTransactions.forEach((tx) => {
      categoryMap.set(
        tx.category,
        (categoryMap.get(tx.category) || 0) + tx.amount
      );
    });
    filteredBills.forEach((bill) => {
      categoryMap.set(
        bill.category,
        (categoryMap.get(bill.category) || 0) + bill.amount
      );
    });

    const categorySpending: CategorySpending[] = Array.from(
      categoryMap.entries()
    )
      .map(([id, amount]) => {
        const categoryInfo = getCategoryById(id);
        const categoryPercentage =
          total > 0 ? Math.round((amount / total) * 100) : 0;

        let status: "normal" | "exceeding" | "save" = "normal";
        if (categoryPercentage >= 25) status = "exceeding";
        else if (categoryPercentage <= 10) status = "save";

        return {
          id,
          label: categoryInfo?.name || id,
          status,
          percentage: categoryPercentage > 25 ? categoryPercentage - 25 : 0,
          amount,
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
  ]);

  return { budgetStatus, categories };
};
