import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getBills } from "./bills.utils";
import { Bill } from "@/types/bills.types";
import { getUserPreferences } from "./userPreferences.utils";
import { getCategoryById } from "@/constants/categories";
import i18n from "@/i18n";

/**
 * Convert an array of bills to CSV format following the required English template:
 * 1) Period (Start - End)
 * 2) Exported At
 * 3) Summary ( X transactions, Total Expense <currency>x )
 *
 * Followed by an empty line and the detailed table (Date, Category, Merchant, Amount, Notes)
 */
const billsToCsv = (
  bills: Bill[],
  startDate: Date,
  endDate: Date,
  currency: string
): string => {
  /**
   * Ensure value is CSV-safe and replace empty values with "".
   */
  const sanitize = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return "/";
    const str = String(value);
    if (str.trim() === "") return "/";
    // Wrap text fields that may contain commas or quotes
    if (str.includes(",") || str.includes('"')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const t = i18n.t.bind(i18n);

  const locale = i18n.language || undefined; // falls back to device locale

  /** Helper to format dates */
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const formatDateTime = (d: Date) =>
    `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
      d.getSeconds()
    )}`;

  /** Metadata section */
  const titleLine: string[] = [t("MomiQ Expense Bill Details") as string];

  const periodLine: string[] = [
    t("Period") as string,
    sanitize(`${formatDate(startDate)} - ${formatDate(endDate)}`),
  ];

  const exportTimeLine: string[] = [
    t("Export Time") as string,
    sanitize(formatDateTime(new Date())),
  ];

  const totalRecordsLine: string[] = [
    t("Total") as string,
    sanitize(
      t("Total {{count}} transactions", { count: bills.length }) as string
    ),
  ];

  const totalExpense = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalExpenseLine: string[] = [
    t("Total Expense") as string,
    sanitize(
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).format(totalExpense)
    ),
  ];

  // Empty line to separate metadata from details section
  const emptyLine: string[] = [""];

  /** Details section header */
  const detailsTitleLine: string[] = [
    t("MomiQ Transaction Bill Details List") as string,
  ];

  const tableHeader: string[] = [
    t("Created Time") as string,
    t("Transaction Time") as string,
    t("Category") as string,
    t("Merchant") as string,
    t("Type") as string, // Expense only
    t("Amount") as string,
    t("Notes") as string,
  ];

  /** Sort by transaction time descending */
  const sortedBills = [...bills].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  /** Build table rows */
  const tableRows = sortedBills.map((b) => {
    const categoryName = getCategoryById(b.category)?.name || b.category;

    return [
      sanitize(formatDateTime(new Date(b.createdAt))),
      sanitize(formatDateTime(new Date(b.date))),
      sanitize(t(categoryName) as string),
      sanitize(b.merchant ?? ""),
      t("Expense") as string, // Only expense records are exported for now
      sanitize(
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
        }).format(b.amount)
      ),
      sanitize(b.notes ?? ""),
    ];
  });

  const allLines: string[][] = [
    titleLine,
    periodLine,
    exportTimeLine,
    totalRecordsLine,
    totalExpenseLine,
    emptyLine,
    detailsTitleLine,
    tableHeader,
    ...tableRows,
  ];

  return allLines.map((row) => row.join(",")).join("\n");
};

/**
 * Exports bills as CSV file, writes it to the document directory and opens the native share dialog.
 * Returns the file URI so callers can handle it if needed.
 */
export const exportBillsAsCsv = async (
  startDate?: Date | null,
  endDate?: Date | null
): Promise<string | null> => {
  try {
    const bills = await getBills();
    // filter by provided date range
    const filtered = bills.filter((b) => {
      const d = new Date(b.date);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    if (!filtered.length) {
      throw new Error("No bills data to export");
    }

    // Fetch user currency preference (default to USD if not found)
    const { currency } = await getUserPreferences();

    // Determine period range – use provided dates or fallback to earliest/latest bill dates
    const periodStart =
      startDate ??
      new Date(Math.min(...filtered.map((b) => new Date(b.date).getTime())));
    const periodEnd =
      endDate ??
      new Date(Math.max(...filtered.map((b) => new Date(b.date).getTime())));

    const csvContent = billsToCsv(
      filtered,
      periodStart,
      periodEnd,
      currency || "USD"
    );
    const fileName = `bills_${Date.now()}.csv`;
    const fileUri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Export Bills",
      });
    }

    return fileUri;
  } catch (err) {
    console.error("Failed to export bills as CSV", err);
    return null;
  }
};
