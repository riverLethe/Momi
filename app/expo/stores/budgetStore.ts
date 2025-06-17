import { create } from "zustand";
import {
  Budgets,
  getBudgets,
  updateBudgets,
  BudgetPeriod,
  BudgetDetail,
} from "@/utils/budget.utils";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/utils/userPreferences.utils";

interface BudgetState {
  budgets: Budgets;
  loading: boolean;
  loadBudgets: () => Promise<void>;
  saveBudgetForPeriod: (
    period: BudgetPeriod,
    detail: Partial<BudgetDetail>
  ) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: {},
  loading: true,

  loadBudgets: async () => {
    set({ loading: true });
    let data = await getBudgets();

    // Migration from legacy numeric shape
    const hasDetailObjects = typeof data.weekly === "object";
    if (!hasDetailObjects) {
      const legacy = data as unknown as {
        weekly?: number | null;
        monthly?: number | null;
        yearly?: number | null;
      };
      data = {
        weekly: { amount: legacy.weekly ?? null, filterMode: "all", categories: [] },
        monthly: { amount: legacy.monthly ?? null, filterMode: "all", categories: [] },
        yearly: { amount: legacy.yearly ?? null, filterMode: "all", categories: [] },
      };
      await updateBudgets(data);
    }

    // Migrate from old single budget in user preferences if still empty
    const allNull = [data.weekly?.amount, data.monthly?.amount, data.yearly?.amount].every((v) => v == null);
    if (allNull) {
      const prefs = await getUserPreferences();
      if (prefs.budgetAmount) {
        const period: BudgetPeriod = (prefs.budgetPeriod as BudgetPeriod) || "monthly";
        data[period] = {
          amount: prefs.budgetAmount,
          filterMode: "all",
          categories: [],
        };
        await updateBudgets({ [period]: data[period] });
        await updateUserPreferences({ budgetAmount: undefined, budgetPeriod: undefined });
      }
    }

    set({ budgets: data, loading: false });
  },

  saveBudgetForPeriod: async (period, detail) => {
    const current = get().budgets[period] || {
      amount: null,
      filterMode: "all",
      categories: [],
    };
    const merged = { ...current, ...detail };
    const next = await updateBudgets({ [period]: merged });
    set({ budgets: next });
  },
})); 