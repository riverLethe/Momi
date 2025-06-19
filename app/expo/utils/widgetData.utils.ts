import { NativeModules, Platform } from "react-native";

/**
 * Updates the iOS WidgetKit Total Spending widget with the latest numbers.
 *
 * On iOS this bridges to native code (`WidgetDataBridge`) which writes the
 * values to the shared App Group so the widget can read them. On Android or
 * web it is a no-op.
 *
 * @param total       Total spending amount for the selected period.
 * @param periodLabel Text that describes the period, e.g. "This Month".
 */
export interface SpendingCategory {
  /** Display name shown in the legend */
  name: string;
  /** Pre-formatted amount text (e.g., "¥120.00") */
  amountText: string;
  /** Share of total spending (0-1) */
  percent: number;
  /** Hex color used for the donut & legend */
  color: string;
}

export async function updateTotalSpendingWidget(
  totalText: string,
  periodLabel: string,
  categories: SpendingCategory[] = []
): Promise<void> {
  if (Platform.OS !== "ios") return;

  const bridge = NativeModules.WidgetDataBridge as
    | {
        updateSpendingStrings?(
          totalText: string,
          label: string,
          categoriesJson: string
        ): Promise<void>;
        updateSpendingStringsForPeriod?(
          period: string,
          totalText: string,
          label: string,
          categoriesJson: string
        ): Promise<void>;
      }
    | undefined;

  try {
    const catJson = JSON.stringify(categories);
    if (bridge?.updateSpendingStrings) {
      await bridge.updateSpendingStrings(totalText, periodLabel, catJson);
    } else {
      // Fallback: store raw values if new bridge not available
      console.warn("updateSpendingStrings not available in native module");
    }
  } catch (err) {
    console.warn("Failed to update Total Spending widget:", err);
  }
}

/**
 * Updates a period-specific Total Spending widget (week / month / year).
 *
 * @param periodKey   "week" | "month" | "year"
 * @param totalText   Pre-formatted total spending string.
 * @param periodLabel Label describing the period (e.g., "This Week").
 * @param categories  Category breakdown data.
 */
export async function updateSpendingWidgetForPeriod(
  periodKey: "week" | "month" | "year",
  totalText: string,
  periodLabel: string,
  categories: SpendingCategory[] = []
): Promise<void> {
  if (Platform.OS !== "ios") return;

  const bridge = NativeModules.WidgetDataBridge as
    | {
        updateSpendingStringsForPeriod?(
          period: string,
          totalText: string,
          label: string,
          categoriesJson: string
        ): Promise<void>;
      }
    | undefined;

  try {
    const catJson = JSON.stringify(categories);
    if (bridge?.updateSpendingStringsForPeriod) {
      await bridge.updateSpendingStringsForPeriod(
        periodKey,
        totalText,
        periodLabel,
        catJson
      );
    } else {
      // Fallback to legacy single-widget update
      await updateTotalSpendingWidget(totalText, periodLabel, categories);
    }
  } catch (err) {
    console.warn(`Failed to update ${periodKey} Total Spending widget:`, err);
  }
}

// ------------------------------- Budget Widgets -------------------------------

export interface BudgetSegment {
  name: string; // e.g., "Used" / "Remaining"
  amountText: string; // formatted like "¥2,019.04"
  percent: number; // 0-1
  color: string; // hex color
}

/**
 * Updates a period-specific Budget widget (week / month / year).
 * The bridge is provided by the native `WidgetBudgetDataBridge` module.
 */
export async function updateBudgetWidgetForPeriod(
  periodKey: "week" | "month" | "year",
  totalText: string,
  periodLabel: string,
  segments: BudgetSegment[] = []
): Promise<void> {
  if (Platform.OS !== "ios") return;

  const bridge = NativeModules.WidgetBudgetDataBridge as
    | {
        updateBudgetStringsForPeriod?(
          period: string,
          totalText: string,
          label: string,
          segmentsJson: string
        ): Promise<void>;
      }
    | undefined;

  try {
    const json = JSON.stringify(segments);
    if (bridge?.updateBudgetStringsForPeriod) {
      await bridge.updateBudgetStringsForPeriod(
        periodKey,
        totalText,
        periodLabel,
        json
      );
    } else {
      console.warn(
        "updateBudgetStringsForPeriod not available in WidgetBudgetDataBridge"
      );
    }
  } catch (err) {
    console.warn(`Failed to update ${periodKey} Budget widget:`, err);
  }
}
