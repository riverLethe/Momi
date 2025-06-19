// scripts/add-widget-target.js
const fs = require("fs");
const path = require("path");
const xcode = require("xcode");

const EXT_LIST = ["TotalSpendingWidget", "BudgetWidget"];

const IOS = path.join(__dirname, "..", "ios");
const PBX = path.join(IOS, "MomiQ.xcodeproj", "project.pbxproj");

if (!fs.existsSync(PBX)) {
  console.log("[widget] ios/ missing - skip");
  process.exit(0);
}

// Parse Xcode project once
const proj = xcode.project(PBX);
proj.parseSync();

EXT_LIST.forEach((EXT) => {
  const SRC = path.join(__dirname, "..", "plugins", "widget", EXT);
  const EXT_IOS_DIR = path.join(IOS, EXT);

  // If templates exist, copy/update into ios directory
  if (fs.existsSync(SRC)) {
    fs.mkdirSync(EXT_IOS_DIR, { recursive: true });

    const templateFiles = fs.readdirSync(SRC);
    templateFiles.forEach((f) => {
      const srcFile = path.join(SRC, f);
      const destFile = path.join(EXT_IOS_DIR, f);

      // Only copy if file does not exist or content differs
      let shouldCopy = true;
      if (fs.existsSync(destFile)) {
        try {
          const srcBuf = fs.readFileSync(srcFile);
          const destBuf = fs.readFileSync(destFile);
          shouldCopy = !srcBuf.equals(destBuf);
        } catch (_) {
          shouldCopy = true;
        }
      }

      if (shouldCopy) {
        fs.copyFileSync(srcFile, destFile);
      }
    });
  }

  // Gather files from ios/<EXT> even if plugins folder missing
  if (!fs.existsSync(EXT_IOS_DIR)) return;
  const templateFiles = fs.readdirSync(EXT_IOS_DIR);

  // If target not present, create
  const have = Object.values(proj.pbxNativeTargetSection()).some(
    (t) => typeof t === "object" && (t.name || "").includes(EXT)
  );
  if (!have) {
    const gKey = proj.pbxCreateGroup(EXT, EXT);
    proj.addToPbxGroup(gKey, proj.getFirstProject().firstProject.mainGroup);
    const widgetTarget = proj.addTarget(EXT, "app_extension", EXT);

    proj.addBuildPhase(
      [],
      "PBXSourcesBuildPhase",
      "Sources",
      widgetTarget.uuid
    );
    proj.addBuildPhase(
      [],
      "PBXResourcesBuildPhase",
      "Resources",
      widgetTarget.uuid
    );

    templateFiles.forEach((file) => {
      if (file === `${EXT}.swift`) {
        // Widget main file into extension
        proj.addSourceFile(file, { target: widgetTarget.uuid }, gKey);
      } else if (file.endsWith(".swift") || file.endsWith(".m")) {
        // Bridge/helper files into main app target
        proj.addSourceFile(file, { target: proj.getFirstTarget().uuid }, gKey);
      }
    });

    // Build settings tweak for new extension
    Object.values(proj.pbxXCBuildConfigurationSection())
      .filter(
        (c) =>
          typeof c === "object" && c.buildSettings?.PRODUCT_NAME?.includes(EXT)
      )
      .forEach((c) =>
        Object.assign(c.buildSettings, {
          INFOPLIST_FILE: `${EXT}/${EXT}-Info.plist`,
          PRODUCT_BUNDLE_IDENTIFIER: `com.momiq.app.${EXT}`,
          SKIP_INSTALL: "NO",
          EMBEDDED_CONTENT_CONTAINS_SWIFT: "YES",
          SWIFT_VERSION: "5.0",
        })
      );
  }

  // Ensure essential files & entitlements always added
  const widgetTargetUUID = (Object.entries(proj.pbxNativeTargetSection()).find(
    ([, t]) => typeof t === "object" && (t.name || "") === EXT
  ) || [])[0];
  if (!widgetTargetUUID) return;

  const entTemplate = templateFiles.find((f) => f.endsWith(".entitlements"));
  const entRelativePath = entTemplate ? `${EXT}/${entTemplate}` : null;

  // Add entitlements file reference
  if (entRelativePath) {
    const extGroupKey =
      proj.findPBXGroupKey({ name: EXT }) ||
      proj.getFirstProject().firstProject.mainGroup;
    if (!proj.hasFile(entTemplate)) {
      proj.addFile(entRelativePath, extGroupKey);
    }
  }

  // Ensure Xcode group exists
  let extGroupKey = proj.findPBXGroupKey({ name: EXT });
  if (!extGroupKey) {
    extGroupKey = proj.pbxCreateGroup(EXT, EXT);
    proj.addToPbxGroup(
      extGroupKey,
      proj.getFirstProject().firstProject.mainGroup
    );
  }

  // Make sure main swift file added to extension
  templateFiles.forEach((file) => {
    if (file === `${EXT}.swift`) {
      proj.addSourceFile(file, { target: widgetTargetUUID }, extGroupKey);
    }
  });

  // Attach entitlements file & App Group to build configs
  Object.values(proj.pbxXCBuildConfigurationSection())
    .filter(
      (c) =>
        typeof c === "object" && c.buildSettings?.PRODUCT_NAME?.includes(EXT)
    )
    .forEach((c) => {
      if (entRelativePath) {
        c.buildSettings["CODE_SIGN_ENTITLEMENTS"] = entRelativePath;
      }
      const groups = c.buildSettings["APP_GROUP_IDENTIFIERS"] || [];
      if (Array.isArray(groups) && !groups.includes("group.com.momiq.shared")) {
        groups.push("group.com.momiq.shared");
        c.buildSettings["APP_GROUP_IDENTIFIERS"] = groups;
      }
    });
});

// Persist project file
fs.writeFileSync(PBX, proj.writeSync());
console.log("[widget] targets ready");
