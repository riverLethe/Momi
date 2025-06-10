import { DatePeriodEnum, PeriodSelectorData } from "@/types/reports.types";
import {
  format,
  subWeeks,
  subMonths,
  subYears,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

/**
 * 为特定日期周期生成格式化的标签
 * @param date - The date to format
 * @param periodType - The type of period (week, month, year)
 * @returns A formatted string label (e.g., "2023-W28", "2023/07", "2023")
 */
export const formatPeriodLabel = (
  date: Date,
  periodType: DatePeriodEnum
): string => {
  switch (periodType) {
    case DatePeriodEnum.WEEK:
      // 使用 ISO week date format (e.g., 2023-W28)
      return `${format(date, "yyyy")}-W${format(date, "ww")}`;
    case DatePeriodEnum.MONTH:
      return format(date, "yyyy/MM");
    case DatePeriodEnum.YEAR:
      return format(date, "yyyy");
    default:
      return format(date, "yyyy-MM-dd");
  }
};

/**
 * 生成周期选择器数据（例如，最近的N个周期）
 * @param periodType - The type of period (week, month, year)
 * @param count - The number of past periods to generate
 * @returns An array of period selector data
 */
export const generatePeriodSelectors = (
  periodType: DatePeriodEnum,
  count: number = 12
): PeriodSelectorData[] => {
  const today = new Date();
  const result: PeriodSelectorData[] = [];

  for (let i = 0; i < count; i++) {
    let date: Date;
    let startDate: Date;
    let endDate: Date;

    switch (periodType) {
      case DatePeriodEnum.WEEK:
        date = subWeeks(today, i);
        startDate = startOfWeek(date, { weekStartsOn: 1 }); // 周一
        endDate = endOfWeek(date, { weekStartsOn: 1 }); // 周日
        break;
      case DatePeriodEnum.MONTH:
        date = subMonths(today, i);
        startDate = startOfMonth(date);
        endDate = endOfMonth(date);
        break;
      case DatePeriodEnum.YEAR:
        date = subYears(today, i);
        startDate = startOfYear(date);
        endDate = endOfYear(date);
        break;
      default:
        // 默认按周处理
        date = subWeeks(today, i);
        startDate = startOfWeek(date, { weekStartsOn: 1 });
        endDate = endOfWeek(date, { weekStartsOn: 1 });
    }

    const label = formatPeriodLabel(date, periodType);
    result.push({
      id: `${periodType.toLowerCase()}-${i}`,
      label,
      startDate,
      endDate,
    });
  }

  return result;
};

/**
 * 获取特定周期的趋势图表标签
 * (注意: 此函数可能不再需要，因为标签现在在 `generateTrendData` 中动态生成)
 * @param periodType - The type of period (week, month, year)
 * @returns An array of strings for chart labels
 */
export const getTrendLabels = (periodType: DatePeriodEnum): string[] => {
  switch (periodType) {
    case DatePeriodEnum.WEEK:
      return ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    case DatePeriodEnum.MONTH:
      // 对于月份，返回一个月的日期 (1-31)
      return Array.from({ length: 31 }, (_, i) => `${i + 1}`);
    case DatePeriodEnum.YEAR:
      return [
        "一月",
        "二月",
        "三月",
        "四月",
        "五月",
        "六月",
        "七月",
        "八月",
        "九月",
        "十月",
        "十一月",
        "十二月",
      ];
    default:
      return ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  }
};
