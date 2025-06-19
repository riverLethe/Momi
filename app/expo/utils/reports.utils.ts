import {
  CategoryData,
  DatePeriodEnum,
  HealthScore,
  Insight,
  ReportData,
  TopSpendingCategory,
  TrendData,
} from "@/types/reports.types";
import { generatePeriodSelectors } from "./date.utils";
import { getBills } from "./bills.utils";
import { getTransactions } from "./transactions.utils";
import { Bill } from "@/types/bills.types";
import { Transaction } from "@/types/transactions.types";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subWeeks,
  addDays,
  addMonths,
} from "date-fns";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { getBudgets, BudgetPeriod } from "@/utils/budget.utils";
import { summariseBills } from "@/utils/abi-summary.utils";
import i18n from "@/i18n";
import { enUS, zhCN, es as esLocale } from "date-fns/locale";
import { Locale } from "date-fns";

// 根据类别ID获取类别颜色
const getCategoryColor = (categoryId: string): string => {
  const category = EXPENSE_CATEGORIES.find((cat) => cat.id === categoryId);
  return category?.color || "#94A3B8"; // 默认使用灰色
};

// 根据实际账单数据生成类别支出数据
export const generateCategoryData = async (
  startDate: Date,
  endDate: Date,
  viewMode: "personal" | "family"
): Promise<CategoryData[]> => {
  // 获取账单数据
  const bills = await getBills();
  const transactions = await getTransactions();

  // 根据视图模式过滤账单
  const filteredBills = bills.filter((bill) => {
    const billDate = new Date(bill.date);
    return (
      isWithinInterval(billDate, { start: startDate, end: endDate }) &&
      (viewMode === "family" ? bill.isFamilyBill : !bill.isFamilyBill)
    );
  });

  // 根据视图模式过滤交易
  const filteredTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      isWithinInterval(txDate, { start: startDate, end: endDate }) &&
      tx.type === "expense" &&
      (viewMode === "family" ? tx.isFamilyTransaction : !tx.isFamilyTransaction)
    );
  });

  // 合并账单和交易的类别数据
  const categoryMap = new Map<string, number>();

  // 处理账单
  filteredBills.forEach((bill) => {
    const currentAmount = categoryMap.get(bill.category) || 0;
    categoryMap.set(bill.category, currentAmount + bill.amount);
  });

  // 处理交易
  filteredTransactions.forEach((tx) => {
    const currentAmount = categoryMap.get(tx.category) || 0;
    categoryMap.set(tx.category, currentAmount + tx.amount);
  });

  // 转换为CategoryData数组
  const categoryData: CategoryData[] = Array.from(categoryMap.entries())
    .map(([categoryId, value]) => {
      const categoryInfo = EXPENSE_CATEGORIES.find(
        (cat) => cat.id === categoryId
      );

      return {
        // Use the human-readable name if available, otherwise fall back to the id
        label: categoryInfo?.name ?? categoryId,
        value,
        color: getCategoryColor(categoryId),
        yearOverYearChange: calculateYearOverYearChange(
          categoryId,
          startDate,
          endDate,
          viewMode,
          bills,
          transactions
        ),
      };
    })
    .sort((a, b) => b.value - a.value); // 按金额降序排序

  return categoryData;
};

// 计算同比变化
const calculateYearOverYearChange = (
  categoryId: string,
  currentStartDate: Date,
  currentEndDate: Date,
  viewMode: "personal" | "family",
  bills: Bill[],
  transactions: Transaction[]
): number => {
  try {
    // 计算同期的上一年日期范围
    let previousStartDate: Date;
    let previousEndDate: Date;

    const startYear = currentStartDate.getFullYear();
    const startMonth = currentStartDate.getMonth();
    const startDay = currentStartDate.getDate();

    const endYear = currentEndDate.getFullYear();
    const endMonth = currentEndDate.getMonth();
    const endDay = currentEndDate.getDate();

    previousStartDate = new Date(startYear - 1, startMonth, startDay);
    previousEndDate = new Date(endYear - 1, endMonth, endDay);

    // 获取当前时期的支出
    const currentPeriodExpense = calculateCategoryExpense(
      categoryId,
      currentStartDate,
      currentEndDate,
      viewMode,
      bills,
      transactions
    );

    // 获取上一年同期的支出
    const previousPeriodExpense = calculateCategoryExpense(
      categoryId,
      previousStartDate,
      previousEndDate,
      viewMode,
      bills,
      transactions
    );

    // 计算同比变化百分比
    if (previousPeriodExpense === 0) {
      return currentPeriodExpense > 0 ? 100 : 0; // 避免除以零
    }

    const changePercentage =
      ((currentPeriodExpense - previousPeriodExpense) / previousPeriodExpense) *
      100;
    return Math.round(changePercentage);
  } catch (error) {
    console.error("Failed to calculate year-over-year change:", error);
    return 0;
  }
};

// 计算特定类别在特定时间范围内的支出
const calculateCategoryExpense = (
  categoryId: string,
  startDate: Date,
  endDate: Date,
  viewMode: "personal" | "family",
  bills: Bill[],
  transactions: Transaction[]
): number => {
  // 过滤账单
  const filteredBills = bills.filter((bill) => {
    const billDate = new Date(bill.date);
    return (
      bill.category === categoryId &&
      isWithinInterval(billDate, { start: startDate, end: endDate }) &&
      (viewMode === "family" ? bill.isFamilyBill : !bill.isFamilyBill)
    );
  });

  // 过滤交易
  const filteredTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      tx.category === categoryId &&
      tx.type === "expense" &&
      isWithinInterval(txDate, { start: startDate, end: endDate }) &&
      (viewMode === "family" ? tx.isFamilyTransaction : !tx.isFamilyTransaction)
    );
  });

  // 计算总支出
  const billsTotal = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
  const transactionsTotal = filteredTransactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  return billsTotal + transactionsTotal;
};

// 根据实际数据生成趋势数据
export const generateTrendData = async (
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family",
  startDate: Date,
  endDate: Date
): Promise<TrendData[]> => {
  // 获取当前语言并映射到 date-fns locale
  const language = i18n.language.split("-")[0];
  const localeMap: Record<string, Locale> = {
    en: enUS,
    zh: zhCN,
    es: esLocale,
  };
  const locale = localeMap[language] || enUS;

  // 获取账单和交易数据
  const bills = await getBills();
  const transactions = await getTransactions();

  const trendData: TrendData[] = [];
  const today = startOfDay(new Date());

  // 如果endDate在今天之后，则使用今天作为实际结束日期，以避免显示未来数据
  const effectiveEndDate = endDate > today ? today : endDate;

  // 根据周期类型生成时间段
  switch (periodType) {
    case DatePeriodEnum.WEEK: {
      let currentDay = startDate;
      while (currentDay <= effectiveEndDate) {
        const startOfDayDate = startOfDay(currentDay);
        const endOfDayDate = endOfDay(currentDay);

        const dayExpense = calculateTotalExpenseForPeriod(
          startOfDayDate,
          endOfDayDate,
          viewMode,
          bills,
          transactions
        );

        trendData.push({
          label: format(currentDay, "EEE", { locale }),
          value: dayExpense,
          date: format(currentDay, "yyyy-MM-dd"),
        });
        currentDay = addDays(currentDay, 1);
      }
      break;
    }

    case DatePeriodEnum.MONTH: {
      let currentDay = startDate;
      while (currentDay <= effectiveEndDate) {
        const startOfDayDate = startOfDay(currentDay);
        const endOfDayDate = endOfDay(currentDay);

        const dayExpense = calculateTotalExpenseForPeriod(
          startOfDayDate,
          endOfDayDate,
          viewMode,
          bills,
          transactions
        );

        trendData.push({
          label: format(currentDay, "d", { locale }),
          value: dayExpense,
          date: format(currentDay, "yyyy-MM-dd"),
        });
        currentDay = addDays(currentDay, 1);
      }
      break;
    }

    case DatePeriodEnum.YEAR: {
      let currentMonth = startOfMonth(startDate);
      while (currentMonth <= effectiveEndDate) {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        const monthExpense = calculateTotalExpenseForPeriod(
          monthStart,
          monthEnd,
          viewMode,
          bills,
          transactions
        );

        trendData.push({
          label: format(currentMonth, "MMM", { locale }),
          value: monthExpense,
          date: format(currentMonth, "yyyy-MM"),
        });
        currentMonth = addMonths(currentMonth, 1);
      }
      break;
    }
  }

  return trendData;
};

// 计算指定日期范围内的支出总额
const calculateTotalExpenseForPeriod = (
  startDate: Date,
  endDate: Date,
  viewMode: "personal" | "family",
  bills: Bill[],
  transactions: Transaction[]
): number => {
  // 过滤账单
  const filteredBills = bills.filter((bill) => {
    const billDate = new Date(bill.date);
    return (
      isWithinInterval(billDate, { start: startDate, end: endDate }) &&
      (viewMode === "family" ? bill.isFamilyBill : !bill.isFamilyBill)
    );
  });

  // 过滤交易
  const filteredTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      tx.type === "expense" &&
      isWithinInterval(txDate, { start: startDate, end: endDate }) &&
      (viewMode === "family" ? tx.isFamilyTransaction : !tx.isFamilyTransaction)
    );
  });

  // 计算总支出
  const billsTotal = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
  const transactionsTotal = filteredTransactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  return billsTotal + transactionsTotal;
};

// 生成财务洞察
export const generateInsights = async (
  viewMode: "personal" | "family",
  categoryData: CategoryData[]
): Promise<Insight[]> => {
  const insights: Insight[] = [];

  // 如果没有足够的数据，返回默认洞察
  if (categoryData.length === 0) {
    return [
      {
        id: "1",
        title: i18n.t("No Data"),
        description:
          viewMode === "personal"
            ? i18n.t("Start adding your expenses to see insights")
            : i18n.t("Start adding family expenses to see insights"),
        type: "neutral",
      },
    ];
  }

  // 找出最高支出类别
  const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value);
  const highestCategory = sortedCategories[0];

  // 添加关于最高支出类别的洞察
  if (highestCategory) {
    insights.push({
      id: "1",
      title: i18n.t("Spending Pattern"),
      description:
        viewMode === "personal"
          ? i18n.t("Your highest expense is in {{category}} category", {
              category: i18n.t(highestCategory.label),
            })
          : i18n.t("Family's highest expense is in {{category}} category", {
              category: i18n.t(highestCategory.label),
            }),
      type: "neutral",
    });

    // 如果最高类别是食物或购物，添加节省建议
    if (
      highestCategory.label === "Food" ||
      highestCategory.label === "Shopping"
    ) {
      insights.push({
        id: "2",
        title: i18n.t("Savings Potential"),
        description: i18n.t(
          "You could save ¥{{amount}} on {{category}} by {{suggestion}}",
          {
            amount: Math.round(highestCategory.value * 0.15),
            category: i18n.t(highestCategory.label),
            suggestion:
              highestCategory.label === "Food"
                ? i18n.t("cooking more at home")
                : i18n.t("comparing prices before buying"),
          }
        ),
        type: "positive",
      });
    }
  }

  // 检查同比变化
  const increasedCategories = categoryData.filter(
    (cat) => (cat.yearOverYearChange || 0) > 20
  );

  if (increasedCategories.length > 0) {
    insights.push({
      id: "3",
      title: i18n.t("Budget Alert"),
      description: i18n.t(
        "{{category}} expenses increased by {{percentage}}% compared to last year",
        {
          category: i18n.t(increasedCategories[0].label),
          percentage: increasedCategories[0].yearOverYearChange || 0,
        }
      ),
      type: "negative",
    });
  }

  // 检查支出减少的类别
  const decreasedCategories = categoryData.filter(
    (cat) => (cat.yearOverYearChange || 0) < -20
  );

  if (decreasedCategories.length > 0) {
    insights.push({
      id: "4",
      title: i18n.t("Good Progress"),
      description: i18n.t(
        "You've reduced {{category}} expenses by {{percentage}}% compared to last year",
        {
          category: i18n.t(decreasedCategories[0].label),
          percentage: Math.abs(decreasedCategories[0].yearOverYearChange || 0),
        }
      ),
      type: "positive",
    });
  }

  return insights;
};

// 生成财务健康评分
export const generateHealthScore = async (
  viewMode: "personal" | "family",
  categoryData: CategoryData[],
  trendData: TrendData[]
): Promise<HealthScore> => {
  // 如果没有足够的数据，返回默认评分
  if (categoryData.length === 0 || trendData.length === 0) {
    return {
      score: viewMode === "personal" ? 50 : 50,
      status: "Fair",
      categories: [
        {
          name: i18n.t("Spending Discipline"),
          score: 50,
          color: "#3B82F6",
        },
        {
          name: i18n.t("Budget Adherence"),
          score: 50,
          color: "#10B981",
        },
        {
          name: i18n.t("Savings Rate"),
          score: 50,
          color: "#3B82F6",
        },
      ],
    };
  }

  // 计算支出纪律分数 (基于支出趋势的波动性)
  let spendingDisciplineScore = 75; // 默认起始分数

  if (trendData.length > 1) {
    // 计算支出波动性
    const values = trendData.map((item) => item.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const deviations = values.map((val) => Math.abs(val - average));
    const averageDeviation =
      deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;

    // 波动性越大，分数越低
    const volatilityPenalty = Math.min(25, (averageDeviation / average) * 100);
    spendingDisciplineScore = Math.max(50, 75 - volatilityPenalty);
  }

  // 计算预算遵守分数 (基于同比变化)
  let budgetAdherenceScore = 75; // 默认起始分数

  const increasedCategories = categoryData.filter(
    (cat) => (cat.yearOverYearChange || 0) > 0
  );
  const averageIncrease =
    increasedCategories.length > 0
      ? increasedCategories.reduce(
          (sum, cat) => sum + (cat.yearOverYearChange || 0),
          0
        ) / increasedCategories.length
      : 0;

  // 平均增长率越高，分数越低
  const growthPenalty = Math.min(25, averageIncrease / 2);
  budgetAdherenceScore = Math.max(50, 75 - growthPenalty);

  // 计算储蓄率分数 (基于支出趋势)
  let savingsRateScore = 75; // 默认起始分数

  if (trendData.length > 1) {
    // 检查支出趋势是否下降
    const firstHalf = trendData.slice(0, Math.ceil(trendData.length / 2));
    const secondHalf = trendData.slice(Math.ceil(trendData.length / 2));

    const firstHalfAverage =
      firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
    const secondHalfAverage =
      secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;

    const trendPercentage =
      ((secondHalfAverage - firstHalfAverage) / firstHalfAverage) * 100;

    // 如果趋势下降，分数提高；如果上升，分数降低
    savingsRateScore =
      trendPercentage <= 0
        ? Math.min(95, 75 + Math.abs(trendPercentage) / 2)
        : Math.max(55, 75 - trendPercentage / 2);
  }

  // 计算总分
  const totalScore = Math.round(
    (spendingDisciplineScore + budgetAdherenceScore + savingsRateScore) / 3
  );

  // 确定状态
  let status: "Good" | "Fair" | "Poor";
  if (totalScore >= 80) {
    status = "Good";
  } else if (totalScore >= 60) {
    status = "Fair";
  } else {
    status = "Poor";
  }

  return {
    score: totalScore,
    status,
    categories: [
      {
        name: i18n.t("Spending Discipline"),
        score: Math.round(spendingDisciplineScore),
        color: "#3B82F6",
      },
      {
        name: i18n.t("Budget Adherence"),
        score: Math.round(budgetAdherenceScore),
        color: totalScore >= 70 ? "#10B981" : "#F59E0B",
      },
      {
        name: i18n.t("Savings Rate"),
        score: Math.round(savingsRateScore),
        color: "#3B82F6",
      },
    ],
  };
};

// 生成顶部支出类别
export const generateTopSpendingCategories = (
  categoryData: CategoryData[]
): TopSpendingCategory[] => {
  const totalValue = categoryData.reduce((sum, item) => sum + item.value, 0);
  const sortedCategories = [...categoryData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return sortedCategories.map((category) => {
    // 使用类别的同比变化
    const changePercentage = category.yearOverYearChange || 0;

    // 计算前期金额
    const previousAmount =
      changePercentage !== 0
        ? Math.round(category.value / (1 + changePercentage / 100))
        : category.value;

    return {
      category: category.label,
      amount: category.value,
      percentage: (category.value / totalValue) * 100,
      color: category.color,
      previousAmount,
      changePercentage,
    };
  });
};

// 根据周期类型获取日期范围
const getDateRangeForPeriod = (
  periodType: DatePeriodEnum
): { start: Date; end: Date } => {
  const today = new Date();
  let start: Date;
  let end: Date = today;

  switch (periodType) {
    case DatePeriodEnum.WEEK:
      start = startOfWeek(today, { weekStartsOn: 1 }); // 周一开始
      end = endOfWeek(today, { weekStartsOn: 1 });
      break;
    case DatePeriodEnum.MONTH:
      start = startOfMonth(today);
      end = endOfMonth(today);
      break;
    case DatePeriodEnum.YEAR:
      start = startOfYear(today);
      end = endOfYear(today);
      break;
    default:
      start = subWeeks(today, 1);
      break;
  }

  return { start, end };
};

// 主函数：获取或生成报表数据
export const fetchReportData = async (
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family",
  periodId?: string
): Promise<ReportData> => {
  try {
    const periodSelectors = generatePeriodSelectors(periodType);
    const selectedPeriod = periodSelectors.find((p) => p.id === periodId);

    let startDate: Date;
    let endDate: Date;

    if (selectedPeriod) {
      startDate = selectedPeriod.startDate;
      endDate = selectedPeriod.endDate;
    } else {
      const latestPeriod = periodSelectors[0];
      if (latestPeriod) {
        startDate = latestPeriod.startDate;
        endDate = latestPeriod.endDate;
      } else {
        const range = getDateRangeForPeriod(periodType);
        startDate = range.start;
        endDate = range.end;
      }
    }

    // 根据实际数据生成类别支出数据
    let categoryData = await generateCategoryData(startDate, endDate, viewMode);

    // -------------------------
    // IMPORTANT: Do NOT filter categoryData by budget category filters.
    // The donut chart (EnhancedDonutChart) should always display the overall
    // spending breakdown, independent of any budget include/exclude settings.
    // -------------------------

    // 生成趋势数据
    const trendData = await generateTrendData(
      periodType,
      viewMode,
      startDate,
      endDate
    );

    // 计算平均支出
    const averageSpending =
      trendData.length > 0
        ? trendData.reduce((sum, item) => sum + item.value, 0) /
          trendData.length
        : 0;

    // 生成洞察
    const insights = await generateInsights(viewMode, categoryData);

    // 生成健康评分
    const healthScore = await generateHealthScore(
      viewMode,
      categoryData,
      trendData
    );

    // 生成顶部支出类别
    const topSpendingCategories = generateTopSpendingCategories(categoryData);

    // ---------------- Budget Stats ------------------
    const budgets = await getBudgets();
    const periodMap: Record<DatePeriodEnum, BudgetPeriod> = {
      [DatePeriodEnum.WEEK]: "weekly",
      [DatePeriodEnum.MONTH]: "monthly",
      [DatePeriodEnum.YEAR]: "yearly",
    } as const;

    const budgetDetail = budgets[periodMap[periodType]];
    const budgetAmount = budgetDetail?.amount ?? null;

    // Re-compute spent total using summariseBills so that it respects category filters defined in budget settings
    const allBills = await getBills();
    const summaryForSpent = summariseBills(
      allBills,
      budgets,
      periodType,
      startDate,
      endDate,
      0
    );
    const spentTotal = summaryForSpent.coreTotals.totalExpense;

    // ---------------- Health Metrics (for widgets & cross-component consistency) ------------------
    const healthMetrics = {
      budgetUsagePct:
        summaryForSpent.budgetUtilisation?.usagePct != null
          ? Math.round(summaryForSpent.budgetUtilisation.usagePct)
          : 0,
      volatilityPct: Math.round(summaryForSpent.volatility?.volatilityPct ?? 0),
      // TODO: improve savingsRatePct once income / savings data pipeline ready
      savingsRatePct: 0,
      recurringCoverDays: summaryForSpent.recurring?.recurringCoverDays ?? 0,
    } as const;

    const remaining = budgetAmount ? Math.max(0, budgetAmount - spentTotal) : 0;
    const percentage = budgetAmount
      ? Math.min((spentTotal / budgetAmount) * 100, 100)
      : 0;

    let budgetStatus: "good" | "warning" | "danger" | "none" = "none";
    if (budgetAmount === null) {
      budgetStatus = "none";
    } else if (percentage >= 90) {
      budgetStatus = "danger";
    } else if (percentage >= 70) {
      budgetStatus = "warning";
    } else {
      budgetStatus = "good";
    }

    return {
      categoryData,
      trendData,
      insights,
      healthScore: {
        ...healthScore,
        metrics: healthMetrics,
      },
      periodSelectors,
      averageSpending,
      topSpendingCategories,
      viewMode,
      periodType,
      budget: {
        amount: budgetAmount,
        spent: spentTotal,
        remaining,
        percentage,
        status: budgetStatus,
      },
    };
  } catch (error) {
    console.error("Error generating report data:", error);
    throw error;
  }
};
