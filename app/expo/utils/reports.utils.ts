import {
  CategoryData,
  DatePeriodEnum,
  HealthScore,
  Insight,
  ReportData,
  BudgetReportData,
  TopSpendingCategory,
  TrendData,
  PeriodSelectorData,
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
  subMonths,
  subYears,
  subDays,
  addWeeks,
  getWeek,
} from "date-fns";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { getBudgets, BudgetPeriod, Budgets } from "@/utils/budget.utils";
import { summariseBills } from "@/utils/abi-summary.utils";
import { computeHealthScore } from "@/utils/health-score.utils";
import i18n from "@/i18n";
import { enUS, zhCN, es as esLocale } from "date-fns/locale";
import { Locale } from "date-fns";

// ------------ Global singleton typings (avoid TS errors) ---------------
declare global {
  // Using `var` to allow re-assignment across modules
  // eslint-disable-next-line no-var
  var __momiqReportInflight:
    | Record<string, Promise<ReportData> | undefined>
    | undefined;
}
// ----------------------------------------------------------------------

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
  endDate: Date,
  bills: Bill[],
  transactions: Transaction[]
): Promise<TrendData[]> => {
  // 获取当前语言并映射到 date-fns locale
  const language = i18n.language.split("-")[0];
  const localeMap: Record<string, Locale> = {
    en: enUS,
    zh: zhCN,
    es: esLocale,
  };
  const locale = localeMap[language] || enUS;

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

  // Map detailed status (Good/Warning/Danger) -> simplified (Good/Fair/Poor)
  const mappedStatus: "Good" | "Fair" | "Poor" =
    status === "Good" ? "Good" : status === "Fair" ? "Fair" : "Poor";

  // 合并基础分数（含预算权重）与详细分数，使预算调整能实时影响最终得分。
  const mergedScore = Math.round(
    (spendingDisciplineScore + budgetAdherenceScore + savingsRateScore) / 3
  );

  const healthScore: HealthScore = {
    ...{
      score: mergedScore,
      status: mappedStatus,
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
    },
    metrics: {
      budgetUsagePct: 0,
      volatilityPct: 0,
      recurringCoverDays: 0,
      savingsRatePct: 0,
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore legacy extension
    subScores: {
      volatility: { pct: 0 },
      recurring: { days: 0 },
    },
  } as any;

  return healthScore;
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

// 内存缓存
const reportCache: Record<
  string,
  { data: ReportData; timestamp: number; dataVersion?: number }
> = {};

// 预算报表缓存
const budgetReportCache: Record<
  string,
  { data: BudgetReportData; timestamp: number; budgetVersion?: number }
> = {};

// 缓存有效期 (毫秒)
const REPORT_CACHE_TTL = 30000; // 30秒

// 从缓存获取报告
function getReportFromCache(
  key: string,
  dataVersion?: number
): ReportData | null {
  const entry = reportCache[key];

  // 1️⃣ 如果调用方提供了 dataVersion，并且缓存中的 dataVersion 与之匹配，
  //    则直接返回缓存数据，**忽略 TTL**。
  //    这样当账单 / 预算数据没有实际变化时，不会因为时间导致重复计算。
  if (dataVersion && entry) {
    if (entry.dataVersion === dataVersion) {
      // 版本一致，直接返回缓存，避免不必要的重新加载
      console.log("使用报表缓存数据（版本匹配）");
      return entry.data;
    }

    // 版本不一致，说明底层数据已更新，需要重新生成报表
    console.log("数据版本已变化，缓存失效");
    return null;
  }

  // 2️⃣ 如果没有传入 dataVersion（降级场景），则继续使用基于时间的 TTL 策略
  if (entry && Date.now() - entry.timestamp < REPORT_CACHE_TTL) {
    console.log("使用报表缓存数据（TTL 未过期）");
    return entry.data;
  }
  return null;
}

// 缓存报告
function cacheReport(
  key: string,
  data: ReportData,
  dataVersion?: number
): void {
  reportCache[key] = {
    data,
    timestamp: Date.now(),
    dataVersion,
  };
}

// 从预算缓存获取报告
function getBudgetReportFromCache(
  key: string,
  budgetVersion?: number
): BudgetReportData | null {
  const entry = budgetReportCache[key];

  if (budgetVersion && entry) {
    if (entry.budgetVersion === budgetVersion) {
      return entry.data;
    }
    return null;
  }

  if (entry && Date.now() - entry.timestamp < REPORT_CACHE_TTL) {
    return entry.data;
  }
  return null;
}

// 缓存预算报告
function cacheBudgetReport(
  key: string,
  data: BudgetReportData,
  budgetVersion?: number
): void {
  budgetReportCache[key] = {
    data,
    timestamp: Date.now(),
    budgetVersion,
  };
}

// -----------------------------------------------------------------------------
// Cache-key helper to ensure consistency across in-flight de-duplication,
// memory caching and inner computation. Using a single function avoids subtle
// typos (periodType/viewMode order, "default" vs "latest" etc.) that led to
// multiple "报表数据计算完成" logs.
// -----------------------------------------------------------------------------
function buildReportCacheKey(
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family",
  selectedPeriodId?: string
): string {
  return `report_${viewMode}_${periodType}_${selectedPeriodId ?? "default"}`;
}

// 构建预算报表缓存key
function buildBudgetReportCacheKey(
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family",
  selectedPeriodId?: string
): string {
  return `budget_${viewMode}_${periodType}_${selectedPeriodId ?? "default"}`;
}

// 主要的报表数据获取函数
export async function fetchReportData(
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family",
  selectedPeriodId?: string,
  dataVersion?: number,
  forceRefresh = false
): Promise<ReportData> {
  // ---- 1. 并发请求去重 --------------------------------------------------
  const cacheKey = buildReportCacheKey(periodType, viewMode, selectedPeriodId);

  if (!globalThis.__momiqReportInflight) globalThis.__momiqReportInflight = {};
  const inFlight = globalThis.__momiqReportInflight;

  const existingPromise = inFlight[cacheKey];
  if (!forceRefresh && existingPromise) {
    return existingPromise;
  }

  // ---- 2. 读取缓存 ------------------------------------------------------
  if (!forceRefresh) {
    const cached = getReportFromCache(cacheKey, dataVersion);
    if (cached) return Promise.resolve(cached);
  } else {
    // forceRefresh=true时，清除对应的缓存条目，确保重新计算
    console.log("Clearing report cache for key:", cacheKey);
    delete reportCache[cacheKey];
  }

  // ---- 3. 简化的报表生成 --------------------------------------------------
  const promise: Promise<ReportData> = (async () => {
    try {
      // 生成缓存key
      const cacheKey = buildReportCacheKey(
        periodType,
        viewMode,
        selectedPeriodId
      );

      // 尝试从内存缓存中获取报告数据
      if (!forceRefresh) {
        const cachedReport = getReportFromCache(cacheKey, dataVersion);
        if (cachedReport) {
          return cachedReport;
        }
      }

      const periodSelectors = generatePeriodSelectors(periodType);
      const selectedPeriod = periodSelectors.find(
        (p) => p.id === selectedPeriodId
      );

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

      // 快速获取本地数据 - 并行加载但使用缓存
      let bills: Bill[], transactions: Transaction[], budgets: Budgets;

      try {
        [bills, transactions, budgets] = await Promise.all([
          getBills(),
          getTransactions(),
          getBudgets(),
        ]);
      } catch (error) {
        console.error("获取基础数据失败:", error);
        // 使用空数组作为默认值继续执行
        bills = [];
        transactions = [];
        budgets = {
          weekly: undefined,
          monthly: undefined,
          yearly: undefined,
        };
      }

      // 快速生成核心数据
      const categoryData = await generateCategoryDataFromRawData(
        bills,
        transactions,
        startDate,
        endDate,
        viewMode
      );

      // 简化的趋势数据 - 只计算必要的点
      const trendData = await generateSimplifiedTrendData(
        periodType,
        viewMode,
        startDate,
        endDate,
        bills,
        transactions
      );

      // 计算预算状态（用于健康评分、卡片及小组件）
      const budgetStatus = await calculateBudgetStatus(
        bills,
        budgets,
        periodType,
        startDate,
        endDate
      );

      // 基础健康评分（简化计算）
      const baseScore = generateSimplifiedHealthScore(
        categoryData,
        budgetStatus
      );

      // 计算详细指标，与首页卡片保持一致
      const billSummary = summariseBills(
        bills,
        budgets,
        periodType,
        startDate,
        endDate,
        0
      );
      const detailedScore = computeHealthScore(billSummary);

      // Map detailed status (Good/Warning/Danger) -> simplified (Good/Fair/Poor)
      const mappedStatus: "Good" | "Fair" | "Poor" =
        detailedScore.status === "Danger"
          ? "Poor"
          : detailedScore.status === "Warning"
            ? "Fair"
            : "Good";

      // 智能合并分数：超支时优先考虑预算控制，正常时综合考虑
      let mergedScore: number;
      let finalStatus: "Good" | "Fair" | "Poor";

      if (budgetStatus && budgetStatus.percentage > 100) {
        // 超支情况：优先考虑预算控制分数，但不完全忽略详细分数
        mergedScore = Math.round(
          baseScore.score * 0.8 + detailedScore.score * 0.2
        );
        finalStatus = "Poor"; // 超支情况强制为 Poor
      } else if (budgetStatus && budgetStatus.percentage > 90) {
        // 接近超支：预算控制权重更高
        mergedScore = Math.round(
          baseScore.score * 0.7 + detailedScore.score * 0.3
        );
        finalStatus = baseScore.score < 30 ? "Poor" : "Fair";
      } else {
        // 正常情况：平衡考虑两个分数
        mergedScore = Math.round((baseScore.score + detailedScore.score) / 2);
        finalStatus = mappedStatus;
      }

      const healthScore: HealthScore = {
        ...baseScore,
        score: mergedScore,
        status: finalStatus,
        metrics: {
          budgetUsagePct: budgetStatus?.percentage ?? 0,
          volatilityPct: detailedScore.subScores.volatility.pct,
          recurringCoverDays: detailedScore.subScores.recurring.days,
          savingsRatePct: 0,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore legacy extension
        subScores: detailedScore.subScores,
      } as any;

      // 顶级支出类别 - 直接从categoryData计算
      const topSpendingCategories = generateTopSpendingCategories(categoryData);

      // 计算平均支出
      const averageSpending =
        trendData.length > 0
          ? trendData.reduce((sum, item) => sum + item.value, 0) /
            trendData.length
          : 0;

      // 完整的报表数据
      const completeReport: ReportData = {
        categoryData,
        trendData,
        insights: [], // 简化：移除复杂的洞察计算
        healthScore,
        periodSelectors,
        averageSpending,
        topSpendingCategories,
        viewMode,
        periodType,
      };

      // 更新缓存
      cacheReport(cacheKey, completeReport, dataVersion);

      console.log("报表数据计算完成");
      return completeReport;
    } catch (error) {
      console.error("Error generating report data:", error);
      // 返回基本报表数据以避免UI崩溃
      return {
        categoryData: [],
        trendData: [],
        insights: [],
        healthScore: {
          score: 0,
          status: "Fair" as const,
          categories: [],
        },
        periodSelectors: [],
        averageSpending: 0,
        viewMode,
        periodType,
      };
    } finally {
      // 清理inFlight记录
      delete inFlight[cacheKey];
    }
  })();

  // 将生成的 Promise 加入 inFlight map
  inFlight[cacheKey] = promise;

  return promise;
}

// 新增：简化的趋势数据生成
async function generateSimplifiedTrendData(
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family",
  startDate: Date,
  endDate: Date,
  bills: Bill[],
  transactions: Transaction[]
): Promise<TrendData[]> {
  const trendData: TrendData[] = [];
  // 获取当前语言环境
  const currentLang = i18n.language || "en";
  const locale: Locale =
    currentLang === "zh" ? zhCN : currentLang === "es" ? esLocale : enUS;

  // 简化：减少数据点数量，提高性能
  switch (periodType) {
    case DatePeriodEnum.WEEK: {
      // 周视图：只计算7天
      let currentDay = startDate;
      while (currentDay <= endDate && trendData.length < 7) {
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
      // 月视图：采样，每3天一个点
      let currentDay = startDate;
      while (currentDay <= endDate && trendData.length < 10) {
        const startOfDayDate = startOfDay(currentDay);
        const endOfDayDate = endOfDay(addDays(currentDay, 2)); // 3天为一组

        const periodExpense = calculateTotalExpenseForPeriod(
          startOfDayDate,
          endOfDayDate,
          viewMode,
          bills,
          transactions
        );

        trendData.push({
          label: format(currentDay, "d", { locale }),
          value: periodExpense,
          date: format(currentDay, "yyyy-MM-dd"),
        });
        currentDay = addDays(currentDay, 3);
      }
      break;
    }

    case DatePeriodEnum.YEAR: {
      // 年视图：按月计算
      let currentMonth = startOfMonth(startDate);
      while (currentMonth <= endDate && trendData.length < 12) {
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
}

// 新增：简化的健康评分生成
function generateSimplifiedHealthScore(
  categoryData: CategoryData[],
  budgetStatus: BudgetReportData["budget"]
): HealthScore {
  const totalSpent = categoryData.reduce((sum, cat) => sum + cat.value, 0);

  // 重新设计的评分计算 - 更严格的预算控制导向
  let score = 50; // 降低基础分数
  let status: "Good" | "Fair" | "Poor" = "Good";

  // 预算使用情况影响评分
  if (budgetStatus && budgetStatus.amount && budgetStatus.amount > 0) {
    const usagePercent = budgetStatus.percentage;
    if (usagePercent <= 50) {
      // 优秀控制：使用50%以下
      score += 40;
      status = "Good";
    } else if (usagePercent <= 70) {
      // 良好控制：使用50-70%
      score += 25;
      status = "Good";
    } else if (usagePercent <= 85) {
      // 一般控制：使用70-85%
      score += 10;
      status = "Good";
    } else if (usagePercent <= 95) {
      // 警告区间：使用85-95%
      score -= 10;
      status = "Fair";
    } else if (usagePercent <= 100) {
      // 接近超支：使用95-100%
      score -= 25;
      status = "Fair";
    } else if (usagePercent <= 110) {
      // 轻微超支：100-110%
      score -= 40;
      status = "Poor";
    } else if (usagePercent <= 150) {
      // 严重超支：110-150%
      score -= 50;
      status = "Poor";
    } else {
      // 极度超支：>150%
      score -= 60;
      status = "Poor";
    }
  }

  // 支出分散度影响评分
  if (categoryData.length > 3) {
    score += 10; // 支出类别多样化加分
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status,
    categories: categoryData.slice(0, 3).map((cat, index) => ({
      name: cat.label,
      score: Math.min(100, Math.max(0, 100 - (cat.value / totalSpent) * 100)),
      status: (cat.value > totalSpent * 0.4 ? "Poor" : "Good") as
        | "Good"
        | "Fair"
        | "Poor",
      color: cat.color,
    })),
  };
}

// 使用已经获取的原始账单和交易数据生成类别数据
async function generateCategoryDataFromRawData(
  bills: Bill[],
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  viewMode: "personal" | "family"
): Promise<CategoryData[]> {
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

  // 计算总支出
  const totalExpense = [...categoryMap.values()].reduce(
    (sum, amount) => sum + amount,
    0
  );

  // 转换为分类数据数组
  const result: CategoryData[] = [];
  categoryMap.forEach((value, categoryId) => {
    const categoryInfo = EXPENSE_CATEGORIES.find(
      (cat) => cat.id === categoryId
    );
    const color = getCategoryColor(categoryId);

    result.push({
      label: categoryInfo?.name ?? categoryId,
      value,
      color,
      yearOverYearChange: calculateYearOverYearChange(
        categoryId,
        startDate,
        endDate,
        viewMode,
        bills,
        transactions
      ),
    });
  });

  // 按金额降序排序
  return result.sort((a, b) => b.value - a.value);
}

// 使用已加载的数据快速计算预算状态
async function calculateBudgetStatus(
  bills: Bill[],
  budgets: Budgets,
  periodType: DatePeriodEnum,
  startDate: Date,
  endDate: Date
): Promise<BudgetReportData["budget"]> {
  const periodMap: Record<DatePeriodEnum, BudgetPeriod> = {
    [DatePeriodEnum.WEEK]: "weekly",
    [DatePeriodEnum.MONTH]: "monthly",
    [DatePeriodEnum.YEAR]: "yearly",
  } as const;

  const budgetDetail = budgets[periodMap[periodType]];
  const budgetAmount = budgetDetail?.amount ?? null;

  // Re-compute spent total using summariseBills so that it respects category filters defined in budget settings
  const summaryForSpent = summariseBills(
    bills,
    budgets,
    periodType,
    startDate,
    endDate,
    0
  );
  const spentTotal = summaryForSpent.coreTotals.totalExpense;

  const remaining = budgetAmount ? Math.max(0, budgetAmount - spentTotal) : 0;
  const percentage = budgetAmount ? (spentTotal / budgetAmount) * 100 : 0;

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
    amount: budgetAmount,
    spent: spentTotal,
    remaining,
    percentage,
    status: budgetStatus,
  };
}

// 计算波动率百分比
function calculateVolatilityPercentage(trendData: TrendData[]): number {
  if (trendData.length <= 1) {
    return 0;
  }

  // 提取值
  const values = trendData.map((item) => item.value);

  // 计算平均值
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

  if (mean === 0) return 0;

  // 计算标准差
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // 波动率 = 标准差 / 平均值 * 100%
  const volatilityPct = (stdDev / mean) * 100;

  return Math.round(volatilityPct);
}

// 获取预算报表数据
export async function fetchBudgetReportData(
  periodType: DatePeriodEnum,
  viewMode: "personal" | "family",
  selectedPeriodId?: string,
  budgetVersion?: number,
  forceRefresh = false
): Promise<BudgetReportData> {
  const cacheKey = buildBudgetReportCacheKey(
    periodType,
    viewMode,
    selectedPeriodId
  );

  // 检查缓存
  if (!forceRefresh) {
    const cached = getBudgetReportFromCache(cacheKey, budgetVersion);
    if (cached) return Promise.resolve(cached);
  } else {
    delete budgetReportCache[cacheKey];
  }

  try {
    const periodSelectors = generatePeriodSelectors(periodType);
    const selectedPeriod = periodSelectors.find(
      (p) => p.id === selectedPeriodId
    );

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

    // 获取最新预算和账单数据
    const [bills, budgets] = await Promise.all([getBills(), getBudgets()]);

    // 计算预算状态
    const budgetStatus = await calculateBudgetStatus(
      bills,
      budgets,
      periodType,
      startDate,
      endDate
    );

    // 直接从账单数据生成类别数据用于健康评分
    const categoryData = await generateCategoryDataFromRawData(
      bills,
      [], // 暂时不考虑交易数据，简化计算
      startDate,
      endDate,
      viewMode
    );

    // 生成简化健康评分
    const baseScore = generateSimplifiedHealthScore(categoryData, budgetStatus);

    // 计算详细健康评分
    const billSummary = summariseBills(
      bills,
      budgets,
      periodType,
      startDate,
      endDate,
      0
    );
    const detailedScore = computeHealthScore(billSummary);

    // 智能合并分数：超支时优先考虑预算控制，正常时综合考虑
    let mergedScore: number;
    let finalStatus: "Good" | "Fair" | "Poor";

    if (budgetStatus && budgetStatus.percentage > 100) {
      // 超支情况：优先考虑预算控制分数，但不完全忽略详细分数
      mergedScore = Math.round(
        baseScore.score * 0.8 + detailedScore.score * 0.2
      );
      finalStatus = "Poor"; // 超支情况强制为 Poor
    } else if (budgetStatus && budgetStatus.percentage > 90) {
      // 接近超支：预算控制权重更高
      mergedScore = Math.round(
        baseScore.score * 0.7 + detailedScore.score * 0.3
      );
      finalStatus = baseScore.score < 30 ? "Poor" : "Fair";
    } else {
      // 正常情况：平衡考虑两个分数
      mergedScore = Math.round((baseScore.score + detailedScore.score) / 2);
      const mappedStatus: "Good" | "Fair" | "Poor" =
        detailedScore.status === "Danger"
          ? "Poor"
          : detailedScore.status === "Warning"
            ? "Fair"
            : "Good";
      finalStatus = mappedStatus;
    }

    const healthScore: HealthScore = {
      ...baseScore,
      score: mergedScore,
      status: finalStatus,
      metrics: {
        budgetUsagePct: budgetStatus?.percentage ?? 0,
        volatilityPct: detailedScore.subScores.volatility.pct,
        recurringCoverDays: detailedScore.subScores.recurring.days,
        savingsRatePct: 0,
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore legacy extension
      subScores: detailedScore.subScores,
    } as any;

    const budgetReport: BudgetReportData = {
      healthScore,
      budget: budgetStatus,
      periodType,
      viewMode,
    };

    // 缓存结果
    cacheBudgetReport(cacheKey, budgetReport, budgetVersion);

    return budgetReport;
  } catch (error) {
    console.error("Error generating budget report data:", error);
    return {
      healthScore: {
        score: 0,
        status: "Fair" as const,
        categories: [],
      },
      budget: {
        amount: null,
        spent: 0,
        remaining: 0,
        percentage: 0,
        status: "none" as const,
      },
      periodType,
      viewMode,
    };
  }
}
