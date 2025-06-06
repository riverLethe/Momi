import { 
  CategoryData, 
  DatePeriodEnum, 
  HealthScore, 
  Insight, 
  ReportData, 
  TopSpendingCategory, 
  TrendData 
} from "@/types/reports.types";
import { generatePeriodSelectors, getTrendLabels } from "./date.utils";

// Mock colors for categories
const CATEGORY_COLORS = {
  "Food": "#3B82F6",
  "Transport": "#10B981",
  "Shopping": "#EC4899",
  "Entertainment": "#F59E0B",
  "Utilities": "#8B5CF6",
  "Health": "#06B6D4",
  "Education": "#6366F1",
  "Gifts": "#F43F5E",
  "Communication": "#14B8A6",
  "Housing": "#6D28D9",
  "Other": "#94A3B8"
};

// Generate mock category data
export const generateMockCategoryData = (
  multiplier: number = 1,
  periodType: DatePeriodEnum = DatePeriodEnum.WEEK,
  categories: string[] = [
    "Food", "Transport", "Shopping", "Entertainment", 
    "Utilities", "Health", "Education", "Gifts"
  ]
): CategoryData[] => {
  // 添加基于时间周期的乘数，确保不同时间周期的数据量级合理
  let periodMultiplier = 1;
  switch (periodType) {
    case DatePeriodEnum.WEEK:
      periodMultiplier = 1;
      break;
    case DatePeriodEnum.MONTH:
      periodMultiplier = 4; // 月度数据约为周数据的4倍
      break;
    case DatePeriodEnum.YEAR:
      periodMultiplier = 12; // 年度数据约为月度数据的12倍
      break;
  }
  
  return categories.map(category => ({
    label: category,
    value: Math.round((Math.random() * 1000 + 500) * multiplier * periodMultiplier),
    color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#94A3B8",
    yearOverYearChange: Math.round((Math.random() * 40 - 20)) // 生成-20%到+20%之间的同比变化
  }));
};

// Generate mock trend data based on period type
export const generateMockTrendData = (
  periodType: DatePeriodEnum,
  multiplier: number = 1
): TrendData[] => {
  const labels = getTrendLabels(periodType);
  
  // 添加基于时间周期的乘数，确保不同时间周期的数据量级合理
  let periodMultiplier = 1;
  switch (periodType) {
    case DatePeriodEnum.WEEK:
      periodMultiplier = 1;
      break;
    case DatePeriodEnum.MONTH:
      periodMultiplier = 4; // 月度数据约为周数据的4倍
      break;
    case DatePeriodEnum.YEAR:
      periodMultiplier = 12; // 年度数据约为月度数据的12倍
      break;
  }
  
  return labels.map(label => ({
    label,
    value: Math.round((Math.random() * 1000 + 500) * multiplier * periodMultiplier)
  }));
};

// Generate mock financial insights
export const generateMockInsights = (
  viewMode: "personal" | "family",
  categoryData: CategoryData[]
): Insight[] => {
  // Find highest category
  const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value);
  const highestCategory = sortedCategories[0];
  
  return [
    {
      id: "1",
      title: "Spending Pattern",
      description: viewMode === "personal" 
        ? "Your spending is higher on weekends" 
        : "Family spending is higher on weekends",
      type: "neutral"
    },
    {
      id: "2",
      title: "Savings Potential",
      description: `You could save ¥${Math.round(highestCategory.value * 0.15)} on ${highestCategory.label} by cooking more at home`,
      type: "positive"
    },
    {
      id: "3",
      title: "Budget Alert",
      description: "Shopping expenses exceed budget",
      type: "negative"
    }
  ];
};

// Generate mock health score
export const generateMockHealthScore = (viewMode: "personal" | "family"): HealthScore => {
  return {
    score: viewMode === "personal" ? 78 : 72,
    status: viewMode === "personal" ? "Good" : "Fair",
    categories: [
      {
        name: "Spending Discipline",
        score: viewMode === "personal" ? 80 : 60,
        color: "#3B82F6"
      },
      {
        name: "Budget Adherence",
        score: viewMode === "personal" ? 90 : 50,
        color: viewMode === "personal" ? "#10B981" : "#F59E0B"
      },
      {
        name: "Savings Rate",
        score: viewMode === "personal" ? 75 : 65,
        color: "#3B82F6"
      }
    ]
  };
};

// Generate top spending categories for YoY comparison
export const generateMockTopSpendingCategories = (
  categoryData: CategoryData[]
): TopSpendingCategory[] => {
  const totalValue = categoryData.reduce((sum, item) => sum + item.value, 0);
  const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value).slice(0, 3);
  
  return sortedCategories.map(category => {
    // 生成合理的前期金额，以确保同比变化在-30%到+50%之间
    // 对于高值类别，前期值更可能低于当前值(增长)
    // 对于低值类别，前期值可能高于当前值(降低)
    const growthBias = category.value > 1000 ? 0.8 : 1.1; // 高值类别偏向增长，低值类别偏向下降
    const previousAmount = Math.round(category.value / (1 + (Math.random() * 0.5 - 0.2) * growthBias));
    const changePercentage = Math.round(((category.value - previousAmount) / previousAmount) * 100);
      
    return {
      category: category.label,
      amount: category.value,
      percentage: (category.value / totalValue) * 100,
      color: category.color,
      previousAmount,
      changePercentage
    };
  });
};

// Main function to fetch or generate report data
export const fetchReportData = async (
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family",
  periodId?: string
): Promise<ReportData> => {
  // In a real app, this would call an API with the periodId
  // For now, we'll generate mock data
  
  const familyMultiplier = viewMode === "family" ? 1.8 : 1;
  const categoryData = generateMockCategoryData(familyMultiplier, periodType);
  
  // Generate trend data based on period type
  const trendData = generateMockTrendData(periodType, familyMultiplier);
  
  // Calculate average
  const averageSpending = trendData.reduce((sum, item) => sum + item.value, 0) / trendData.length;
  
  // Generate insights
  const insights = generateMockInsights(viewMode, categoryData);
  
  // Generate health score
  const healthScore = generateMockHealthScore(viewMode);
  
  // Generate period selectors
  const periodSelectors = generatePeriodSelectors(periodType);
  
  // Always generate top spending categories with previous data
  const topSpendingCategories = generateMockTopSpendingCategories(categoryData);
  
  return {
    categoryData,
    trendData,
    insights,
    healthScore,
    periodSelectors,
    averageSpending,
    topSpendingCategories
  };
}; 