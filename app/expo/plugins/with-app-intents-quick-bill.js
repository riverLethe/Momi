const {
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const EXT_NAME = "QuickBillIntents";
const BRIDGE_NAME = "PendingLinkBridge";
const OBJC_WRAPPER_NAME = "PendingLinkBridgeWrapper";

// Swift class that implements the actual logic. It **does NOT** conform to
// `RCTBridgeModule`; instead we export it through a lightweight Objective-C
// wrapper file (generated further down). This avoids having to tweak the
// global bridging header and therefore works on any fresh machine.
const BRIDGE_SWIFT = `import Foundation
import React

// React Native bridge that lets JavaScript read (and clear) the deep link
// saved by the QuickBill intent. Exposed on the JS side as
//   NativeModules.PendingLinkBridge

@objc(PendingLinkBridge)
class PendingLinkBridge: NSObject {

  // Reads the pending deep link from the shared App Group and clears it.
  @objc(consumePendingDeepLink:rejecter:)
  func consumePendingDeepLink(_ resolve: RCTPromiseResolveBlock,
                              rejecter reject: RCTPromiseRejectBlock) {
    let store = UserDefaults(suiteName: "group.com.momiq.shared")
    let url = store?.string(forKey: "pendingDeepLink")
    store?.removeObject(forKey: "pendingDeepLink")
    resolve(url)
  }
}`;

// Objective-C wrapper that actually registers the Swift class as a RN module.
// It calls the React macros so JS can see `NativeModules.PendingLinkBridge`.
const BRIDGE_OBJC = `#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>

// Expose the Swift class PendingLinkBridge to React Native

@interface RCT_EXTERN_MODULE(${BRIDGE_NAME}, NSObject)

// Promise-based method: resolve returns the URL string, reject unused.
RCT_EXTERN_METHOD(consumePendingDeepLink:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end`;

function ensureSwiftFile(projectRoot, swiftCode) {
  const extDir = path.join(projectRoot, EXT_NAME);
  if (!fs.existsSync(extDir)) {
    fs.mkdirSync(extDir, { recursive: true });
  }
  const swiftPath = path.join(extDir, "QuickBillIntent.swift");
  fs.writeFileSync(swiftPath, swiftCode, { encoding: "utf8" });
}

function ensureSwiftBridgeFile(projectRoot, swiftCode) {
  const extDir = path.join(projectRoot, EXT_NAME);
  if (!fs.existsSync(extDir)) {
    fs.mkdirSync(extDir, { recursive: true });
  }
  const swiftPath = path.join(extDir, `${BRIDGE_NAME}.swift`);
  fs.writeFileSync(swiftPath, swiftCode, { encoding: "utf8" });
}

function ensureObjcWrapperFile(projectRoot, objcCode) {
  const extDir = path.join(projectRoot, EXT_NAME);
  if (!fs.existsSync(extDir)) {
    fs.mkdirSync(extDir, { recursive: true });
  }
  const objcPath = path.join(extDir, `${OBJC_WRAPPER_NAME}.m`);
  fs.writeFileSync(objcPath, objcCode, { encoding: "utf8" });
}

const QUICK_INTENT_SWIFT = `import AppIntents
// UIKit deliberately not imported – AppIntent should avoid UI frameworks.

/// A lightweight intent that simply launches the app's quick-bill screen and forwards an optional
/// screenshot to the React Native chat view. On iOS 17 we can directly open a deep-link via the new
/// IntentResult.opening API. For iOS 16 we persist the URL in a shared App Group so that the
/// JavaScript side can pick it up on launch.
@available(iOS 16.0, *)
public struct QuickBillIntent: AppIntent {
    public static let title: LocalizedStringResource = "[MomiQ]Quick Add Bills"

    /// Must be a compile-time constant (cannot depend on OS version).
    /// We always let the system bring the main app to foreground; when iOS ≥17 we may additionally
    /// use the OpensIntent API which supersedes this flag.
    public static var openAppWhenRun: Bool = true

    /// Optional screenshot provided by the invoking context (e.g. Siri, Shortcuts).
    @Parameter(
        title: "Bill Screenshot",
        supportedTypeIdentifiers: ["public.image"],
        inputConnectionBehavior: .connectToPreviousIntentResult
    )
    var screenshot: IntentFile?

    public init() {}

    @MainActor
    public func perform() async throws -> some IntentResult {
        let base = "momiq:///chat?autoSend=1"
        var deeplink = base

        // If a screenshot is present, write it to the shared App Group directory so the main app can
        // access it. The path is appended (URL-encoded) as a query parameter.
        if let data = screenshot?.data {
            if let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.momiq.shared") {
                let tmpURL = containerURL.appendingPathComponent(UUID().uuidString).appendingPathExtension("png")
                do {
                    try data.write(to: tmpURL)
                    let encoded = tmpURL.path.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
                    deeplink += "&tmpPath=\\(encoded)"
                } catch {
                    print("QuickBillIntent: failed to write screenshot –", error.localizedDescription)
                }
            }
        }

        guard let url = URL(string: deeplink) else {
            return .result()
        }

#if compiler(>=5.9)
        // Newer SDKs support .opening, but it's unavailable on this toolchain; fall back to persist.
#endif

        // Persist the link so the main app can consume it on launch regardless of OS version.
        let store = UserDefaults(suiteName: "group.com.momiq.shared")
        store?.set(url.absoluteString, forKey: "pendingDeepLink")
        return .result()
    }
}
`;

const withAppIntentsQuickBill = (config) => {
  config = withDangerousMod(config, [
    "ios",
    (cfg) => {
      const iosRoot = cfg.modRequest.platformProjectRoot;
      ensureSwiftFile(iosRoot, QUICK_INTENT_SWIFT);
      ensureSwiftBridgeFile(iosRoot, BRIDGE_SWIFT);
      ensureObjcWrapperFile(iosRoot, BRIDGE_OBJC);
      return cfg;
    },
  ]);

  config = withEntitlementsPlist(config, (cfg) => {
    if (cfg.modResults) {
      cfg.modResults["com.apple.developer.siri"] = true;

      // Add shared App Group so Intent and main app can communicate on iOS <17
      const APP_GROUP = "group.com.momiq.shared";
      const groups =
        cfg.modResults["com.apple.security.application-groups"] || [];
      if (!groups.includes(APP_GROUP)) {
        groups.push(APP_GROUP);
      }
      cfg.modResults["com.apple.security.application-groups"] = groups;
    }
    return cfg;
  });

  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const targetUuid = project.getFirstTarget().uuid;

    // Path variables
    const intentFile = "QuickBillIntent.swift";
    const bridgeFile = `${BRIDGE_NAME}.swift`;
    const objcWrapperFile = `${OBJC_WRAPPER_NAME}.m`;

    // 1. Ensure a PBXGroup for our Intents exists (or create it)
    let groupKey = project.findPBXGroupKey({ name: EXT_NAME });
    if (!groupKey) {
      // Create group with physical folder path so Xcode knows where to look
      groupKey = project.pbxCreateGroup(EXT_NAME, EXT_NAME);
      // add the new group under the main group so it shows up in Xcode sidebar
      const mainGroupKey = project.getFirstProject().firstProject.mainGroup;
      project.addToPbxGroup(groupKey, mainGroupKey);
    }

    function addFileIfNeeded(file) {
      const exists =
        typeof project.hasFile === "function" && project.hasFile(file);
      if (!exists) {
        project.addSourceFile(file, { target: targetUuid }, groupKey);
      }
    }

    addFileIfNeeded(intentFile);
    addFileIfNeeded(bridgeFile);
    addFileIfNeeded(objcWrapperFile);

    return cfg;
  });

  return config;
};

module.exports = withAppIntentsQuickBill;
module.exports.withAppIntentsQuickBill = withAppIntentsQuickBill;
