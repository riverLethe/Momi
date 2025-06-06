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
  categories: string[] = [
    "Food", "Transport", "Shopping", "Entertainment", 
    "Utilities", "Health", "Education", "Gifts"
  ]
): CategoryData[] => {
  return categories.map(category => ({
    label: category,
    value: Math.round((Math.random() * 1000 + 500) * multiplier),
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
  
  return labels.map(label => ({
    label,
    value: Math.round((Math.random() * 1000 + 500) * multiplier)
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
    const previousAmount = Math.round(category.value * (Math.random() * 0.4 + 0.8)); // 80% to 120% of current
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
  const categoryData = generateMockCategoryData(familyMultiplier);
  
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