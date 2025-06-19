import { useCallback, useEffect, useState } from "react";
import {
  DatePeriodEnum,
  PeriodSelectorData,
  ReportData,
} from "@/types/reports.types";
import { fetchReportData } from "@/utils/reports.utils";

export const useReportData = (viewMode: "personal" | "family") => {
  const [periodType, setPeriodType] = useState<DatePeriodEnum>(
    DatePeriodEnum.WEEK
  );
  const [periodSelectors, setPeriodSelectors] = useState<PeriodSelectorData[]>(
    []
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(true);
  const onLoadReportData = async (onDone?: () => void) => {
    try {
      const data = await fetchReportData(
        periodType,
        viewMode,
        selectedPeriodId
      );
      setPeriodSelectors(data.periodSelectors || []);
      if (
        !selectedPeriodId &&
        data.periodSelectors &&
        data.periodSelectors.length > 0
      ) {
        setSelectedPeriodId(data.periodSelectors[0].id);
      }
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      onDone?.();
    }
  };

  const loadReportData = useCallback(async () => {
    setLoadingReport(true);
    await onLoadReportData(() => {
      setLoadingReport(false);
    });
  }, [periodType, viewMode, selectedPeriodId]);

  // Fetch on mount & when deps change
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handlePeriodTypeChange = (newPeriodType: DatePeriodEnum) => {
    setLoadingReport(true);
    setPeriodType(newPeriodType);
    setSelectedPeriodId("");
  };

  return {
    periodType,
    setPeriodType,
    periodSelectors,
    selectedPeriodId,
    setSelectedPeriodId,
    reportData,
    setReportData,
    loadingReport,
    handlePeriodTypeChange,
    loadReportData,
    onLoadReportData,
  };
};
