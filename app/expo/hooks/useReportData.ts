import { useCallback, useEffect, useState, useRef } from "react";
import {
  DatePeriodEnum,
  PeriodSelectorData,
  ReportData,
  BudgetReportData,
} from "@/types/reports.types";
import { fetchReportData, fetchBudgetReportData } from "@/utils/reports.utils";
import { generatePeriodSelectors } from "@/utils/date.utils";
import { useData } from "@/providers/DataProvider";
import { InteractionManager } from "react-native";

export const useReportData = (
  viewMode: "personal" | "family",
  initialPeriodType: DatePeriodEnum = DatePeriodEnum.WEEK
) => {
  const { dataVersion } = useData();
  const [periodType, setPeriodType] =
    useState<DatePeriodEnum>(initialPeriodType);
  const [periodSelectors, setPeriodSelectors] = useState<PeriodSelectorData[]>(
    []
  );
  // Initialise selectedPeriodId to the first selector of the initial period to
  // ensure the very first loadReportData() call uses a stable id and matches
  // later pre-load calls, preventing double computation for the same period.
  const initialSelectorId =
    generatePeriodSelectors(initialPeriodType)[0]?.id ?? "";
  const [selectedPeriodId, setSelectedPeriodId] =
    useState<string>(initialSelectorId);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  // 跟踪组件是否已挂载
  const isMounted = useRef<boolean>(true);
  // 防止递归加载
  const isLoadingRef = useRef<boolean>(false);
  // 用于防止老旧请求覆盖新数据的递增 ID
  const requestIdRef = useRef<number>(0);

  // 初始化周期选择器
  useEffect(() => {
    setPeriodSelectors(generatePeriodSelectors(periodType));
  }, [periodType]);

  // 加载报表数据，带loading状态
  const loadReportData = useCallback(
    async (forceRefresh = false) => {
      // 防止重复加载；若 forceRefresh 为 true 则允许在加载中强制刷新
      if (isLoadingRef.current && !forceRefresh) return;

      isLoadingRef.current = true;
      setLoadingReport(true);

      try {
        // 记录此次请求编号
        const currentRequestId = ++requestIdRef.current;

        const data = await fetchReportData(
          periodType,
          viewMode,
          selectedPeriodId,
          dataVersion,
          forceRefresh
        );

        // 仅当该请求仍然是最新时才更新状态，避免旧请求覆盖新数据
        if (isMounted.current && currentRequestId === requestIdRef.current) {
          setReportData(data);
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        // 确保在任何情况下都重置加载状态
        if (isMounted.current) {
          setLoadingReport(false);
        }
        isLoadingRef.current = false;
      }
    },
    [periodType, viewMode, selectedPeriodId, dataVersion]
  );

  // 初始加载和数据变化时的重新加载
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // 处理周期类型变化
  const handlePeriodTypeChange = useCallback(
    (newPeriodType: DatePeriodEnum) => {
      if (newPeriodType === periodType) return;

      const selectors = generatePeriodSelectors(newPeriodType);
      const firstSelectorId = selectors.length > 0 ? selectors[0].id : "";
      setPeriodType(newPeriodType);
      setSelectedPeriodId(firstSelectorId);
    },
    [periodType]
  );

  // 处理选定周期变化
  const handlePeriodChange = useCallback(
    (periodId: string) => {
      if (periodId === selectedPeriodId) return;
      setSelectedPeriodId(periodId);
    },
    [selectedPeriodId]
  );

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 手动刷新报表
  const refreshReport = useCallback(async () => {
    await loadReportData(true);
  }, [loadReportData]);

  return {
    periodType,
    setPeriodType,
    periodSelectors,
    selectedPeriodId,
    setSelectedPeriodId: handlePeriodChange,
    reportData,
    loadingReport,
    handlePeriodTypeChange,
    refreshReport,
    isChangingPeriodType: false,
  };
};

// 新的拆分报表 Hook
export const useSplitReportData = (
  viewMode: "personal" | "family",
  initialPeriodType: DatePeriodEnum = DatePeriodEnum.WEEK
) => {
  const { dataVersion, budgetVersion } = useData();
  const [periodType, setPeriodType] =
    useState<DatePeriodEnum>(initialPeriodType);
  const [periodSelectors, setPeriodSelectors] = useState<PeriodSelectorData[]>(
    []
  );

  const initialSelectorId =
    generatePeriodSelectors(initialPeriodType)[0]?.id ?? "";
  const [selectedPeriodId, setSelectedPeriodId] =
    useState<string>(initialSelectorId);

  const [coreReport, setCoreReport] = useState<ReportData | null>(null);
  const [budgetReport, setBudgetReport] = useState<BudgetReportData | null>(
    null
  );
  const [loadingCore, setLoadingCore] = useState<boolean>(false);
  const [loadingBudget, setLoadingBudget] = useState<boolean>(false);

  const isMounted = useRef<boolean>(true);
  const coreRequestIdRef = useRef<number>(0);
  const budgetRequestIdRef = useRef<number>(0);

  // 初始化周期选择器
  useEffect(() => {
    setPeriodSelectors(generatePeriodSelectors(periodType));
  }, [periodType]);

  // 加载核心报表数据
  const loadCoreReport = useCallback(
    async (forceRefresh = false) => {
      setLoadingCore(true);
      const currentRequestId = ++coreRequestIdRef.current;

      try {
        const data = await fetchReportData(
          periodType,
          viewMode,
          selectedPeriodId,
          dataVersion,
          forceRefresh,
          /* lightweight = */ !forceRefresh
        );

        if (
          isMounted.current &&
          currentRequestId === coreRequestIdRef.current
        ) {
          setCoreReport(data);
        }
      } catch (error) {
        console.error("Error fetching core report data:", error);
      } finally {
        if (isMounted.current) {
          setLoadingCore(false);
        }
      }
    },
    [periodType, viewMode, selectedPeriodId, dataVersion]
  );

  // 加载预算报表数据
  const loadBudgetReport = useCallback(
    async (forceRefresh = false) => {
      setLoadingBudget(true);
      const currentRequestId = ++budgetRequestIdRef.current;

      try {
        const data = await fetchBudgetReportData(
          periodType,
          viewMode,
          selectedPeriodId,
          budgetVersion,
          forceRefresh
        );

        if (
          isMounted.current &&
          currentRequestId === budgetRequestIdRef.current
        ) {
          setBudgetReport(data);
        }
      } catch (error) {
        console.error("Error fetching budget report data:", error);
      } finally {
        if (isMounted.current) {
          setLoadingBudget(false);
        }
      }
    },
    [periodType, viewMode, selectedPeriodId, budgetVersion]
  );

  // 核心报表数据变化时重新加载
  useEffect(() => {
    loadCoreReport();
  }, [loadCoreReport]);

  // 预算版本变化或核心报表更新时重新加载预算报表
  useEffect(() => {
    loadBudgetReport();
  }, [loadBudgetReport]);

  // 刷新函数
  const refreshCoreReport = useCallback(async () => {
    await loadCoreReport(true);
  }, [loadCoreReport]);

  const refreshBudgetReport = useCallback(async () => {
    await loadBudgetReport(true);
  }, [loadBudgetReport]);

  const refreshBothReports = useCallback(async () => {
    await Promise.all([refreshCoreReport(), refreshBudgetReport()]);
  }, [refreshCoreReport, refreshBudgetReport]);

  // 周期处理函数
  const handlePeriodTypeChange = useCallback(
    (newPeriodType: DatePeriodEnum) => {
      if (newPeriodType === periodType) return;

      const selectors = generatePeriodSelectors(newPeriodType);
      const firstSelectorId = selectors.length > 0 ? selectors[0].id : "";
      setPeriodType(newPeriodType);
      setSelectedPeriodId(firstSelectorId);
    },
    [periodType]
  );

  const handlePeriodChange = useCallback(
    (periodId: string) => {
      if (periodId === selectedPeriodId) return;
      setSelectedPeriodId(periodId);
    },
    [selectedPeriodId]
  );

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    periodType,
    setPeriodType,
    periodSelectors,
    selectedPeriodId,
    setSelectedPeriodId: handlePeriodChange,
    coreReport,
    budgetReport,
    loadingCore,
    loadingBudget,
    handlePeriodTypeChange,
    refreshCoreReport,
    refreshBudgetReport,
    refreshBothReports,
  };
};
