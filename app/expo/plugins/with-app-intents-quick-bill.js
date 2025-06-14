const {
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const EXT_NAME = "QuickBillIntents";

function ensureSwiftFile(projectRoot, swiftCode) {
  const extDir = path.join(projectRoot, EXT_NAME);
  if (!fs.existsSync(extDir)) {
    fs.mkdirSync(extDir, { recursive: true });
  }
  const swiftPath = path.join(extDir, "QuickBillIntent.swift");
  fs.writeFileSync(swiftPath, swiftCode, { encoding: "utf8" });
}

const QUICK_INTENT_SWIFT = `import AppIntents
import UIKit

/// A lightweight intent that simply launches the app's quick-bill screen.
/// Direct pasteboard access from an App Intent is no longer permitted on recent
/// iOS versions and was causing a SIGTRAP crash. We therefore avoid using
/// 'UIPasteboard.general' here and forward any optional screenshot through a
/// deep-link query parameter that the React Native side can handle instead.
@available(iOS 16.0, *)
public struct QuickBillIntent: AppIntent {
    public static let title: LocalizedStringResource = "MomiQ-Quick Add Bills"
    /// Instruct the system to launch the app automatically when the intent runs.
    public static let openAppWhenRun: Bool = true

    /// Optional screenshot provided by the invoking context (e.g. Siri, Shortcuts).
    @Parameter(title: "Screenshot")
    var screenshot: IntentFile?

    public init() {}

    @MainActor
    public func perform() async throws -> some IntentResult {
        var deeplink = "momiq:///chat?autoSend=1"

        // If a screenshot is present, persist it to a temporary location that
        // the main app can later read and attach. The file path is appended to
        // the deep-link so the JS side knows where to find it.
        if let data = screenshot?.data {
            let tmpURL = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString)
                .appendingPathExtension("png")
            do {
                try data.write(to: tmpURL)
                // URL-encode the path so it can be passed as a query item.
                let encodedPath = tmpURL.path.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
                deeplink += "&tmpPath=\(encodedPath)"
            } catch {
                // If writing fails, just fall back to opening the chat screen without the image.
                print("QuickBillIntent: failed to write screenshot –", error.localizedDescription)
            }
        }

        if let url = URL(string: deeplink) {
            await UIApplication.shared.open(url)
        }

        return .result(dialog: "Opening quick expense…")
    }
}
`;

const withAppIntentsQuickBill = (config) => {
  config = withDangerousMod(config, [
    "ios",
    (cfg) => {
      const iosRoot = cfg.modRequest.platformProjectRoot;
      ensureSwiftFile(iosRoot, QUICK_INTENT_SWIFT);
      return cfg;
    },
  ]);

  config = withEntitlementsPlist(config, (cfg) => {
    if (cfg.modResults) {
      cfg.modResults["com.apple.developer.siri"] = true;
    }
    return cfg;
  });

  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const targetUuid = project.getFirstTarget().uuid;

    // Path variables
    const fileName = "QuickBillIntent.swift";

    // 1. Ensure a PBXGroup for our Intents exists (or create it)
    let groupKey = project.findPBXGroupKey({ name: EXT_NAME });
    if (!groupKey) {
      // Create group with physical folder path so Xcode knows where to look
      groupKey = project.pbxCreateGroup(EXT_NAME, EXT_NAME);
      // add the new group under the main group so it shows up in Xcode sidebar
      const mainGroupKey = project.getFirstProject().firstProject.mainGroup;
      project.addToPbxGroup(groupKey, mainGroupKey);
    }

    // 2. Avoid duplicates then add the file to the group + build phase
    const alreadyExists =
      typeof project.hasFile === "function" && project.hasFile(fileName);
    if (!alreadyExists) {
      project.addSourceFile(fileName, { target: targetUuid }, groupKey);
    }

    return cfg;
  });

  return config;
};

module.exports = withAppIntentsQuickBill;
module.exports.withAppIntentsQuickBill = withAppIntentsQuickBill;
