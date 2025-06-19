import { useEffect } from "react";
import { useData } from "@/providers/DataProvider";
import { useBudgets } from "@/hooks/useBudgets";
import { summariseBills, BillSummaryInput } from "@/utils/abi-summary.utils";
import { DatePeriodEnum } from "@/types/reports.types";
import { fetchAbiReport } from "@/hooks/reports/useAbiReport";
import { Message, chatAPI } from "@/utils/api";
import i18n from "@/i18n";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

interface UseFinancialInsightsProps {
  periodParam?: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsThinking: (v: boolean) => void;
  scrollToBottom: () => void;
  isMessageLoading: boolean;
  ts?: string;
}

// Util: Build bill summary on-demand using the latest bills & budgets
const buildBillSummary = (
  bills: Parameters<typeof summariseBills>[0],
  budgets: Parameters<typeof summariseBills>[1],
  periodParam: string
) => {
  const today = new Date();
  let periodType: DatePeriodEnum;
  let start: Date;
  let end: Date;

  if (periodParam === "week") {
    periodType = DatePeriodEnum.WEEK;
    start = startOfWeek(today, { weekStartsOn: 1 });
    end = endOfWeek(today, { weekStartsOn: 1 });
  } else if (periodParam === "month") {
    periodType = DatePeriodEnum.MONTH;
    start = startOfMonth(today);
    end = endOfMonth(today);
  } else {
    periodType = DatePeriodEnum.YEAR;
    start = startOfYear(today);
    end = endOfYear(today);
  }

  return summariseBills(bills, budgets, periodType, start, end);
};

export const useFinancialInsights = ({
  isMessageLoading,
  ts,
  periodParam,
  setMessages,
  setIsThinking,
  scrollToBottom,
}: UseFinancialInsightsProps) => {
  const { bills } = useData();
  const { budgets } = useBudgets();

  const handleExec = async () => {
    if (!periodParam) return;
    const billSummary: BillSummaryInput = buildBillSummary(
      bills,
      budgets,
      periodParam
    );
    try {
      const report = await fetchAbiReport(billSummary);
      const aiMsg = chatAPI.createMessage("", false, "text", {
        type: "financial_insights",
        period: periodParam,
        insights: report.insights || [],
      });
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      const errMsg = chatAPI.createMessage(
        i18n.t("⚠️ Failed to fetch insights: {{message}}", {
          message: err?.message,
        }),
        false,
        "text",
        { type: "system_error" }
      );
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  // Insert AI reply or error once the report is ready
  useEffect(() => {
    if (
      !periodParam ||
      !["week", "month", "year"].includes(periodParam) ||
      isMessageLoading
    )
      return;
    const userMsg = chatAPI.createMessage(
      i18n.t("Show me my {{period}} financial insights", {
        period: i18n.t(periodParam),
      }),
      true,
      "cmd"
    );
    setIsThinking(true);
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(scrollToBottom, 50);
    handleExec();
  }, [ts, periodParam, isMessageLoading]);
};
