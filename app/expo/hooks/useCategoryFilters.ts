import { useState, useEffect } from "react";
import { getUserPreferences } from "@/utils/userPreferences.utils";
import type { Budgets, BudgetPeriod } from "@/utils/budget.utils";

export const useCategoryFilters = (
  budgetPeriod: BudgetPeriod,
  budgets: Budgets
) => {
  const [includedCategories, setIncludedCategories] = useState<string[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);

  // Load persisted user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const preferences = await getUserPreferences();
        if (!preferences) return;

        // New per-period filters take precedence
        const periodFilters = preferences.budgetFilters?.[budgetPeriod];
        if (periodFilters) {
          if (periodFilters.mode === "include") {
            setIncludedCategories(periodFilters.categories);
            setExcludedCategories([]);
          } else if (periodFilters.mode === "exclude") {
            setExcludedCategories(periodFilters.categories);
            setIncludedCategories([]);
          }
        } else {
          // Fallback to legacy global fields
          if (preferences.budgetIncludedCategories) {
            setIncludedCategories(preferences.budgetIncludedCategories);
          }
          if (preferences.budgetExcludedCategories) {
            setExcludedCategories(preferences.budgetExcludedCategories);
          }
        }
      } catch (error) {
        console.error("Failed to load user preferences:", error);
      }
    };

    loadPreferences();
  }, []);

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
