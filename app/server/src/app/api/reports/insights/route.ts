import { NextResponse } from "next/server";
import { uuid } from "uuidv4";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Supported language fallback map (ISO 639-1)
const SUPPORTED_LANG = ["en", "zh", "es"] as const;
type Lang = (typeof SUPPORTED_LANG)[number];

// ---------------- Types -----------------
interface BillSummaryInput {
  period: "weekly" | "monthly" | "yearly";
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  // aggregated figures to keep prompt small
  coreTotals?: {
    totalExpense: number;
    totalIncome?: number;
    prevExpense?: number;
    prevIncome?: number;
    expenseQoQ?: number;
    incomeQoQ?: number;
  };
  // legacy flat fields (deprecated)
  totalIncome?: number;
  totalExpense?: number;
  categoryTotals: { category: string; amount: number; budget?: number }[];
  // dailyExpenses kept for backward compatibility
  dailyExpenses?: number[]; // deprecated – use volatility.dailyExpenses
  recurringCoverDays?: number; // optional pre-computed metric
  budgetUtilisation?: {
    overallBudget?: number;
    usagePct?: number;
    categoryUtil?: {
      category: string;
      amount: number;
      budget?: number;
      usagePct?: number;
    }[];
  };
  volatility?: {
    dailyExpenses: number[];
    volatilityPct?: number;
    dailyStats?: {
      mean: number;
      median: number;
      max: number;
      min: number;
      p90: number;
    };
    topSpendDays?: { date: string; amount: number }[];
  };
}

interface AbiInsight {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warn" | "critical";
  recommendedAction?: string;
}

interface HealthScoreSubBudget {
  pct: number;
  deduction: number;
}

interface HealthScoreSubRecurring {
  days: number;
  deduction: number;
}

interface AbiHealthScore {
  score: number;
  status: "Good" | "Warning" | "Danger";
  subScores: {
    budget: HealthScoreSubBudget;
    volatility: HealthScoreSubBudget;
    savings: HealthScoreSubBudget;
    recurring: HealthScoreSubRecurring;
  };
  tips?: { metric: string; advice: string }[];
}

interface AbiReport {
  generatedAt: string;
  healthScore: AbiHealthScore;
  insights: AbiInsight[];
}

// ---------------- GenAI setup ----------------
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}
const ai = new GoogleGenAI({ apiKey });

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// -------------- Helper functions -------------

function calcVolatility(daily: number[]): number {
  if (daily.length === 0) return 0;
  const mean = daily.reduce((s, v) => s + v, 0) / daily.length;
  const variance =
    daily.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / daily.length;
  const std = Math.sqrt(variance);
  return mean === 0 ? 0 : (std / mean) * 100;
}

function buildPrompt(summary: BillSummaryInput, lang: Lang): string {
  return `You are "MomiQ Insight Engine", an experienced CFA-level personal-finance analyst. Use the provided JSON summary to produce UP TO 6 highly actionable insights.

Respond ONLY in the user's language: ${lang}. All titles, descriptions and recommendedAction must be written in this language with clear, concise wording.

Data you can rely on (keys may be undefined when not available):
• coreTotals.totalExpense / totalIncome  – current period totals.
• coreTotals.prevExpense / prevIncome   – previous period totals.
• coreTotals.expenseQoQ / incomeQoQ    – quarter-on-quarter % change.
• budgetUtilisation.overallBudget & usagePct – overall budget coverage.
• budgetUtilisation.categoryUtil[]      – per-category amount, budget, usagePct.
• volatility.dailyStats (mean / median / p90 / max / min) & volatilityPct.
• volatility.topSpendDays[]             – three highest spending dates.
• categoryMomentum[]                    – categories with biggest ↑↓ vs prev period.
• recurring.recurringCoverDays          – how many days cash can cover recurring bills.

INSIGHT RULES:
1. Each insight must be mapped to one of these themes: "overspend", "underutilised_budget", "volatility", "momentum", "savings_opportunity", "recurring_risk", "cashflow".
2. title ≤ 60 chars; description ≤ 120 chars.
3. severity guideline:
   • critical – situation threatens financial health (e.g. usagePct ≥ 90%, expenseQoQ > 40%).
   • warn     – notable but not severe (usagePct 70-90%, QoQ 15-40%, volatilityPct > 50). 
   • info     – general tips or positive observations.
4. Provide recommendedAction where user can directly improve (e.g. "Set lower dining budget", "Schedule recurring bill alert").

Respond ONLY with raw JSON in this exact envelope:
{ "insights": AbiInsight[] }

interface AbiInsight { id:string; title:string; description:string; severity:"info"|"warn"|"critical"; recommendedAction?:string }

Do NOT output markdown or code fences.

summary:\n${JSON.stringify(summary)}\n`;
}

// -------------- Main handler ---------------

export async function POST(req: Request) {
  try {
    const summary = (await req.json()) as BillSummaryInput;

    // Determine preferred language via Accept-Language header or fallback
    const acceptLang = req.headers.get("accept-language") || "en";
    const primaryLang = acceptLang.split(",")[0].split("-")[0];
    const lang: Lang = SUPPORTED_LANG.includes(primaryLang as Lang)
      ? (primaryLang as Lang)
      : "en";

    // ---- Sanity checks & fallbacks for optional or missing data ----
    const categoryTotalsSafe = Array.isArray(summary.categoryTotals)
      ? summary.categoryTotals
      : [];
    const dailyExpensesSafe = Array.isArray(summary.volatility?.dailyExpenses)
      ? summary.volatility?.dailyExpenses
      : summary.dailyExpenses && Array.isArray(summary.dailyExpenses)
        ? summary.dailyExpenses
        : [];

    // ----- Basic metric calculations on server (lightweight) -----
    // Prefer the overallBudget value if provided by the client summary.
    // Fallback to summing per-category budgets (legacy behaviour).
    const overallBudget = summary.budgetUtilisation?.overallBudget;

    const perCategoryBudgetTotal = categoryTotalsSafe
      .filter((c) => c.budget != null)
      .reduce((s, c) => s + (c.budget || 0), 0);

    const totalBudgeted =
      overallBudget != null && overallBudget > 0
        ? overallBudget
        : perCategoryBudgetTotal;

    const expenseTotal =
      (summary.totalExpense ?? summary.coreTotals?.totalExpense) || 0;

    const incomeTotal = summary.totalIncome ?? summary.coreTotals?.totalIncome;

    const budgetUsagePct =
      totalBudgeted > 0 ? (expenseTotal / totalBudgeted) * 100 : 0;

    const volatilityPct = calcVolatility(dailyExpensesSafe);

    const savingsRatePct = incomeTotal
      ? ((incomeTotal - expenseTotal) / incomeTotal) * 100
      : undefined;

    const recurringCoverDays = summary.recurringCoverDays ?? 0;

    const budgetDed = budgetUsagePct * 0.4;
    const volDed = volatilityPct * 0.3;
    const savDed = savingsRatePct != null ? (100 - savingsRatePct) * 0.2 : 0;
    const recDed = Math.max(0, 70 - recurringCoverDays) * 0.1; // simple scale

    const score = Math.round(100 - (budgetDed + volDed + savDed + recDed));
    const status = score >= 70 ? "Good" : score >= 40 ? "Warning" : "Danger";

    const healthDetail = {
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
        ...(savingsRatePct != null
          ? {
              savings: {
                pct: Math.round(savingsRatePct),
                deduction: Math.round(savDed),
              },
            }
          : {}),
        recurring: {
          days: Math.round(recurringCoverDays),
          deduction: Math.round(recDed),
        },
      },
    } as const;

    // ----- Gemini call for insights -----
    const generationConfig = {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 8192,
      safetySettings,
      responseMimeType: "text/plain",
    } as const;

    const prompt = buildPrompt(
      {
        ...(summary as any),
        healthScoreDetail: healthDetail,
      },
      lang
    );

    const genRes = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: generationConfig,
    });

    const text = (
      genRes.candidates?.[0]?.content?.parts?.[0]?.text || ""
    ).trim();

    // try parse JSON
    let insights: AbiInsight[] | null = null;
    try {
      const parsed = JSON.parse(text);
      insights = parsed.insights as AbiInsight[];
    } catch (err) {
      console.error("[ABI] Gemini output not JSON", text);
    }

    // Fallback if parsing failed
    if (!insights || !Array.isArray(insights)) {
      insights = [
        {
          id: uuid(),
          title: "Unable to generate insights",
          description: "AI response could not be parsed.",
          severity: "info",
        },
      ];
    }

    // if tips returned merge
    let tips: any[] | undefined;
    if (
      insights &&
      (genRes as any).candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      try {
        const parsed = JSON.parse(text);
        tips = parsed.tips;
      } catch {}
    }

    const report: AbiReport = {
      generatedAt: new Date().toISOString(),
      healthScore: { ...healthDetail, tips } as any,
      insights,
    };

    return NextResponse.json(report);
  } catch (err) {
    console.error("[ABI] Error generating insights", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
