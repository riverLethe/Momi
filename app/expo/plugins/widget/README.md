# 📊 Total Spending Widget – Development Guide

中文在后面 ⬇️

## 1. Folder structure

```
app/expo/plugins/widget/TotalSpendingWidget/
├── TotalSpendingWidget.swift          # SwiftUI view + provider
├── WidgetDataBridge.swift             # Writes data to App Group
├── WidgetDataBridgeWrapper.m          # React-Native bridge wrapper
└── TotalSpendingWidget-Info.plist     # Extension Info.plist
```

## 2. Daily workflow

1. **Edit Swift-side UI / logic**  
   • Modify `TotalSpendingWidget.swift` for layout, colors, timeline policy.  
   • Need extra data? Add fields to `SpendingEntry`, then expose them in  
    `WidgetDataBridge.swift` **and** `WidgetDataBridgeWrapper.m`.

2. **Update JS bridge if necessary**  
   `app/expo/utils/widgetData.utils.ts` – call  
   `updateTotalSpendingWidget(total, label, …)` with any new values.

3. **Run the app**

```bash
cd app/expo
pnpm ios            # or npm run ios
# ↳ runs scripts/prewidget which:
#   • copies the four template files into ios/<EXT>/
#   • (re)creates a "TotalSpendingWidget" extension target
#   • tweaks build settings & bundles it together
```

4. **Add / refresh the widget** on the iOS home screen.  
   Data automatically refreshes every ≤ 15 min, or instantly after  
   `updateTotalSpendingWidget` is invoked.

## 3. Bridging new values (example)

```swift
// WidgetDataBridge.swift
@objc(updateTotal:label:foo:resolver:rejecter:)
func updateTotal(_ total: NSNumber,
                 label: NSString,
                 foo: NSString,          // NEW VALUE
                 resolver resolve: RCTPromiseResolveBlock,
                 rejecter reject: RCTPromiseRejectBlock) {
  store?.set(total.doubleValue, forKey: "totalSpent")
  store?.set(label as String,   forKey: "periodLabel")
  store?.set(foo as String,     forKey: "fooKey")     // add
  resolve(nil)
}
```

```typescript
// widgetData.utils.ts
await NativeModules.WidgetDataBridge.updateTotal(total, label, foo);
```

Read the same key inside `TotalSpendingWidget.swift` and display it.

## 4. App Group reminder

Both **MomiQ** and **TotalSpendingWidget** targets must include  
`group.com.momiq.shared` under _Signing & Capabilities → App Groups_.

---

## 📒 中文指南

### 1. 目录结构

见上。

### 2. 开发流程

1. 修改 **SwiftUI** 代码 → `TotalSpendingWidget.swift`
2. 如需新增数据，连同 `WidgetDataBridge.swift`、`WidgetDataBridgeWrapper.m`、  
   以及 JS 侧 `widgetData.utils.ts` 一起修改
3. `pnpm ios` 编译运行（脚本会自动复制文件并创建 Extension）
4. iOS 主屏长按 ➕ 添加「MomiQ – Total Spending」小组件

### 3. 刷新数据

在 React 代码里调用 `updateTotalSpendingWidget(...)` 即可触发刷新。  
系统默认 ≤ 15 分钟也会自动更新。

### 4. App Group

若发现 widget 无法读取数据，请在 Xcode 为 **主 App** 与 **Widget**  
都勾选同一个 App Group：`group.com.momiq.shared`。

Happy shipping! 🚀
