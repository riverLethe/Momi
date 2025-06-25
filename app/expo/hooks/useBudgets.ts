import React from "react";
import { useBudgetStore } from "@/stores/budgetStore";
import type { BudgetPeriod, BudgetDetail } from "@/utils/budget.utils";
import { useData } from "@/providers/DataProvider";

/**
 * React Hook to provide budgets state and helpers.
 * Keeps local state in sync with persistent storage.
 */
export const useBudgets = () => {
  const store = useBudgetStore();
  const { bumpBudgetVersion } = useData();

  // On first use, ensure budgets are loaded
  React.useEffect(() => {
    if (store.loading) {
      store.loadBudgets();
    }
  }, []);

  // Wrap the original saveBudgetForPeriod so that after persisting the budget
  // we also notify the rest of the app that data has changed.
  const wrappedSaveBudgetForPeriod = React.useCallback(
    async (period: BudgetPeriod, detail: Partial<BudgetDetail>) => {
      await store.saveBudgetForPeriod(period, detail);
      // Widget sync will be triggered once after all budgets are saved.

      // Notify the rest of the app (e.g. useReportData hooks) that budgets
      // have changed so they can invalidate caches and recompute metrics.
      bumpBudgetVersion();
    },
    [store.saveBudgetForPeriod, bumpBudgetVersion]
  );

  // Return the store with the wrapped function to callers. We memoise to avoid
  // re-renders except when dependencies change.
  return React.useMemo(
    () => ({
      ...store,
      saveBudgetForPeriod: wrappedSaveBudgetForPeriod,
    }),
    [store, wrappedSaveBudgetForPeriod]
  );
};
