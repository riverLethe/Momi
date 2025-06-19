import Foundation
import React

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
    resolve(nil)
  }
}
