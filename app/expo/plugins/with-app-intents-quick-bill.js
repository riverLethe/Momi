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

@available(iOS 16.0, *)
struct QuickBillIntent: AppIntent {
    static var title: LocalizedStringResource = "MomiQ-Quick Add Bills"

    /// Optional screenshot passed from the invoking context (e.g. Siri, Shortcuts).
    /// The parameter name **screenshot** is important because it influences how
    /// the system attempts to infer and provide the image when the intent is
    /// triggered from a screenshot-related action.
    @Parameter(title: "Screenshot")
    var screenshot: IntentFile?

    @MainActor
    func perform() async throws -> some IntentResult {
        // If a screenshot is supplied, push it into the general pasteboard so that
        // the React Native side (chat.tsx) can pick it up via Expo Clipboard APIs.
        if let screenshot = screenshot {
            let data = screenshot.data
            if let image = UIImage(data: data) {
                UIPasteboard.general.image = image
            } else {
                // Fallback: write raw PNG data.
                UIPasteboard.general.setData(data, forPasteboardType: "public.png")
            }
        }

        // Deep-link into the chat screen with the autoSend flag so the JS code
        // attaches the clipboard image and sends the message automatically.
        if let url = URL(string: "momiq:///chat?autoSend=1") {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
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
