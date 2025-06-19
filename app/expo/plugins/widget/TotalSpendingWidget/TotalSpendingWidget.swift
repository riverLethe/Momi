import WidgetKit
import SwiftUI

// Timeline entry holding the data we want to show
struct SpendingEntry: TimelineEntry {
    let date: Date
    let total: Double
    let periodLabel: String
}

// Timeline provider that fetches data from App Group storage
struct SpendingProvider: TimelineProvider {
    private let store = UserDefaults(suiteName: "group.com.momiq.shared")

    func placeholder(in context: Context) -> SpendingEntry {
        SpendingEntry(date: Date(), total: 1234.56, periodLabel: "This Month")
    }

    func getSnapshot(in context: Context, completion: @escaping (SpendingEntry) -> ()) {
        completion(readCurrentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SpendingEntry>) -> ()) {
        let entry = readCurrentEntry()
        // Refresh after 15 minutes (system may override)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func readCurrentEntry() -> SpendingEntry {
        let total = store?.double(forKey: "totalSpent") ?? 0
        let label = store?.string(forKey: "periodLabel") ?? "--"
        return SpendingEntry(date: Date(), total: total, periodLabel: label)
    }
}

// MARK: - Widget Views -------------------------------------------------

struct SpendingWidgetEntryView : View {
    var entry: SpendingProvider.Entry

    @Environment(\.widgetFamily) var family

    func formatCurrency(_ amount: Double) -> String {
        if #available(iOS 16.0, *) {
            let code = Locale.current.currency?.identifier ?? Locale.current.currencyCode ?? "USD"
            return amount.formatted(.currency(code: code))
        } else {
            let f = NumberFormatter()
            f.numberStyle = .currency
            f.currencyCode = Locale.current.currencyCode ?? "USD"
            return f.string(from: NSNumber(value: amount)) ?? String(format: "%.2f", amount)
        }
    }

    var body: some View {
        switch family {
        case .systemSmall:
            VStack(alignment: .center, spacing: 4) {
                Text(entry.periodLabel)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(formatCurrency(entry.total))
                    .font(.title2)
                    .fontWeight(.bold)
                    .minimumScaleFactor(0.6)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(.background.opacity(0.1))
        case .systemMedium, .systemLarge:
            VStack(alignment: .leading, spacing: 8) {
                Text(entry.periodLabel)
                    .font(.headline)
                Text(formatCurrency(entry.total))
                    .font(.title)
                    .fontWeight(.bold)
                    .minimumScaleFactor(0.5)
                Spacer()
            }
            .padding()
        default:
            Text("Unsupported size")
        }
    }
}

// MARK: - Widget Definition -------------------------------------------
@main
struct TotalSpendingWidget: Widget {
    let kind: String = "TotalSpendingWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SpendingProvider()) { entry in
            SpendingWidgetEntryView(entry: entry)
        }
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .configurationDisplayName("Total Spending")
        .description("Shows your total spending for a selected period.")
    }
}
