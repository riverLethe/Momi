import React from "react";
import { useBudgetStore } from "@/stores/budgetStore";

/**
 * React Hook to provide budgets state and helpers.
 * Keeps local state in sync with persistent storage.
 */
export const useBudgets = () => {
  const store = useBudgetStore();

  // On first use, ensure budgets are loaded
  React.useEffect(() => {
    if (store.loading) {
      store.loadBudgets();
    }
  }, []);

  return store;
}; 