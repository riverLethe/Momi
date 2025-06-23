import { useCallback, useEffect, useState, useRef } from "react";
import {
  DatePeriodEnum,
  PeriodSelectorData,
  ReportData,
} from "@/types/reports.types";
import { fetchReportData } from "@/utils/reports.utils";
import { generatePeriodSelectors } from "@/utils/date.utils";
import { useData } from "@/providers/DataProvider";

export const useReportData = (viewMode: "personal" | "family") => {
  const { dataVersion } = useData();
  const [periodType, setPeriodType] = useState<DatePeriodEnum>(
    DatePeriodEnum.WEEK
  );
  const [periodSelectors, setPeriodSelectors] = useState<PeriodSelectorData[]>(
    []
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [loadingInBackground, setLoadingInBackground] =
    useState<boolean>(false);

  // 跟踪组件是否已挂载
  const isMounted = useRef<boolean>(true);
  // 跟踪最后一次加载请求的时间戳
  const lastLoadRequestTime = useRef<number>(0);
  // 防止递归加载
  const isLoadingRef = useRef<boolean>(false);
  // 添加一个引用来跟踪已处理的数据版本
  const processedDataVersionRef = useRef<number | null>(null);
  // 跟踪每个周期类型的报表数据
  const reportDataCache = useRef<Record<string, ReportData>>({});
  // 跟踪周期类型切换
  const isChangingPeriodType = useRef<boolean>(false);
  // 预加载所有周期类型的数据
  const hasPreloadedRef = useRef<boolean>(false);

  // 初始化周期选择器
  useEffect(() => {
    // 为所有周期类型预先生成选择器
    const allPeriodTypes = [
      DatePeriodEnum.WEEK,
      DatePeriodEnum.MONTH,
      DatePeriodEnum.YEAR,
    ];
    const allSelectors: Record<DatePeriodEnum, PeriodSelectorData[]> = {
      [DatePeriodEnum.WEEK]: generatePeriodSelectors(DatePeriodEnum.WEEK),
      [DatePeriodEnum.MONTH]: generatePeriodSelectors(DatePeriodEnum.MONTH),
      [DatePeriodEnum.YEAR]: generatePeriodSelectors(DatePeriodEnum.YEAR),
    };

    // 设置当前周期类型的选择器
    setPeriodSelectors(allSelectors[periodType]);

    // 如果没有选定ID，默认选择第一个
    if (!selectedPeriodId && allSelectors[periodType].length > 0) {
      setSelectedPeriodId(allSelectors[periodType][0].id);
    }
  }, [periodType]);

  // 预加载所有周期类型的报表数据
  const preloadAllPeriodTypes = useCallback(async () => {
    if (hasPreloadedRef.current) return;

    const allPeriodTypes = [
      DatePeriodEnum.WEEK,
      DatePeriodEnum.MONTH,
      DatePeriodEnum.YEAR,
    ];

    // 先加载当前周期类型
    await loadPeriodTypeData(periodType);

    // 然后后台加载其他周期类型
    for (const type of allPeriodTypes) {
      if (type !== periodType) {
        loadPeriodTypeData(type, true);
      }
    }

    hasPreloadedRef.current = true;
  }, [periodType, viewMode]);

  // 加载特定周期类型的数据
  const loadPeriodTypeData = useCallback(
    async (type: DatePeriodEnum, isBackground = false) => {
      try {
        // 生成该周期类型的选择器
        const selectors = generatePeriodSelectors(type);
        if (selectors.length === 0) return;

        // 使用第一个选择器ID
        const firstSelectorId = selectors[0].id;

        // 构建缓存键
        const cacheKey = `${type}_${viewMode}_${firstSelectorId}`;

        // 如果已有缓存，不重复加载
        if (reportDataCache.current[cacheKey]) return;

        // 获取数据
        const data = await fetchReportData(
          type,
          viewMode,
          firstSelectorId,
          dataVersion,
          false
        );

        // 缓存数据
        reportDataCache.current[cacheKey] = data;

        // 如果是当前周期类型，更新UI
        if (type === periodType && !isBackground) {
          setReportData(data);
        }
      } catch (error) {
        console.error(`预加载 ${type} 数据失败:`, error);
      }
    },
    [viewMode, dataVersion]
  );

  // 报告加载的主要函数
  const onLoadReportData = useCallback(
    async (onDone?: () => void, forceRefresh = false) => {
      // 防止递归调用
      if (isLoadingRef.current) {
        console.log("已有加载进行中，跳过");
        onDone?.();
        return;
      }

      // 记录请求时间
      const requestTime = Date.now();
      lastLoadRequestTime.current = requestTime;
      isLoadingRef.current = true;

      try {
        // 构建缓存键
        const cacheKey = `${periodType}_${viewMode}_${selectedPeriodId || "default"}`;

        // 检查缓存中是否有该周期类型的报表数据
        if (!forceRefresh && reportDataCache.current[cacheKey]) {
          console.log("使用内存中的报表数据缓存");
          setReportData(reportDataCache.current[cacheKey]);
          isLoadingRef.current = false;
          onDone?.();
          return;
        }

        // 如果没有缓存，才设置加载状态
        setLoadingInBackground(true);
        console.log("开始加载报表数据");

        // 获取数据，包括缓存机制，传递数据版本和强制刷新参数
        const data = await fetchReportData(
          periodType,
          viewMode,
          selectedPeriodId,
          dataVersion,
          forceRefresh
        ).catch((error) => {
          console.error("fetchReportData失败:", error);
          // 创建基本的报表数据，以防止UI崩溃
          return {
            categoryData: [],
            trendData: [],
            insights: [],
            healthScore: {
              score: 0,
              status: "Fair",
              categories: [],
            },
            periodSelectors: [],
            averageSpending: 0,
            viewMode,
            periodType,
          } as ReportData;
        });

        // 确保不是过时的请求响应
        if (lastLoadRequestTime.current !== requestTime || !isMounted.current) {
          console.log("丢弃过时的报表数据响应");
          onDone?.();
          return;
        }

        // 缓存报表数据
        reportDataCache.current[cacheKey] = data;

        // 设置报表数据
        console.log("报表数据加载完成");
        setReportData(data);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        // 确保组件仍然挂载且不是过时的请求
        if (isMounted.current && lastLoadRequestTime.current === requestTime) {
          setLoadingInBackground(false);
          isLoadingRef.current = false;
          onDone?.();
          console.log("报表加载状态已重置");
        } else {
          isLoadingRef.current = false;
        }
      }
    },
    [periodType, viewMode, selectedPeriodId, dataVersion]
  );

  // 加载报表数据，带loading状态
  const loadReportData = useCallback(
    async (forceRefresh = false) => {
      // 防止重复加载
      if (isLoadingRef.current) return;

      // 构建缓存键
      const cacheKey = `${periodType}_${viewMode}_${selectedPeriodId || "default"}`;

      // 如果有缓存数据，不显示加载状态
      if (!forceRefresh && reportDataCache.current[cacheKey]) {
        await onLoadReportData(undefined, forceRefresh);
        return;
      }

      // 没有缓存数据，显示加载状态
      setLoadingReport(true);

      try {
        await onLoadReportData(undefined, forceRefresh);
      } finally {
        // 确保在任何情况下都重置加载状态
        if (isMounted.current) {
          setLoadingReport(false);
        }
      }
    },
    [onLoadReportData, periodType, viewMode, selectedPeriodId]
  );

  // 初始加载 - 只在组件挂载时执行一次
  useEffect(() => {
    loadReportData();

    // 预加载所有周期类型的数据
    setTimeout(() => {
      preloadAllPeriodTypes();
    }, 1000); // 延迟1秒，让当前视图先加载完成

    // 空依赖数组，确保只在挂载时执行一次
  }, []);

  // 处理周期类型变化
  const handlePeriodTypeChange = useCallback(
    (newPeriodType: DatePeriodEnum) => {
      if (newPeriodType === periodType) return;

      // 设置切换标志
      isChangingPeriodType.current = true;

      // 构建缓存键 - 使用新周期类型的第一个选择器
      const selectors = generatePeriodSelectors(newPeriodType);
      const firstSelectorId = selectors.length > 0 ? selectors[0].id : "";
      const cacheKey = `${newPeriodType}_${viewMode}_${firstSelectorId}`;

      // 检查是否有缓存
      if (reportDataCache.current[cacheKey]) {
        // 有缓存，先更新周期类型，但不立即更新UI
        // 使用批量更新，确保UI一次性更新，避免闪烁
        setTimeout(() => {
          // 批量更新状态，避免中间状态导致的闪烁
          setPeriodType(newPeriodType);
          setSelectedPeriodId(firstSelectorId);
          setReportData(reportDataCache.current[cacheKey]);
        }, 0);
      } else {
        // 无缓存，先更新周期类型，然后触发加载
        setPeriodType(newPeriodType);
        setSelectedPeriodId("");
      }

      // 延迟重置切换标志
      setTimeout(() => {
        isChangingPeriodType.current = false;
      }, 300);
    },
    [periodType, viewMode]
  );

  // 处理选定周期变化
  const handlePeriodChange = useCallback(
    (periodId: string) => {
      if (periodId === selectedPeriodId) return;
      setSelectedPeriodId(periodId);

      // 构建缓存键
      const cacheKey = `${periodType}_${viewMode}_${periodId}`;

      // 检查是否有缓存
      if (reportDataCache.current[cacheKey]) {
        // 有缓存，立即更新数据
        setReportData(reportDataCache.current[cacheKey]);
      }
      // 无论是否有缓存，都在后台加载最新数据
      loadReportData(false);
    },
    [selectedPeriodId, periodType, viewMode, loadReportData]
  );

  // 当数据版本变化时，强制刷新报表
  useEffect(() => {
    // 避免初始加载或空数据版本
    if (!dataVersion) return;

    // 避免重复处理相同的数据版本
    if (processedDataVersionRef.current === dataVersion) {
      console.log("相同数据版本，跳过刷新:", dataVersion);
      return;
    }

    // 避免初始加载和正在加载时触发
    if (isLoadingRef.current) {
      console.log("正在加载中，暂存数据版本:", dataVersion);
      processedDataVersionRef.current = dataVersion;
      return;
    }

    console.log("数据版本变化，强制刷新报表:", dataVersion);
    processedDataVersionRef.current = dataVersion;

    // 数据变化时，清空缓存以确保获取最新数据
    reportDataCache.current = {};
    hasPreloadedRef.current = false; // 重置预加载标志
    loadReportData(true);

    // 预加载所有周期类型的数据
    setTimeout(() => {
      preloadAllPeriodTypes();
    }, 1000);
  }, [dataVersion, preloadAllPeriodTypes]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 加载状态保护机制 - 确保加载状态不会永远存在
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (loadingReport || loadingInBackground) {
      // 设置安全超时，最长10秒
      timer = setTimeout(() => {
        console.log("强制重置加载状态 - 安全机制触发");
        setLoadingReport(false);
        setLoadingInBackground(false);
        isLoadingRef.current = false;
      }, 10000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loadingReport, loadingInBackground]);

  // 手动刷新报表
  const refreshReport = useCallback(async () => {
    // 防止重复加载
    if (isLoadingRef.current) {
      console.log("已有刷新进行中，跳过");
      return;
    }

    try {
      // 清空缓存以确保获取最新数据
      reportDataCache.current = {};
      hasPreloadedRef.current = false; // 重置预加载标志

      // 强制刷新当前数据
      await loadReportData(true);

      // 预加载所有周期类型的数据
      setTimeout(() => {
        preloadAllPeriodTypes();
      }, 1000);
    } catch (error) {
      console.error("刷新报表数据失败:", error);
      setLoadingReport(false); // 确保重置加载状态
      isLoadingRef.current = false;
    }
  }, [loadReportData, preloadAllPeriodTypes]);

  return {
    periodType,
    setPeriodType,
    periodSelectors,
    selectedPeriodId,
    setSelectedPeriodId: handlePeriodChange,
    reportData,
    loadingReport,
    loadingInBackground,
    handlePeriodTypeChange,
    refreshReport,
    isChangingPeriodType: isChangingPeriodType.current,
  };
};
