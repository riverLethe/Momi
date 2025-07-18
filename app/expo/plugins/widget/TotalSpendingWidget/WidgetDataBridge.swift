import Foundation
import React
#if canImport(WidgetKit)
import WidgetKit
#endif

@objc(WidgetDataBridge)
class WidgetDataBridge: NSObject {

  private let store = UserDefaults(suiteName: "group.com.momiq.shared")

  // Updates the total spending value and associated period label.
  @objc(updateTotal:label:resolver:rejecter:)
  func updateTotal(_ total: NSNumber,
                   label: NSString,
                   resolver resolve: RCTPromiseResolveBlock,
                   rejecter reject: RCTPromiseRejectBlock) {
    store?.set(total.doubleValue, forKey: "totalSpent")
    store?.set(label as String, forKey: "periodLabel")
    #if canImport(WidgetKit)
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: "TotalSpendingWidget")
    }
    #endif
    store?.synchronize()
    resolve(nil)
  }

  // Updates spending data including category breakdown JSON
  @objc(updateSpendingData:label:categories:resolver:rejecter:)
  func updateSpendingData(_ total: NSNumber,
                          label: NSString,
                          categories: NSString,
                          resolver resolve: RCTPromiseResolveBlock,
                          rejecter reject: RCTPromiseRejectBlock) {
    store?.set(total.doubleValue, forKey: "totalSpent")
    store?.set(label as String, forKey: "periodLabel")
    store?.set(categories as String, forKey: "categoriesJson")
    #if canImport(WidgetKit)
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: "TotalSpendingWidget")
    }
    #endif
    store?.synchronize()
    resolve(nil)
  }

  // New V2 method including currency code
  @objc(updateSpendingDataV2:label:currency:categories:resolver:rejecter:)
  func updateSpendingDataV2(_ total: NSNumber,
                            label: NSString,
                            currency: NSString,
                            categories: NSString,
                            resolver resolve: RCTPromiseResolveBlock,
                            rejecter reject: RCTPromiseRejectBlock) {
    store?.set(total.doubleValue, forKey: "totalSpent")
    store?.set(label as String, forKey: "periodLabel")
    store?.set(currency as String, forKey: "currencyCode")
    store?.set(categories as String, forKey: "categoriesJson")
    #if canImport(WidgetKit)
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: "TotalSpendingWidget")
    }
    #endif
    store?.synchronize()
    resolve(nil)
  }

  // MARK: - New localized string method ----------------------------------
  @objc(updateSpendingStrings:label:categories:resolver:rejecter:)
  func updateSpendingStrings(_ totalText: NSString,
                             label: NSString,
                             categories: NSString,
                             resolver resolve: RCTPromiseResolveBlock,
                             rejecter reject: RCTPromiseRejectBlock) {
    store?.set(totalText as String, forKey: "totalText")
    store?.set(label as String, forKey: "periodLabel")
    store?.set(categories as String, forKey: "categoriesJson")
    #if canImport(WidgetKit)
    if #available(iOS 14.0, *) {
      let kinds = [
        "TotalSpendingWidget", // legacy
        "WeeklyTotalSpendingWidget",
        "MonthlyTotalSpendingWidget",
        "YearlyTotalSpendingWidget"
      ]
      kinds.forEach { WidgetCenter.shared.reloadTimelines(ofKind: $0) }
    }
    #endif
    store?.synchronize()
    resolve(nil)
  }

  // MARK: - Period specific string method ----------------------------------

  // periodKey should be "week", "month" or "year"
  @objc(updateSpendingStringsForPeriod:totalText:label:categories:resolver:rejecter:)
  func updateSpendingStringsForPeriod(_ periodKey: NSString,
                                      totalText: NSString,
                                      label: NSString,
                                      categories: NSString,
                                      resolver resolve: RCTPromiseResolveBlock,
                                      rejecter reject: RCTPromiseRejectBlock) {
    let suffix = "_\(periodKey)"
    store?.set(totalText as String, forKey: "totalText\(suffix)")
    store?.set(label as String, forKey: "periodLabel\(suffix)")
    store?.set(categories as String, forKey: "categoriesJson\(suffix)")

    #if canImport(WidgetKit)
    if #available(iOS 14.0, *) {
      let kind: String
      switch periodKey {
      case "week":
        kind = "WeeklyTotalSpendingWidget"
      case "month":
        kind = "MonthlyTotalSpendingWidget"
      case "year":
        kind = "YearlyTotalSpendingWidget"
      default:
        kind = "WeeklyTotalSpendingWidget" // fallback
      }
      WidgetCenter.shared.reloadTimelines(ofKind: kind)
    }
    #endif

    store?.synchronize()
    resolve(nil)
  }
}
