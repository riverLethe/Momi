const { withDangerousMod } = require("expo/config-plugins");
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
        guard let url = URL(string: "momiq:///chat?autoSend=1") else {
            return .result(value: .none)
        }

        return .result(dialog: "Opening quick expense…", openApp: .init(url: url))
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

  return config;
};

module.exports = withAppIntentsQuickBill;
module.exports.withAppIntentsQuickBill = withAppIntentsQuickBill;
