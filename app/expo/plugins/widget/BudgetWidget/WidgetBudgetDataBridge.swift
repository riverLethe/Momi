import Foundation
import React
#if canImport(WidgetKit)
import WidgetKit
#endif

@objc(WidgetBudgetDataBridge)
class WidgetBudgetDataBridge: NSObject {
  private let store = UserDefaults(suiteName: "group.com.momiq.shared")

  // Updates localized budget strings for a given period (week/month/year)
  // - Parameters:
  //   - periodKey: "week", "month" or "year"
  //   - totalText: Localized total budget text (e.g. "$3,000.00")
  //   - label: Label describing the budget total (e.g. "Budget")
  //   - segmentsJson: JSON string representing array of `BudgetSegment`
  @objc(updateBudgetStringsForPeriod:totalText:label:segments:resolver:rejecter:)
  func updateBudgetStringsForPeriod(_ periodKey: NSString,
                                    totalText: NSString,
                                    label: NSString,
                                    segments: NSString,
                                    resolver resolve: RCTPromiseResolveBlock,
                                    rejecter reject: RCTPromiseRejectBlock) {
    let suffix = "_\(periodKey)"
    store?.set(totalText as String, forKey: "budgetTotalText\(suffix)")
    store?.set(label as String, forKey: "budgetLabel\(suffix)")
    store?.set(segments as String, forKey: "budgetSegmentsJson\(suffix)")

    #if canImport(WidgetKit)
    if #available(iOS 14.0, *) {
      let kind: String
      switch periodKey {
      case "week":
        kind = "WeeklyBudgetWidget"
      case "month":
        kind = "MonthlyBudgetWidget"
      case "year":
        kind = "YearlyBudgetWidget"
      default:
        kind = "WeeklyBudgetWidget"
      }
      WidgetCenter.shared.reloadTimelines(ofKind: kind)
    }
    #endif

    store?.synchronize()
    resolve(nil)
  }
} 