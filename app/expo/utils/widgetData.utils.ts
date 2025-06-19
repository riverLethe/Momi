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
export async function updateTotalSpendingWidget(
  total: number,
  periodLabel: string
): Promise<void> {
  if (Platform.OS !== "ios") return;

  const bridge = NativeModules.WidgetDataBridge as
    | {
        updateTotal(total: number, label: string): Promise<void>;
      }
    | undefined;

  try {
    await bridge?.updateTotal(total, periodLabel);
  } catch (err) {
    console.warn("Failed to update Total Spending widget:", err);
  }
}
