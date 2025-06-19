// scripts/add-widget-target.js
const fs = require("fs");
const path = require("path");
const xcode = require("xcode");

const EXT = "TotalSpendingWidget";
const IOS = path.join(__dirname, "..", "ios");
const PBX = path.join(IOS, "MomiQ.xcodeproj", "project.pbxproj");
const SRC = path.join(__dirname, "..", "plugins", "widget", EXT);

if (!fs.existsSync(PBX)) {
  console.log("[widget] ios/ missing - skip");
  process.exit(0);
}

// 1. 复制所有模板文件到 ios/<EXT>/...
fs.mkdirSync(path.join(IOS, EXT), { recursive: true });

const templateFiles = fs.readdirSync(SRC);
templateFiles.forEach((f) => {
  const srcFile = path.join(SRC, f);
  const destFile = path.join(IOS, EXT, f);

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

const proj = xcode.project(PBX);
proj.parseSync();

const have = Object.values(proj.pbxNativeTargetSection()).some(
  (t) => typeof t === "object" && (t.name || "").includes(EXT)
);
if (!have) {
  const gKey = proj.pbxCreateGroup(EXT, EXT);
  proj.addToPbxGroup(gKey, proj.getFirstProject().firstProject.mainGroup);
  const widgetTarget = proj.addTarget(EXT, "app_extension", EXT);

  // Ensure the extension has Sources & Resources phases so Xcode actually builds it
  const sourcesPhase = proj.addBuildPhase(
    [],
    "PBXSourcesBuildPhase",
    "Sources",
    widgetTarget.uuid
  );
  const resourcesPhase = proj.addBuildPhase(
    [],
    "PBXResourcesBuildPhase",
    "Resources",
    widgetTarget.uuid
  );

  templateFiles.forEach((file) => {
    const rel = `${EXT}/${file}`;
    if (file === "TotalSpendingWidget.swift") {
      // 2.1 Widget 本身
      proj.addSourceFile(file, { target: widgetTarget.uuid }, gKey);
    } else if (file.endsWith(".swift") || file.endsWith(".m")) {
      // 2.2 其余桥接文件进主 APP
      proj.addSourceFile(file, { target: proj.getFirstTarget().uuid }, gKey);
    }
  });

  // tune build settings
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

// 这里无论 target 是否已存在，都确保关键文件已添加到对应 Build Phase
const widgetTargetUUID = (Object.entries(proj.pbxNativeTargetSection()).find(
  ([, t]) => typeof t === "object" && (t.name || "") === EXT
) || [])[0];
if (widgetTargetUUID) {
  // 1. Locate entitlements template (if provided) and ensure build settings reference it
  const entTemplate = templateFiles.find((f) => f.endsWith(".entitlements"));
  const entRelativePath = entTemplate ? `${EXT}/${entTemplate}` : null;
  if (entRelativePath) {
    // Add file reference to project (no build phase required)
    const extGroupKey =
      proj.findPBXGroupKey({ name: EXT }) ||
      proj.getFirstProject().firstProject.mainGroup;
    if (!proj.hasFile(entTemplate)) {
      proj.addFile(entRelativePath, extGroupKey);
    }
  }

  // Ensure an Xcode group for the extension exists (may be missing if target was created manually)
  let extGroupKey = proj.findPBXGroupKey({ name: EXT });
  if (!extGroupKey) {
    extGroupKey = proj.pbxCreateGroup(EXT, EXT);
    proj.addToPbxGroup(
      extGroupKey,
      proj.getFirstProject().firstProject.mainGroup
    );
  }

  templateFiles.forEach((file) => {
    if (file === "TotalSpendingWidget.swift") {
      proj.addSourceFile(file, { target: widgetTargetUUID }, extGroupKey);
    }
  });

  // 2. Attach entitlements file to extension build configs
  Object.values(proj.pbxXCBuildConfigurationSection())
    .filter(
      (c) =>
        typeof c === "object" && c.buildSettings?.PRODUCT_NAME?.includes(EXT)
    )
    .forEach((c) => {
      if (entRelativePath) {
        c.buildSettings["CODE_SIGN_ENTITLEMENTS"] = entRelativePath;
      }
      // Ensure App Group remains in build settings (some configs replicate groups there)
      const groups = c.buildSettings["APP_GROUP_IDENTIFIERS"] || [];
      if (Array.isArray(groups) && !groups.includes("group.com.momiq.shared")) {
        groups.push("group.com.momiq.shared");
        c.buildSettings["APP_GROUP_IDENTIFIERS"] = groups;
      }
    });
}

fs.writeFileSync(PBX, proj.writeSync());
console.log("[widget] target ready");
