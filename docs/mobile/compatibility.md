# 🛡️ 移动端兼容性处理（iOS / Android / WebView 常见坑全集）

> 移动端最头疼的是"机型 × 系统 × WebView × 厂商"四维组合爆炸。本篇把**高频兼容性坑**按类别罗列清楚，每个给**现象 → 根因 → 最佳实践方案**。依据 **MDN**、**Can I Use**、**微信/抖音/支付宝开放文档**、社区踩坑沉淀。
>
> 适用：中级必背、高级查漏。前置：[移动端基础](basics.md)、[适配方案](adaptation.md)。

---

## 一、iOS vs Android 差异总表

| 维度 | iOS (Safari/WKWebView) | Android (Chrome/系统 WebView) |
|------|------------------------|-------------------------------|
| 滚动回弹 | 有橡皮筋 `(-webkit-overflow-scrolling:touch)` | 默认无，需 `overscroll-behavior` |
| 100vh | 含地址栏，**不准** | 同样不准（用 dvh） |
| 软键盘 | 推起视口、**不滚动到输入框**（需 JS） | 大多自动推起 |
| 日期控件 | 原生 picker，样式不可改 | 因厂商而异 |
| 1px | 支持 `0.5px` | 部分不支持，需 hairline |
| 音频自动播放 | 严格禁止（需用户手势） | 略松 |
| `position: fixed` + 键盘 | 可能错位 | 基本正常 |

---

## 二、安全区 / 异形屏（刘海、灵动岛、Home 条）

### 现象
顶部内容被刘海/灵动岛遮；底部按钮被 Home Indicator 挡；横屏时左右被挖孔占。

### 方案

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
/* 必须 viewport-fit=cover 才生效 */
.page { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
/* 横屏左右 */
.page { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
/* 不支持 env 的老机兜底 */
@supports not (padding-top: env(safe-area-inset-top)) {
  .page { padding-top: 20px; padding-bottom: 20px; }
}
```

!!! tip "灵动岛动态避让"
    灵动岛是**可变尺寸**（通话/导航时变大）。内容顶部留白用 `env()` 且**居中对齐**，别贴顶写死。详见 [总纲 §三 坑2](index.md)。

---

## 三、软键盘与输入框遮挡

### 现象
iOS 点击底部输入框，键盘弹起但页面不滚动，输入框被挡；Android 偶发 body 被顶变形。

### 方案

```js
// iOS：聚焦时滚到可视区
input.addEventListener('focus', () => {
  setTimeout(() => input.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
})
```

```css
/* 用 svh 防键盘弹起时 100vh 布局被顶飞 */
.chat-room { height: 100svh; }
```

!!! danger "坑：iOS 键盘收起后页面留白"
    键盘收起有时页面不回弹，监听 `focusout` 手动 `window.scrollTo(0, 0)`。

---

## 四、滚动与手势冲突

### 现象
页面整体跟着横滑抽屉动；`touchmove` 里 `preventDefault` 报 passive 警告 + 卡顿；下拉刷新误触。

### 方案（2026 最佳实践：用 CSS 声明意图）

```css
.drawer-body { touch-action: pan-y; }     /* 只允许纵向，横滑交给组件 */
.horizontal-scroll { touch-action: pan-x; }
.prevent-bounce { overscroll-behavior: contain; }  /* 阻止滚动链到外层 */
```

```js
// 确实需要拦截时，显式声明 passive:false
el.addEventListener('touchmove', e => e.preventDefault(), { passive: false })
```

!!! danger "坑：整页 overflow 拉扯"
    内层滚动区设 `overscroll-behavior: contain` 防止"滚到底还带着外层滚"（橡皮筋穿透）。

---

## 五、点击与 300ms 延迟

### 现象
点击响应慢半拍（历史遗留）。

### 方案
- 现代浏览器（viewport 正确设 `width=device-width`）**默认无延迟**，无需处理。
- 保险：`touch-action: manipulation` 关掉双击缩放延迟。
- **别用** `user-scalable=no` 来"解决"——2026 无障碍合规会扣分。

---

## 六、字体与排版兼容

| 坑 | 现象 | 方案 |
|----|------|------|
| iOS 字体回退 | 中文显示为系统苹方，英文可能 San Francisco | 显式 `font-family` 含 `-apple-system, "PingFang SC"` |
| 安卓字体不一致 | 各厂商默认字体不同 | 指定 `"Microsoft YaHei", "Noto Sans CJK SC"` |
| `font-weight: 300` 失效 | 部分安卓无细体 | 不依赖极细字重 |
| 数字/英文两端不齐 | iOS 默认开启 `font-feature` | 按需关 `font-variant-numeric` |

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC",
               "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}
```

---

## 七、图片与媒体

| 坑 | 方案 |
|----|------|
| 长图/大图 OOM（安卓） | 限制单图尺寸、用 WebP、`loading="lazy"` |
| iOS `position:fixed` 视频全屏后定位错 | 视频用 `playsinline` 防止自动全屏 |
| 自动播放被禁 | 绑定用户手势后 `play()` |
| 微信里图片长按识别 | 加 `oncontextmenu` 或 `pointer-events` 控制 |

```html
<video src="x.mp4" playsinline webkit-playsinline muted></video>
```

---

## 八、WebView 专项（Hybrid 兼容性）

> WebView 是兼容性重灾区：同一页面在系统浏览器正常，在微信/抖音里就怪。详见 [真机调试与桥协议](debug-hybrid.md)。

| 坑 | 现象 | 方案 |
|----|------|------|
| 内核老旧 | 不支持 `dvh`/`@container` | 能力检测 + `@supports` 降级 |
| 缓存激进 | 发版后用户还是旧 JS | 加版本号/`clearCache`，或离线包 |
| 路由 hash 丢失 | 微信分享后 URL 被改写 | 用 `history` 模式 + 服务端兜底，或统一用 query |
| JS Bridge 异步 | 调用原生方法拿不到返回 | 用 Promise 封装 + 超时 |
| 键盘遮挡 | 同 iOS 问题 | 同 §三 |

!!! danger "坑：只在 Chrome 测就上线"
    微信(X5/系统 WebView)、抖音、支付宝各有差异。**上线前必须在目标 App 真机测**（见 [debug-hybrid](debug-hybrid.md)）。

---

## 九、厂商 ROM 差异（安卓）

| 厂商 | 典型坑 |
|------|--------|
| 小米/红米 | 通知栏/手势区侵占；字体缩放影响 `rem` |
| 华为 | WebView 版本老；`safe-area` 表现不一 |
| OPPO/vivo | 底部手势条高，留白要足 |
| 三星 | 折叠屏展开态宽度突变（容器查询！） |

!!! tip "统一策略"
    不针对单厂商特判（维护爆炸），而是**按能力检测 + 安全区 + 流式布局**普适解决，覆盖 95% 机型。

---

## 十、兼容性处理最佳实践清单

1. **viewport meta 正确**：`width=device-width, viewport-fit=cover`。
2. **视口高度用 `dvh/svh`**，弃用裸 `100vh`。
3. **安全区用 `env()` + 兜底**。
4. **手势用 `touch-action`**，少 `preventDefault`，必要处 `passive:false`。
5. **1px 用 hairline**，不转 vw。
6. **高清图 `srcset`** 多倍图。
7. **能力检测 + `@supports` 降级**，不靠 UA 嗅探。
8. **真机多 App 测试**，不只看 Chrome。
9. **字体栈显式声明** 跨平台。
10. **不依赖极细字重/罕见特性**，降级方案兜底。

!!! danger "坑：用 UA 嗅探判断机型"
    UA 可被改、易误判、维护成本高。**优先用特性检测**（`'dvh' in document.documentElement.style`），UA 只作最后手段。

---

## 十一、速查：现象 → 根因 → 方案

| 现象 | 根因 | 方案 |
|------|------|------|
| 刘海挡内容 | 未处理安全区 | `viewport-fit=cover` + `env()` |
| 满屏滚动条 | 100vh 含地址栏 | `100dvh` |
| 输入框被键盘遮 | iOS 不自动滚 | `scrollIntoView` + `svh` |
| 横滑带整个页 | touch 冲突 | `touch-action` |
| 300ms 延迟 | 双击缩放 | `touch-action:manipulation` |
| 键盘收起留白 | iOS 回弹异常 | `focusout` 滚回顶 |
| 微信里旧代码 | 缓存激进 | 版本号/离线包 |
| 安卓边框粗 | DPR 非整数 | hairline |
| 视频自动全屏 | iOS 默认 | `playsinline` |
| 字体不对 | 缺字体栈 | 显式 `font-family` |
