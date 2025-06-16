import { Linking, Platform } from "react-native";
import * as Localization from "expo-localization";

/**
 * Opens iOS Shortcuts import sheet for the pre-built
 * "Quick Screenshot Bill" two-step shortcut (🖱 截图 → QuickBillIntent)。
 *
 * On Android this function is a no-op and resolves `false`.
 *
 * @returns whether the Shortcuts import UI was successfully opened.
 */
export async function installQuickScreenshotBillShortcut(): Promise<boolean> {
  // 根据设备语言选择跳转的快捷指令文件（中文或其他）
  const locale = Localization.getLocales()[0].languageCode || "en-US";
  const primaryLang = locale.split(/[_-]/)[0]; // 提取主语言标识，如 zh、en

  const fileName =
    primaryLang === "zh"
      ? "f9aa9b37ca9049dd97c5d4a49dd12565"
      : "98fcfc7f36494fa88e5bc59f5d7d01b0";

  // 远程 .shortcut 文件托管地址 —— 请替换为你自己托管的实际链接
  const hostedUrl = `https://www.icloud.com/shortcuts/${fileName}`;

  if (Platform.OS !== "ios") {
    return false;
  }

  try {
    const can = await Linking.canOpenURL(hostedUrl);
    if (!can) {
      console.warn("Cannot open Shortcuts URL. Is Shortcuts app installed?");
      return false;
    }
    await Linking.openURL(hostedUrl);
    return true;
  } catch (err) {
    console.warn("Failed to open shortcut import", err);
    return false;
  }
} 