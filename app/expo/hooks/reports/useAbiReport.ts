import { useEffect, useState, useCallback } from "react";
import { storage } from "@/utils/storage.utils";
import { AbiReport } from "@/types/reports.types";
import { BillSummaryInput } from "@/utils/abi-summary.utils";
import { REPORT_API } from "@/utils/api.config";
import i18n from "@/i18n";

interface UseAbiReportOptions {
  summary: BillSummaryInput;
}

interface AbiState {
  data: AbiReport | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
}

const buildStorageKey = (summary: BillSummaryInput) =>
  // Include a simple hash of expense to invalidate cache when spending changes within the same day
  `abi:${summary.period}:${summary.startDate || "unknown"}:exp${Math.round(
    summary.coreTotals.totalExpense || 0
  )}`;

const isSameDay = (isoDate: string) => {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

export const useAbiReport = ({ summary }: UseAbiReportOptions) => {
  const [state, setState] = useState<AbiState>({
    data: null,
    loading: true,
    error: null,
    isStale: false,
  });

  const key = buildStorageKey(summary);

  // If summary data incomplete (e.g., empty startDate), skip API call
  const isSummaryReady = summary.startDate && summary.endDate;

  const fetchRemote = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(REPORT_API.getFinancialInsights, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": i18n.language || "en",
        },
        body: JSON.stringify(summary),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AbiReport = await res.json();
      // cache
      await storage.setItem<AbiReport>(key, json);
      setState({ data: json, loading: false, error: null, isStale: false });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }));
    }
  }, [key, summary]);

  // initial load
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!isSummaryReady) {
        // Don't fetch when summary not ready
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }
      // Try cache first
      const cached = await storage.getItem<AbiReport>(key);
      if (cached) {
        const stale = !isSameDay(cached.generatedAt);
        if (!cancelled) {
          setState({
            data: cached,
            loading: stale, // if stale, show spinner while fetching
            error: null,
            isStale: stale,
          });
        }
        if (stale) await fetchRemote();
      } else {
        await fetchRemote();
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [key, fetchRemote, isSummaryReady]);

  const refresh = useCallback(async () => {
    if (isSummaryReady) {
      await fetchRemote();
    }
  }, [fetchRemote, isSummaryReady]);

  return { ...state, refresh };
};
