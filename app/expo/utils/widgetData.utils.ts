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
