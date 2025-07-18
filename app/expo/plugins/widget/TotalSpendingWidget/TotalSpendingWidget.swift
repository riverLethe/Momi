import WidgetKit
import SwiftUI

// MARK: - Models ------------------------------------------------------

struct SpendingCategory: Identifiable, Decodable {
    let id = UUID()
    let name: String
    let amountText: String
    let percent: Double // 0-1 range
    let color: String
}

// Timeline entry holding the data we want to show
struct SpendingEntry: TimelineEntry {
    let date: Date
    let totalText: String
    let periodLabel: String
    let categories: [SpendingCategory]
}

// MARK: - Period Enum -------------------------------------------------

// 新增：支出小组件周期类型（周/月/年）
enum SpendingPeriod: String {
    case week
    case month
    case year

    /// Returns a short, capitalized display name (e.g. "Week")
    var displayName: String {
        switch self {
        case .week: return "Week"
        case .month: return "Month"
        case .year: return "Year"
        }
    }
}

// MARK: - Generic Period Provider ------------------------------------

/// Timeline provider that reads data for a fixed `SpendingPeriod` from the shared App Group.
struct PeriodSpendingProvider: TimelineProvider {
    let period: SpendingPeriod
    private let store = UserDefaults(suiteName: "group.com.momiq.shared")

    // Sample data for previews / placeholders (same across periods)
    private func sampleEntry() -> SpendingEntry {
        let sampleCats: [SpendingCategory] = [
            .init(name: "Groceries", amountText: "$120.00", percent: 0.33, color: "#22C55E"),
            .init(name: "Food", amountText: "$104.00", percent: 0.29, color: "#16A34A"),
            .init(name: "Shopping", amountText: "$77.00", percent: 0.21, color: "#EC4899"),
            .init(name: "Transport", amountText: "$62.00", percent: 0.17, color: "#0EA5E9")
        ]
        return SpendingEntry(date: Date(), totalText: "$364.53", periodLabel: "Total Spending", categories: sampleCats)
    }

    func placeholder(in context: Context) -> SpendingEntry {
        sampleEntry()
    }

    func getSnapshot(in context: Context, completion: @escaping (SpendingEntry) -> Void) {
        completion(readCurrentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SpendingEntry>) -> Void) {
        let entry = readCurrentEntry()
        // Refresh after 15 minutes (system may override)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func readCurrentEntry() -> SpendingEntry {
        let suffix = "_\(period.rawValue)"
        let totalText = store?.string(forKey: "totalText\(suffix)") ?? "0"
        let label = store?.string(forKey: "periodLabel\(suffix)") ?? period.displayName

        var cats: [SpendingCategory] = []
        if let json = store?.string(forKey: "categoriesJson\(suffix)"),
           let data = json.data(using: .utf8),
           let decoded = try? JSONDecoder().decode([SpendingCategory].self, from: data) {
            cats = decoded
        }

        return SpendingEntry(date: Date(), totalText: totalText, periodLabel: label, categories: cats)
    }
}

// MARK: - Helper ------------------------------------------------------

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
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

// MARK: - Localization Helper ---------------------------------------

func localizedString(_ key: String, comment: String) -> String {
    // 使用更可靠的方法获取Bundle
    let bundle = Bundle.main
    
    // 先尝试获取本地化字符串
    let localizedValue = NSLocalizedString(key, tableName: "Localizable", bundle: bundle, value: key, comment: comment)
    
    return localizedValue
}

// MARK: - Donut Chart View -------------------------------------------

struct DonutChartView: View {
    let categories: [SpendingCategory]
    let lineWidth: CGFloat = 16

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            ZStack {
                // Background circle
                Circle()
                    .stroke(Color(.systemGray5), lineWidth: lineWidth)

                // Data segments
                ForEach(categories.indices, id: \.self) { i in
                    let cat = categories[i]
                    let start = categories.prefix(i).reduce(0.0) { $0 + $1.percent }
                    let end = start + cat.percent
                    Circle()
                        .trim(from: start, to: end)
                        .stroke(Color(hex: cat.color), style: StrokeStyle(lineWidth: lineWidth, lineCap: .butt))
                        .rotationEffect(.degrees(-90))
                }
            }
        }
    }
}

struct DonutChartWithCenterView: View {
    let categories: [SpendingCategory]
    let totalFormatted: String
    let periodLabel: String?
    let showLabelInside: Bool
    let diameter: CGFloat

    var body: some View {
        ZStack {
            DonutChartView(categories: categories)
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

// MARK: - Widget Views -------------------------------------------------

struct SpendingWidgetEntryView : View {
    var entry: SpendingEntry

    @Environment(\.widgetFamily) var family

    var body: some View {
        // Determine chart diameter per family
        let chartDiameter: CGFloat = {
            switch family {
            case .systemSmall:
                return 120
            case .systemMedium:
                return 120
            case .systemLarge:
                return 140 // Approx. 40% of available height
            default:
                return 100
            }
        }()

        let showLabelInside = true

        let chart = DonutChartWithCenterView(
            categories: entry.categories,
            totalFormatted: entry.totalText,
            periodLabel: entry.periodLabel,
            showLabelInside: showLabelInside,
            diameter: chartDiameter
        )

        let titleText = entry.periodLabel

        switch family {
        case .systemSmall:
            // SM – ring with amount & label inside, minimal outer padding
            chart
        case .systemMedium:
            if entry.categories.isEmpty {
                // Placeholder – chart with centered message
                HStack(alignment: .center, spacing: 20) {
                    chart
                    VStack {
                        Spacer().frame(height: 5)
                        Text(localizedString("No spending data available", comment: "Placeholder when no spending data"))
                            .font(.caption2)
                            .foregroundColor(Color(hex: "#CBD5E1"))
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
                .padding(8)
            } else {
                // MD – chart with internal label and wider spacing to category list
                HStack(alignment: .top, spacing: 20) {
                    chart
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(entry.categories.prefix(6)) { cat in
                            HStack(alignment: .center) {
                                Circle()
                                    .fill(Color(hex: cat.color))
                                    .frame(width: 10, height: 10)
                                Text(cat.name)
                                    .font(.caption2)
                                    .lineLimit(1)
                                Spacer()
                                Text(cat.amountText)
                                    .font(.caption2)
                            }
                        }
                    }
                }
                .padding(8)
            }
        case .systemLarge:
            if entry.categories.isEmpty {
                VStack(alignment: .center, spacing: 20) {
                    chart
                        .frame(maxWidth: .infinity, alignment: .center)
                    VStack {
                        Spacer().frame(height: 30)
                        Text(localizedString("No spending data available", comment: "Placeholder when no spending data"))
                            .font(.caption)
                            .foregroundColor(Color(hex: "#CBD5E1"))
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                    Spacer()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .padding(10)
            } else {
                // LG – top-aligned: chart with internal label, then list
                VStack(alignment: .leading, spacing: 20) {
                    chart
                        .frame(maxWidth: .infinity, alignment: .center)
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(entry.categories.prefix(8)) { cat in
                            HStack(alignment: .center) {
                                Circle()
                                    .fill(Color(hex: cat.color))
                                    .frame(width: 10, height: 10)
                                Text(cat.name)
                                    .font(.caption2)
                                    .lineLimit(1)
                                Spacer()
                                Text(cat.amountText)
                                    .font(.caption2)
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .padding(10)
            }
        default:
            Text("Unsupported size")
        }
    }
}

// MARK: - New Widget Definitions ------------------------------------

/// 周度总支出小组件
struct WeeklyTotalSpendingWidget: Widget {
    let kind: String = "WeeklyTotalSpendingWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PeriodSpendingProvider(period: .week)) { entry in
            SpendingWidgetEntryView(entry: entry)
        }
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .configurationDisplayName(localizedString("Weekly Spending Analytics", comment: "Weekly Spending widget title"))
        .description(localizedString("Visualize your weekly spending categories and track your expenses", comment: "Visualize your weekly spending categories and track your expenses"))
    }
}

/// 月度总支出小组件
struct MonthlyTotalSpendingWidget: Widget {
    let kind: String = "MonthlyTotalSpendingWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PeriodSpendingProvider(period: .month)) { entry in
            SpendingWidgetEntryView(entry: entry)
        }
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .configurationDisplayName(localizedString("Monthly Spending Insights", comment: "Monthly Spending widget title"))
        .description(localizedString("Analyze your monthly spending patterns and category distribution", comment: "Analyze your monthly spending patterns and category distribution"))
    }
}

/// 年度总支出小组件
struct YearlyTotalSpendingWidget: Widget {
    let kind: String = "YearlyTotalSpendingWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PeriodSpendingProvider(period: .year)) { entry in
            SpendingWidgetEntryView(entry: entry)
        }
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .configurationDisplayName(localizedString("Annual Finance Review", comment: "Yearly Spending widget title"))
        .description(localizedString("Monitor your annual spending trends across different categories", comment: "Monitor your annual spending trends across different categories"))
    }
}

// MARK: - Bundle exposing all widgets ---------------------------------

@main
struct SpendingWidgetsBundle: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        WeeklyTotalSpendingWidget()
        MonthlyTotalSpendingWidget()
        YearlyTotalSpendingWidget()
    }
}
