import { BillSummaryInput } from "@/utils/abi-summary.utils";
import { HealthScoreDetail } from "@/types/reports.types";

// Compute health score locally using same weightings as server
export function computeHealthScore(
  summary: BillSummaryInput
): HealthScoreDetail {
  const budgetUsagePct = summary.budgetUtilisation?.usagePct ?? 0;
  const volatilityPct = summary.volatility?.volatilityPct ?? 0;
  const recurringCoverDays = summary.recurring?.recurringCoverDays ?? 0;

  // Deduction weights (same as server side)
  const budgetDed = budgetUsagePct * 0.4;
  const volDed = volatilityPct * 0.3;
  const recDed = Math.max(0, 70 - recurringCoverDays) * 0.1;

  const score = Math.round(100 - (budgetDed + volDed + recDed));
  const status: "Good" | "Warning" | "Danger" =
    score >= 70 ? "Good" : score >= 40 ? "Warning" : "Danger";

  return {
    score,
    status,
    subScores: {
      budget: {
        pct: Math.round(budgetUsagePct),
        deduction: Math.round(budgetDed),
      },
      volatility: {
        pct: Math.round(volatilityPct),
        deduction: Math.round(volDed),
      },
      // Savings omitted in local computation
      recurring: {
        days: Math.round(recurringCoverDays),
        deduction: Math.round(recDed),
      },
    },
  } as any;
}
