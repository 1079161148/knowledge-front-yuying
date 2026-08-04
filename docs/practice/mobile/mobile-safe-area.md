# 异形屏安全区（刘海 / 灵动岛 / Home 条）

**难点**：刘海/挖孔/灵动岛/底部手势条侵占内容区，按钮被挡、内容被遮，且各机型安全区尺寸不一。

**最佳实践**：`viewport-fit=cover` + `env(safe-area-inset-*)` 做内边距兜底，不写死固定值。

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```
```css
.safe-top    { padding-top: env(safe-area-inset-top); }     /* 刘海 / 灵动岛 */
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); } /* Home 指示条 */
/* 折叠屏不要假设固定断点，改用容器查询 @container */
```

**关键点（生产级细节）**

- 灵动岛是**可变区域**（通话/导航/录音时变大），固定 `padding-top` 不够，内容要在岛下居中对齐。
- 老安卓 WebView 不支持 `env()`，需 JS 读 `getComputedStyle(document.documentElement).getPropertyValue('--sat')` 兜底。
- `viewport-fit=cover` 才能让 `env()` 生效；不写的话安全区为 0，内容会贴边被刘海挡。
- 小程序 / uni-app 用 `safe-area-inset-bottom` 同样生效，App 端可用 `plus` 原生安全区 API 更准。

**踩坑**

- 只加 `padding-top` 忘了 `padding-bottom` → 底部 TabBar / 提交按钮被 Home 条遮（最常见）。
- 横屏时安全区左右也出现 → 四个方向都要兜底或用 `env(safe-area-inset-*) ` 全写。
- 沉浸式状态栏（statusBar）下 `inset-top` 含状态栏高度，别再额外加导航栏高度。
