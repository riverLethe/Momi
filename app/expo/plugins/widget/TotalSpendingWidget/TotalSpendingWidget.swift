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

// Timeline provider that fetches data from App Group storage
struct SpendingProvider: TimelineProvider {
    private let store = UserDefaults(suiteName: "group.com.momiq.shared")

    func placeholder(in context: Context) -> SpendingEntry {
        let sampleCats: [SpendingCategory] = [
            .init(name: "Groceries", amountText: "$120.00", percent: 0.33, color: "#22C55E"),
            .init(name: "Food", amountText: "$104.00", percent: 0.29, color: "#16A34A"),
            .init(name: "Shopping", amountText: "$77.00", percent: 0.21, color: "#EC4899"),
            .init(name: "Transport", amountText: "$62.00", percent: 0.17, color: "#0EA5E9")
        ]
        return SpendingEntry(date: Date(), totalText: "$364.53", periodLabel: "Total Spending", categories: sampleCats)
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
        let totalText = store?.string(forKey: "totalText") ?? "0"
        let label = store?.string(forKey: "periodLabel") ?? "--"

        var cats: [SpendingCategory] = []
        if let json = store?.string(forKey: "categoriesJson"),
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
    var entry: SpendingProvider.Entry

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
        case .systemLarge:
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
