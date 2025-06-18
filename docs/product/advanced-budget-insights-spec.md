# Advanced Budget Insights (ABI) – Requirement Specification

## 0. Glossary

• **ABI** – Advanced Budget Insights module.  
• **Health Score Gauge** – semi-circular chart showing 0-100 score.  
• **Insight Deck** – horizontally swipeable cards, each one an insight.  
• **Refresh Button** – ⟳ icon + text "Refresh insights" at top-right of ABI block.

## 1. Objective

Provide users with actionable, data-driven spending advice, an explicit financial-health score, and rich insight cards, while supporting offline usage and smart caching that refreshes once per day or whenever the user taps the refresh button.

## 2. Scope

• **Frontend**: `BudgetInsightsPanel` component, new hook `useAbiReport`, offline banner, refresh button.  
• **Backend**: Next.js route `/api/v1/reports/insights`.  
• **Data storage**: secure local cache of last ABI blob.  
• **i18n, accessibility, analytics**.

## 3. Functional Requirements (FR)

FR-01 **Data Generation Interval**  
 a) Server stamps each response with `generatedAt` (ISO-8601).  
 b) App treats data as stale at next local calendar day (00:00), or when the user taps refresh.

FR-02 **Manual Refresh**  
 • A refresh button appears inside ABI header.  
 • Button disabled & shows spinner while fetching.  
 • Other parts of _ReportsScreen_ keep existing pull-to-refresh behaviour for their own datasets.

FR-03 **Offline Handling**  
 • Detect connectivity via `@react-native-community/netinfo`.  
 • If offline, display red banner: "Offline – showing cached insights from <date>".  
 • Refresh button is disabled while offline.  
 • If no cache exists, show dedicated empty-state illustration + "Retry" (disabled until online).

FR-04 **Health Score v2**  
 • Range 0-100, status buckets: Good (≥70), Warning (40-69), Danger (<40).  
 • Weighted metrics: budget usage 40 %, spending volatility 30 %, savings rate 20 %, recurring-cover days 10 %.

FR-05 **Insight Categories**  
 • Overspent Budgets, Under-utilised Budgets, Spending Volatility, Savings Opportunities, Upcoming Recurring Bills, 7-day Cash-flow Forecast.

FR-06 **Insight Fields**  
 `id`, `title`, `description`, `severity` (info|warn|critical), `recommendedAction`.

FR-07 **Advice Carousel**  
 • For every _warn_ / _critical_ insight show a concise tip (≤140 chars) in a carousel beneath the Insight Deck.

FR-08 **Localisation & Accessibility**  
 • All strings routed through i18n.  
 • Charts provide text alternatives. Colour choices pass WCAG AA.

## 4. Non-Functional Requirements (NFR)

NFR-01 **Performance**: server generation < 600 ms for 12-month dataset; client render < 100 ms on mid-range phone.  
NFR-02 **Security**: JWT auth, rate-limit 30 req/min/user.  
NFR-03 **Telemetry**: log generation time, record counts, client fetch latency.

## 5. Data Model (TypeScript)

```ts
export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warn" | "critical";
  recommendedAction?: string;
}

export interface HealthScore {
  score: number;
  status: "Good" | "Warning" | "Danger";
  metrics: {
    budgetUsagePct: number;
    volatilityPct: number;
    savingsRatePct: number;
    recurringCoverDays: number;
  };
}

export interface AbiReport {
  generatedAt: string; // ISO-8601
  healthScore: HealthScore;
  insights: Insight[];
}
```

## 6. API Specification

• **Method**: GET  
• **URL**: `/api/v1/reports/insights?period=weekly|monthly|yearly&date=YYYY-MM-DD`  
• **Headers**: `Authorization: Bearer <JWT>`  
• **Success 200**: body = `AbiReport` JSON.  
• **Error** 401, 429, 500 as appropriate.  
• Optional `force=true` query param for bypassing cache (admin/debug only).

## 7. UI / UX Wire Description

```
|────────────────────────────────────────────|
|    "Refresh insights"   ⟳  (button)        |
|                                            |
|   [Health Score Gauge 0-100]               |
|                                            |
|   Donut of Spend vs Budget (existing)      |
|   ──────────────────────────────           |
|   ‹ Swipe ›  [ Insight Card 1 ] [Card 2]   |
|                                            |
|   Carousel of concise tips (dots)          |
|────────────────────────────────────────────|
```

• Refresh button placed in a `YStack` alignment="right".  
• Offline banner sits above the panel, spans full width.

## 8. Caching & Offline Logic (Client)

• Store last ABI blob in `storage.utils` under key `abi:<period>:<periodId>`.  
• On mount or when Refresh pressed:  
 a) If offline → read cache, mark `isStale=true`.  
 b) If online → call API; on success overwrite cache.  
• Stale determination: compare `generatedAt` with today's date.

## 9. Error Handling

• API errors show non-blocking toast ("Couldn't update insights").  
• Parsing errors fall back to empty-state card.

## 10. Localisation Keys (examples)

```
"abi_refresh": "Refresh insights",
"abi_offline_banner": "Offline – showing cached insights from {{date}}",
"abi_empty_title": "No insights available",
"abi_empty_desc": "Connect to the internet and try again.",
```

## 11. Accessibility

• Gauge: add `accessibilityRole="adjustable"` and `accessibilityValue={{text: "Health score 75 good"}}`.  
• Cards: `aria-level` headings.

## 12. Test Plan

Unit: metric calculations, staleness, hook state transitions.  
Integration: end-to-end happy path, offline path, refresh error path using mocked server.  
E2E (Detox): toggle Airplane Mode, tap refresh button, assert banner & disabled state.

## 13. Roll-out Steps

1. Create types + utils (`insight.utils.ts`).
2. Implement backend route with caching layer (e.g., KV or Redis).
3. Add `useAbiReport` hook (`react-query` preferred).
4. Refactor `BudgetInsightsPanel` with new props/UI.
5. Insert Refresh button & offline banner into `ReportsScreen`.
6. Update i18n files & add illustration asset.
7. QA & accessibility audit.
8. Deploy serverless function; release new Expo version.

## 14. 2025-06-18 Enhancements (Health Score v2 & Insight Sections)

### 14.1 Health Score v2

- Algorithm (backend, no LLM) – four weighted metrics (Budget 40 %, Volatility 30 %, Savings 20 %, Recurring Cover 10 %).
- New data schema `HealthScoreDetail`:

```ts
interface HealthScoreDetail {
  score: number; // 0-100
  status: "Good" | "Warning" | "Danger";
  subScores: {
    budget: { pct: number; deduction: number };
    volatility: { pct: number; deduction: number };
    savings: { pct: number; deduction: number };
    recurring: { days: number; deduction: number };
  };
  tips?: { metric: string; advice: string }[]; // Gemini-generated improvement tips
}
```

- Gemini prompt now receives `healthScoreDetail` and must return `tips`.
- Front-end visual: semi-circle gauge + coloured `MetricChip`s + Tips carousel + details modal (metric formulas & deductions).

### 14.2 Insight Section List

- `Insight` gains fields `severity`, `recommendedAction`, `theme`.
- Front-end groups insights by `theme` and renders Section headers with icons.

### 14.3 New UI Components

- `MetricChip` – colour-coded pill for each metric.
- `HealthTipsCarousel` – horizontal list of improvement tips.
- `HealthScoreModal` – slide-up modal listing sub-score details and formulas.

### 14.4 API contract changes

- `/api/reports/insights` now returns:

```ts
interface AbiReport {
  generatedAt: string;
  healthScore: HealthScoreDetail;
  insights: AbiInsight[];
}
```

- Existing clients must read `healthScore.subScores.*` instead of prior `metrics`.

### 14.5 Front-end integration

1. Generate bill summary → POST to `/insights` → receive new structure.
2. Map `insights` directly; map `healthScore` to `FinancialHealthScore`.
3. `BudgetInsightsPanel` replaced simple list with `InsightsSectionList`.

> These changes have been implemented in code (June 18 commits).
