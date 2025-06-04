export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  period: "monthly" | "weekly" | "yearly";
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetProgress {
  budgetId: string;
  category: string;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  isOverBudget: boolean;
}
