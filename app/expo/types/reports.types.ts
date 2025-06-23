export enum DatePeriodEnum {
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
}

export interface CategoryData {
  label: string;
  value: number;
  color: string;
  yearOverYearChange?: number;
}

export interface TrendData {
  label: string;
  value: number;
  date?: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: "positive" | "negative" | "neutral";
  severity?: "info" | "warn" | "critical";
  recommendedAction?: string;
  theme?:
    | "overspend"
    | "underutilised_budget"
    | "volatility"
    | "momentum"
    | "savings_opportunity"
    | "recurring_risk"
    | "cashflow";
}

export interface HealthCategory {
  name: string;
  score: number;
  color: string;
}

export interface HealthScore {
  score: number;
  status: "Good" | "Fair" | "Poor";
  categories: HealthCategory[];
  metrics?: {
    budgetUsagePct: number;
    volatilityPct: number;
    savingsRatePct: number;
    recurringCoverDays: number;
  };
  volatility?: {
    volatilityPct: number;
    isHealthy: boolean;
    details: {
      score: number;
      analysis: string;
      tips: string[];
    };
  };
}

export interface PeriodSelectorData {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface TopSpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  changePercentage?: number;
}

export interface ReportData {
  categoryData: CategoryData[];
  trendData: TrendData[];
  averageSpending: number;
  insights: Insight[];
  healthScore: HealthScore;
  periodSelectors: PeriodSelectorData[];
  topSpendingCategories?: TopSpendingCategory[];
  viewMode?: "personal" | "family";
  periodType?: DatePeriodEnum;
  budget?: {
    amount: number | null;
    spent: number;
    remaining: number;
    percentage: number;
    status: "good" | "warning" | "danger" | "none";
  };
}

// --- ABI (Advanced Budget Insights) specific types ---

export interface AbiInsight {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warn" | "critical";
  recommendedAction?: string;
}

export interface AbiHealthMetrics {
  budgetUsagePct: number; // weight 40%
  volatilityPct: number; // 30%
  savingsRatePct: number; // 20%
  recurringCoverDays: number; // 10%
}

export interface AbiHealthScore {
  score: number; // 0-100
  status: "Good" | "Warning" | "Danger";
  metrics: AbiHealthMetrics;
}

export interface AbiReport {
  generatedAt: string; // ISO-8601
  healthScore: AbiHealthScore;
  insights: AbiInsight[];
}

// --- v2 Health Score ---
export interface HealthScoreSubBudget {
  pct: number; // usage percentage or pct volatility etc.
  deduction: number; // points deducted (0-100 scale contribution)
}
export interface HealthScoreSubRecurring {
  days: number;
  deduction: number;
}
export interface HealthScoreDetail {
  score: number;
  status: "Good" | "Warning" | "Danger";
  subScores: {
    budget: HealthScoreSubBudget;
    volatility: HealthScoreSubBudget;
    savings: HealthScoreSubBudget;
    recurring: HealthScoreSubRecurring;
  };
  tips?: { metric: string; advice: string }[];
}

// temp compatibility until UI migrated
export type LegacyHealthScore = HealthScore;
