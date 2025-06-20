import { useState, useEffect } from "react";
import {
  type Budgets,
  type BudgetPeriod,
  _BudgetPeriodMap,
} from "@/utils/budget.utils";
import { DatePeriodEnum } from "@/types/reports.types";

export const useCategoryFilters = (
  periodType: DatePeriodEnum,
  budgets: Budgets
) => {
  const [includedCategories, setIncludedCategories] = useState<string[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);

  // Legacy user-preference loading removed – category filters are now derived
  // purely from the budgets kept in persistent storage. This simplifies the
  // data-flow and avoids duplicating the same information in two places.

  // Map the `periodType` enum to the legacy BudgetPeriod key used in storage
  const budgetPeriod: BudgetPeriod = _BudgetPeriodMap[periodType];

  // Apply filters when budgets or period key changes
  useEffect(() => {
    const detail = budgets[budgetPeriod];
    if (!detail) return;

    if (detail.filterMode === "include") {
      setIncludedCategories(detail.categories);
      setExcludedCategories([]);
    } else if (detail.filterMode === "exclude") {
      setExcludedCategories(detail.categories);
      setIncludedCategories([]);
    } else {
      setIncludedCategories([]);
      setExcludedCategories([]);
    }
  }, [budgetPeriod, budgets]);

  return {
    includedCategories,
    excludedCategories,
    setIncludedCategories,
    setExcludedCategories,
  };
};
