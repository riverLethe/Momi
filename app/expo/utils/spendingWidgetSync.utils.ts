import {
  DatePeriodEnum,
  ReportData,
  CategoryData,
} from "@/types/reports.types";
import { fetchReportData } from "./reports.utils";
import { updateSpendingWidgetForPeriod } from "./widgetData.utils";
import { formatCurrency } from "./format";
import i18n from "@/i18n";
import { generatePeriodSelectors } from "./date.utils";

// 防抖计时器
let syncDebounceTimer: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_DELAY = 300; // 300ms防抖

// 同步状态缓存
const syncStatusCache: Record<
  string,
  {
    lastSyncTime: number;
    lastDataVersion?: number;
  }
> = {};

// 检查是否需要同步
function shouldSync(
  key: string,
  dataVersion?: number,
  forceSync = false
): boolean {
  if (forceSync) return true;

  const cache = syncStatusCache[key];
  if (!cache) return true;

  const now = Date.now();
  // 5秒内不重复同步
  if (now - cache.lastSyncTime < 5000) return false;

  // 数据版本相同则跳过
  if (dataVersion && cache.lastDataVersion === dataVersion) return false;

  return true;
}

// 更新同步状态
function updateSyncStatus(key: string, dataVersion?: number) {
  syncStatusCache[key] = {
    lastSyncTime: Date.now(),
    lastDataVersion: dataVersion,
  };
}

/**
 * 优化的widget同步函数
 * - 添加防抖机制
 * - 智能同步检查
 * - 并行处理优化
 * - 错误隔离
 */
export async function syncSpendingWidgets(
  options: {
    /** Either "personal" (default) or "family" depending on current view */
    viewMode?: "personal" | "family";
    /** Already fetched report data for the currently displayed period */
    currentReportData?: ReportData | null;
    /** Period type of the currentReportData */
    currentPeriodType?: DatePeriodEnum;
    /** Data version to leverage long-lived cache */
    dataVersion?: number;
    /** Force sync regardless of cache */
    forceSync?: boolean;
  } = {}
): Promise<void> {
  const {
    viewMode = "personal",
    currentReportData,
    currentPeriodType,
    dataVersion,
    forceSync = false,
  } = options;

  // 防抖处理
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  return new Promise((resolve) => {
    syncDebounceTimer = setTimeout(async () => {
      try {
        await performWidgetSync({
          viewMode,
          currentReportData,
          currentPeriodType,
          dataVersion,
          forceSync,
        });
        resolve();
      } catch (error) {
        console.warn("Widget sync failed:", error);
        resolve(); // 不阻塞主流程
      }
    }, SYNC_DEBOUNCE_DELAY);
  });
}

/**
 * 执行实际的widget同步
 */
async function performWidgetSync(options: {
  viewMode: "personal" | "family";
  currentReportData?: ReportData | null;
  currentPeriodType?: DatePeriodEnum;
  dataVersion?: number;
  forceSync?: boolean;
}): Promise<void> {
  const {
    viewMode,
    currentReportData,
    currentPeriodType,
    dataVersion,
    forceSync = false,
  } = options;

  const mappings: Array<{
    key: "week" | "month" | "year";
    type: DatePeriodEnum;
  }> = [
    { key: "week", type: DatePeriodEnum.WEEK },
    { key: "month", type: DatePeriodEnum.MONTH },
    { key: "year", type: DatePeriodEnum.YEAR },
  ];

  const buildLabelForKey = (key: "week" | "month" | "year") => {
    try {
      if (key === "week") return i18n.t("This Week Total Expense");
      if (key === "month")
        return i18n.t("{{month}} Month Total Expense", {
          month: new Date().getMonth() + 1,
        });
      return i18n.t("{{year}} Year Total Expense", {
        year: new Date().getFullYear(),
      });
    } catch (error) {
      console.warn("i18n error in buildLabelForKey:", error);
      // fallback
      if (key === "week") return "This Week Total Expense";
      if (key === "month")
        return `${new Date().getMonth() + 1} Month Total Expense`;
      return `${new Date().getFullYear()} Year Total Expense`;
    }
  };

  // 并行处理每个周期的同步，但每个周期内部有错误隔离
  const syncPromises = mappings.map(async ({ key, type }) => {
    try {
      const syncKey = `${viewMode}-${key}`;

      // 检查是否需要同步
      if (!shouldSync(syncKey, dataVersion, forceSync)) {
        return;
      }

      let report: ReportData;

      // 优先使用已有数据
      if (currentPeriodType === type && currentReportData) {
        report = currentReportData;
      } else {
        // 获取第一个周期选择器ID
        const periodSelectors = generatePeriodSelectors(type);
        const firstSelectorId = periodSelectors[0]?.id;

        if (!firstSelectorId) {
          console.warn(`No period selector found for ${key}`);
          return;
        }

        report = await fetchReportData(
          type,
          viewMode,
          firstSelectorId,
          dataVersion
        );
      }

      const catData = report.categoryData || [];
      const spentTotal = catData.reduce<number>(
        (sum: number, c: CategoryData) => sum + (c.value || 0),
        0
      );

      // 优化分类数据处理 - 只处理有意义的数据
      const categoriesPayload = catData
        .filter((c) => c.value > 0) // 过滤0值分类
        .slice(0, 8) // 限制分类数量，提高性能
        .map((c) => ({
          name: i18n.t(c.label) || c.label, // fallback处理
          amountText: formatCurrency(c.value),
          percent: spentTotal ? Math.min(c.value / spentTotal, 1) : 0, // 确保percent不超过1
          color: c.color || "#64748B", // 默认颜色
        }));

      const totalText = formatCurrency(spentTotal);
      const label = buildLabelForKey(key);

      // 执行widget更新
      await updateSpendingWidgetForPeriod(
        key,
        totalText,
        label,
        categoriesPayload
      );

      // 更新同步状态
      updateSyncStatus(syncKey, dataVersion);
    } catch (error) {
      console.warn(`Failed to sync ${key} widget:`, error);
      // 错误隔离 - 单个widget失败不影响其他widget
    }
  });

  // 等待所有同步完成（错误已被各自捕获）
  await Promise.allSettled(syncPromises);
}

/**
 * 清除同步缓存 - 用于强制刷新
 */
export function clearWidgetSyncCache(): void {
  Object.keys(syncStatusCache).forEach((key) => {
    delete syncStatusCache[key];
  });

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
}

/**
 * 获取同步状态信息 - 用于调试
 */
export function getWidgetSyncStatus(): Record<string, any> {
  return {
    cache: syncStatusCache,
    hasActiveTimer: !!syncDebounceTimer,
  };
}
