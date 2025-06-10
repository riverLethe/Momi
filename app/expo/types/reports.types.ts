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
}
