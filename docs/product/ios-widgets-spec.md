# iOS Home-Screen Widgets – Requirements Specification

# iOS 桌面小组件需求规格说明书

## 1. Overview / 概述

We will deliver two WidgetKit widgets that extend MomiQ's core value—budget & expense awareness—to the iOS home screen.  
本迭代将开发两款基于 WidgetKit 的桌面小组件，把 MomiQ 的预算与支出洞察直接带到 iOS 主屏。

| #   | Widget                                     | 中文名称             | Purpose / 目的                                                                 |
| --- | ------------------------------------------ | -------------------- | ------------------------------------------------------------------------------ |
| 1   | Budget Summary (Weekly / Monthly / Yearly) | 周 / 月 / 年预算统计 | Show remaining budget, spending progress & alert state for the current period. |
| 2   | Total Spending Summary                     | 总支出统计           | Show cumulative spending (all categories) across a selectable period.          |

---

## 2. Functional Requirements / 功能需求

### 2.1 Budget Summary Widget

1. Display current period type (Week / Month / Year) automatically, or allow manual cycle selection via widget configuration.
2. Fields:  
   • Period label (e.g. "Week 42", "May 2025")  
   • Budget amount set by user  
   • Spent amount (bills + transactions)  
   • Remaining amount & percentage bar / ring  
   • Status color: Good (< 70 %), Warning (70 – 90 %), Danger (≥ 90 %)
3. Tapping opens the MomiQ home screen filtered to the same period.
4. Handles edge cases: budget not set, no data, offline.

### 2.2 Total Spending Summary Widget

1. Configurable period: Today / This Week / This Month / This Year.
2. Fields:  
   • Period label  
   • Total spent amount  
   • YOY delta indicator (optional, stretch)
3. Tapping opens the "Reports" tab pre-filtered to the same period.

---

## 3. Data Requirements / 数据需求

| Source       | API / Store              | Notes                                       |
| ------------ | ------------------------ | ------------------------------------------- |
| Bills        | `useData().bills`        | Filter by created_at within selected period |
| Transactions | `useData().transactions` | Same filtering rules                        |
| Budgets      | `useBudgets()`           | For widget #1 only                          |

Data must be exposed to the iOS extension via App Group shared storage or `WidgetCenter.reloadAllTimelines()` triggers from the Expo side.

---

## 4. UI / UX Guidelines

| Aspect     | Budget Summary                    | Total Spending               |
| ---------- | --------------------------------- | ---------------------------- |
| Small (S)  | Circular ring + two-line text     | Large number + label         |
| Medium (M) | Horizontal progress bar + 2 stats | Two rows (spent + YOY arrow) |
| Large (L)  | Bar + category breakdown (top 3)  | Trend mini-chart (sparkline) |

Design language must follow Tamagui / NativeWind color palette and respect iOS dark/light modes.

---

## 5. Widget Configuration & States / 配置与状态

1. Configuration Sheet:  
   • Period selection (if manual)  
   • Currency (inherits app setting)
2. States: Loading, Empty (no data), Normal, Warning, Danger.
3. Accessibility: VoiceOver labels for progress and amounts.

---

## 6. Technical Constraints / 技术实现

| Item         | Detail                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Technology   | SwiftUI + WidgetKit extension inside `ios/` folder (managed workflow)                                             |
| Data Bridge  | Expo Config Plugin `with-app-intents-quick-bill` (reuse App Group)                                                |
| Refresh Rate | System-managed ≤ 15 min; manual `WidgetCenter.shared.reloadTimelines` when app foregrounds or data sync completes |
| Minimum iOS  | 16.0 (WidgetKit v2)                                                                                               |
| Localization | EN / ZH (initial), extendable via i18n files                                                                      |

---

## 7. Non-Functional Requirements / 非功能性

1. Performance: Timeline rendering ≤ 50 ms.
2. Battery: Avoid frequent background fetch; rely on timeline snapshots.
3. Security: Store only aggregated numbers in App Group, not raw transactions.
4. Privacy: Follow App Tracking Transparency; no personal data displayed.

---

## 8. Acceptance Criteria / 验收标准

- [ ] Widget displays correct data for mocked scenarios (unit tests).
- [ ] Switching periods in config updates values within 1 sec.
- [ ] Colors match status thresholds exactly.
- [ ] Tap routing opens correct screen & parameters.
- [ ] Supports light/dark mode and dynamic type.
- [ ] Localized strings pass i18n review.

---

## 9. Timeline / 里程碑

| Phase                | Dates              | Deliverables                       |
| -------------------- | ------------------ | ---------------------------------- |
| Design & Spec        | T + 0 ~ T + 2 days | Final Figma, spec sign-off         |
| Data Bridge POC      | T + 3 ~ T + 5      | Shared storage, mock widget feeds  |
| Implementation       | T + 6 ~ T + 12     | SwiftUI views, logic, localization |
| QA & Review          | T + 13 ~ T + 15    | Test cases, regression             |
| App Store Compliance | T + 16             | Updated screenshots & metadata     |

---

## 10. Open Issues / 待解决

1. How to reconcile widget refresh with existing remote sync throttling?
2. Confirm YOY comparison data availability for Widget #2.
3. Decide default period behavior when no budget is set.

---

_Document version 0.9 – 2025-06-19_
