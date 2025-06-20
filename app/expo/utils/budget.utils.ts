import { DatePeriodEnum } from "@/types/reports.types";
import { storage, STORAGE_KEYS } from "./storage.utils";

export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export type FilterMode = "all" | "include" | "exclude";

export interface BudgetDetail {
  amount: number | null;
  filterMode: FilterMode;
  categories: string[];
}

export interface Budgets {
  weekly?: BudgetDetail;
  monthly?: BudgetDetail;
  yearly?: BudgetDetail;
}

const DEFAULT_DETAIL: BudgetDetail = {
  amount: null,
  filterMode: "all",
  categories: [],
};

const DEFAULT_BUDGETS: Budgets = {
  weekly: { ...DEFAULT_DETAIL },
  monthly: { ...DEFAULT_DETAIL },
  yearly: { ...DEFAULT_DETAIL },
};

export const getBudgets = async (): Promise<Budgets> => {
  try {
    const data = await storage.getItem<Budgets>(STORAGE_KEYS.BUDGETS);
    return data || { ...DEFAULT_BUDGETS };
  } catch (error) {
    console.error("Failed to load budgets:", error);
    return { ...DEFAULT_BUDGETS };
  }
};

export const updateBudgets = async (
  partial: Partial<Budgets>
): Promise<Budgets> => {
  try {
    const current = await getBudgets();
    const next = { ...current, ...partial };
    await storage.setItem(STORAGE_KEYS.BUDGETS, next);
    return next;
  } catch (error) {
    console.error("Failed to update budgets:", error);
    throw error;
  }
};

export const resetBudgets = async (): Promise<Budgets> => {
  try {
    await storage.setItem(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
    return { ...DEFAULT_BUDGETS };
  } catch (error) {
    console.error("Failed to reset budgets:", error);
    throw error;
  }
};
export const _BudgetPeriodMap: { [key in DatePeriodEnum]: BudgetPeriod } = {
  [DatePeriodEnum.WEEK]: "weekly",
  [DatePeriodEnum.MONTH]: "monthly",
  [DatePeriodEnum.YEAR]: "yearly",
};
