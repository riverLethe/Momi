import WidgetKit
import SwiftUI

// MARK: - Models ------------------------------------------------------

struct BudgetSegment: Identifiable, Decodable {
    let id = UUID()
    let name: String
    let amountText: String
    let percent: Double // 0-1 range
    let color: String
}

// Timeline entry for Budget widget
struct BudgetEntry: TimelineEntry {
    let date: Date
    let totalText: String
    let periodLabel: String
    let segments: [BudgetSegment]
}

// MARK: - Period Enum -------------------------------------------------

enum BudgetPeriod: String {
    case week
    case month
    case year

    var displayName: String {
        switch self {
        case .week: return "Week"
        case .month: return "Month"
        case .year: return "Year"
        }
    }
}

// MARK: - Timeline Provider ------------------------------------------

struct PeriodBudgetProvider: TimelineProvider {
    let period: BudgetPeriod
    private let store = UserDefaults(suiteName: "group.com.momiq.shared")

    private func sampleEntry() -> BudgetEntry {
        // Example with 67.3% used
        let usedSegment: BudgetSegment = .init(name: "Used", amountText: "$2,019.04", percent: 0.673, color: "#EF4444")
        let remainingSegment: BudgetSegment = .init(name: "Remaining", amountText: "$980.96", percent: 0.327, color: "#22C55E")
        return BudgetEntry(
            date: Date(),
            totalText: "$3,000.00",
            periodLabel: "Budget",
            segments: [
                usedSegment,
                remainingSegment,
                .init(name: "Budget", amountText: "$3,000.00", percent: 0, color: "#000000"),
                .init(name: "Spent", amountText: "$2,019.04", percent: 0, color: "#000000"),
                .init(name: "Used", amountText: "$980.96", percent: 0, color: "#22C55E"),
                .init(name: "Remaining", amountText: "67.3%", percent: 0, color: "#000000"),
                .init(name: "Volatility", amountText: "119%", percent: 0, color: "#EF4444"),
                .init(name: "Recurring cover", amountText: "0d", percent: 0, color: "#000000")
            ]
        )
    }

    func placeholder(in context: Context) -> BudgetEntry {
        sampleEntry()
    }

    func getSnapshot(in context: Context, completion: @escaping (BudgetEntry) -> Void) {
        completion(readCurrentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BudgetEntry>) -> Void) {
        let entry = readCurrentEntry()
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func readCurrentEntry() -> BudgetEntry {
        let suffix = "_\(period.rawValue)"
        let totalText = store?.string(forKey: "budgetTotalText\(suffix)") ?? "$0"
        let label = store?.string(forKey: "budgetLabel\(suffix)") ?? period.displayName

        var segs: [BudgetSegment] = []
        if let json = store?.string(forKey: "budgetSegmentsJson\(suffix)"),
           let data = json.data(using: .utf8),
           let decoded = try? JSONDecoder().decode([BudgetSegment].self, from: data) {
            segs = decoded
        }

        return BudgetEntry(date: Date(), totalText: totalText, periodLabel: label, segments: segs)
    }
}

// MARK: - Helper ------------------------------------------------------

extension Color {
    init(budgetHex: String) {
        let hex = budgetHex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB,
                  red: Double(r) / 255,
                  green: Double(g) / 255,
                  blue: Double(b) / 255,
                  opacity: Double(a) / 255)
    }
}

// MARK: - Donut Chart View -------------------------------------------

struct BudgetDonutChartView: View {
    let segments: [BudgetSegment]
    let lineWidth: CGFloat = 16

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            ZStack {
                Circle()
                    .stroke(Color(.systemGray5), lineWidth: lineWidth)

                ForEach(segments.indices, id: \.self) { i in
                    let seg = segments[i]
                    let start = segments.prefix(i).reduce(0.0) { $0 + $1.percent }
                    let end = start + seg.percent
                    Circle()
                        .trim(from: start, to: end)
                        .stroke(Color(budgetHex: seg.color), style: StrokeStyle(lineWidth: lineWidth, lineCap: .butt))
                        .rotationEffect(.degrees(-90))
                }
            }
            .frame(width: size, height: size)
        }
    }
}

struct BudgetDonutChartWithCenterView: View {
    let segments: [BudgetSegment]
    let totalFormatted: String
    let periodLabel: String?
    let showLabelInside: Bool
    let diameter: CGFloat

    var body: some View {
        ZStack {
            BudgetDonutChartView(segments: segments)
                .frame(width: diameter, height: diameter)

            VStack(spacing: 2) {
                Text(totalFormatted)
                    .font(.headline)
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
                if showLabelInside, let label = periodLabel {
                    Text(label)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .minimumScaleFactor(0.5)
                        .lineLimit(1)
                }
            }
        }
    }
}

// MARK: - Widget Views -----------------------------------------------

struct BudgetWidgetEntryView: View {
    var entry: BudgetEntry

    @Environment(\.widgetFamily) var family

    var body: some View {
        let chartDiameter: CGFloat = {
            switch family {
            case .systemSmall: return 120
            case .systemMedium: return 120
            case .systemLarge: return 140
            default: return 100
            }
        }()

        // Health score stored in totalText of segment index 2? We'll derive from period label for now
        let healthScore = Int(entry.totalText) ?? 30

        let chart = BudgetDonutChartWithCenterView(
            segments: entry.segments.prefix(2).map { $0 },
            totalFormatted: String(healthScore),
            periodLabel: entry.periodLabel,
            showLabelInside: true,
            diameter: chartDiameter
        )

        switch family {
        case .systemSmall:
            chart
        case .systemMedium:
            HStack(alignment: .top, spacing: 20) {
                chart
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(entry.segments.dropFirst(2)) { seg in
                        metricRow(label: seg.name, value: seg.amountText, valueColor: seg.color)
                    }
                }
            }
            .padding(8)
        case .systemLarge:
            VStack(alignment: .leading, spacing: 20) {
                chart
                    .frame(maxWidth: .infinity, alignment: .center)
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(entry.segments.dropFirst(2)) { seg in
                        metricRow(label: seg.name, value: seg.amountText, valueColor: seg.color)
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(10)
        default:
            Text("Unsupported size")
        }
    }

    private func metricRow(label: String, value: String, valueColor: String) -> some View {
        HStack {
            Text(label)
                .font(.caption2)
            Spacer()
            Text(value)
                .font(.caption2)
                .foregroundColor(Color(budgetHex: valueColor))
        }
    }
}

// MARK: - Widget Definitions -----------------------------------------

struct WeeklyBudgetWidget: Widget {
    let kind: String = "WeeklyBudgetWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PeriodBudgetProvider(period: .week)) { entry in
            BudgetWidgetEntryView(entry: entry)
        }
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .configurationDisplayName("Weekly Budget")
        .description("Shows your budget usage for this week.")
    }
}

struct MonthlyBudgetWidget: Widget {
    let kind: String = "MonthlyBudgetWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PeriodBudgetProvider(period: .month)) { entry in
            BudgetWidgetEntryView(entry: entry)
        }
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .configurationDisplayName("Monthly Budget")
        .description("Shows your budget usage for this month.")
    }
}

struct YearlyBudgetWidget: Widget {
    let kind: String = "YearlyBudgetWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PeriodBudgetProvider(period: .year)) { entry in
            BudgetWidgetEntryView(entry: entry)
        }
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .configurationDisplayName("Yearly Budget")
        .description("Shows your budget usage for this year.")
    }
}

// MARK: - Bundle ------------------------------------------------------

@main
struct BudgetWidgetsBundle: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        WeeklyBudgetWidget()
        MonthlyBudgetWidget()
        YearlyBudgetWidget()
    }
} 