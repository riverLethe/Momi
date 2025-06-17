import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getBills } from './bills.utils';
import { Bill } from '@/types/bills.types';
import { getUserPreferences } from './userPreferences.utils';

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
   * Ensure value is CSV-safe and replace empty values with “/”.
   */
  const sanitize = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return '/';
    const str = String(value);
    if (str.trim() === '') return '/';
    // Wrap text fields that may contain commas or quotes
    if (str.includes(',') || str.includes('"')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  /** Metadata section */
  const titleLine: string[] = ['MomiQ Expense Bill Details'];

  const periodLine: string[] = [
    'Period',
    `${startDate.toISOString()} - ${endDate.toISOString()}`,
  ];

  const exportTimeLine: string[] = ['Export Time', new Date().toISOString()];

  const totalRecordsLine: string[] = ['Total', `${bills.length} records`];

  const totalExpense = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalExpenseLine: string[] = [
    'Total Expense',
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(totalExpense),
  ];

  // Empty line to separate metadata from details section
  const emptyLine: string[] = [''];

  /** Details section header */
  const detailsTitleLine: string[] = ['MomiQ Transaction Bill Details List'];

  const tableHeader: string[] = [
    'Created Time',
    'Transaction Time',
    'Category',
    'Merchant',
    'Type', // Expense only
    'Amount',
    'Notes',
  ];

  /** Build table rows */
  const tableRows = bills.map((b) => [
    sanitize(new Date(b.createdAt).toISOString()),
    sanitize(new Date(b.date).toISOString()),
    sanitize(b.category),
    sanitize(b.merchant ?? ''),
    'Expense', // Only expense records are exported for now
    sanitize(
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(b.amount)
    ),
    sanitize(b.notes ?? ''),
  ]);

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

  return allLines.map((row) => row.join(',')).join('\n');
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
      throw new Error('No bills data to export');
    }

    // Fetch user currency preference (default to USD if not found)
    const { currency } = await getUserPreferences();

    // Determine period range – use provided dates or fallback to earliest/latest bill dates
    const periodStart = startDate ?? new Date(Math.min(...filtered.map((b) => new Date(b.date).getTime())));
    const periodEnd = endDate ?? new Date(Math.max(...filtered.map((b) => new Date(b.date).getTime())));

    const csvContent = billsToCsv(filtered, periodStart, periodEnd, currency || 'USD');
    const fileName = `bills_${Date.now()}.csv`;
    const fileUri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Bills',
      });
    }

    return fileUri;
  } catch (err) {
    console.error('Failed to export bills as CSV', err);
    return null;
  }
}; 