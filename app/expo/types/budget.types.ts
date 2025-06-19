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
export const getSeverityColor = (severity: "good" | "warning" | "danger") => {
  switch (severity) {
    case "danger":
      return "#EF4444"; // red9
    case "warning":
      return "#F97316"; // orange9
    default:
      return "#22C55E"; // green9
  }
};
