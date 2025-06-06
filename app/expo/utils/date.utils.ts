import { DatePeriodEnum } from "@/types/reports.types";
import { format, subWeeks, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

/**
 * Generates a formatted label for a specific date period
 */
export const formatPeriodLabel = (date: Date, periodType: DatePeriodEnum): string => {
  switch (periodType) {
    case DatePeriodEnum.WEEK:
      return `${format(date, 'yyyy')}-${format(date, 'ww')}`;
    case DatePeriodEnum.MONTH:
      return format(date, 'yyyy/MM');
    case DatePeriodEnum.YEAR:
      return format(date, 'yyyy');
    default:
      return format(date, 'yyyy-MM-dd');
  }
};

/**
 * Generates period selector data (previous N periods)
 */
export const generatePeriodSelectors = (periodType: DatePeriodEnum, count: number = 12) => {
  const today = new Date();
  const result = [];

  for (let i = 0; i < count; i++) {
    let date: Date;
    let startDate: Date;
    let endDate: Date;
    
    switch (periodType) {
      case DatePeriodEnum.WEEK:
        date = subWeeks(today, i);
        startDate = startOfWeek(date, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
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
        date = subWeeks(today, i);
        startDate = startOfWeek(date, { weekStartsOn: 1 });
        endDate = endOfWeek(date, { weekStartsOn: 1 });
    }

    const label = formatPeriodLabel(date, periodType);
    result.push({
      id: `${periodType.toLowerCase()}-${i}`,
      label,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
  }

  return result;
};

/**
 * Gets period-specific trend data labels
 */
export const getTrendLabels = (periodType: DatePeriodEnum): string[] => {
  switch (periodType) {
    case DatePeriodEnum.WEEK:
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    case DatePeriodEnum.MONTH:
      return Array.from({ length: 31 }, (_, i) => `${i + 1}`);
    case DatePeriodEnum.YEAR:
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    default:
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }
}; 