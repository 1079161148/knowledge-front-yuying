# 📦 包体积与启动深度优化

> 包体积和启动速度是移动端最影响留存的两个指标（首屏每慢 1s 流失显著）。本篇讲：H5 拆包与 Tree-shaking、H5/小程序/原生 App 的启动链路、主线程长任务治理、TTI 优化、各框架专项。依据 **web.dev 启动性能**、**webpack/Rollup 官方**、**小程序官方分包**、**React Native Hermes/Flutter 官方**。前置：[性能专项](performance.md)、[监控与上线](monitoring.md)。

---

## 一、指标定义（先统一口径）

| 指标 | 含义 | 参考阈值 |
|------|------|----------|
| FCP | 首次内容绘制 | < 1.8s |
| LCP | 最大内容绘制 | < 2.5s |
| TTI | 可交互时间 | < 3.9s |
| TBT | 总阻塞时间（长任务累计） | < 200ms |
| 冷启动（原生） | App 进程创建→首屏可交互 | 越低越好 |

> TBT 反映**主线程长任务**影响，是 INP 的近亲（见 [性能·INP](performance.md)）。

---

## 二、H5 包体积优化（前端可控）

### 2.1 路由级懒加载（最有效）

```ts
// Vue Router / React Router 用动态 import，拆分首屏
const Home = () => import('./pages/Home.vue')
const Detail = () => import('./pages/Detail.vue')
```

> 首屏只加载当前页 JS，其余按需。配合构建分析（`rollup-plugin-visualizer`）看谁占了体积。大厂首屏 JS 卡 < 200KB（见 [监控·体积门禁](monitoring.md) §5.1）。

### 2.2 Tree-shaking 与按需引入

```ts
// 错误：引入整个库
import _ from 'lodash'
// 正确：按需（或 lodash-es）
import debounce from 'lodash/debounce'
```

- 用 ES Module（`"sideEffects": false` 让打包器安全摇树）。
- UI 库按需：`vant` 用 `unplugin-vue-components` 自动按需；`antd-mobile` 同。

### 2.3 依赖治理

- 删未用依赖；大库换小的（如 `moment` → `dayjs`，`lodash` → 按需）。
- 用 `compression`（Brotli/gzip）减小传输体积（服务端/CDN 开）。

!!! danger "坑 1：polyfill 全量引入"
    `@babel/preset-env` 不配 `useBuiltIns:'usage'` → 打进全部 polyfill。改 `usage` 只补目标浏览器缺的（见 [兼容性·babel](compatibility.md) §四），体积可省几十 KB。

---

## 三、启动链路与长任务治理

### 3.1 长任务（>50ms）是卡顿元凶

```js
// 用 PerformanceObserver 抓长任务，定位卡点
new PerformanceObserver((list) => {
  for (const t of list.getEntries()) console.warn('Long Task', t.duration, t.startTime)
}).observe({ type: 'longtask', buffered: true })
```

治理手段：
- **拆分**：大循环分片（`requestIdleCallback` / `setTimeout` 切片）。
- **延迟**：非首屏逻辑（埋点、预取）放到 `requestIdleCallback` 或 `load` 后。
- **Web Worker**：把重计算（解析/排序）丢 Worker，不占主线程（见 [原生 API](../advanced/browser-optimize-api.md)）。

### 3.2 首屏阻塞资源

- JS 用 `defer`/`type=module`（默认 defer），别阻塞解析。
- 关键 CSS 内联，非关键 CSS 异步加载。
- 字体 `font-display: swap`，避免 FOIT 白字（见 [性能·字体](performance.md)）。

---

## 四、小程序包体积（官方）

- **主包 ≤ 2MB、整包 ≤ 20MB**（官方硬限）。
- 分包 + 独立分包 + 预下载（见 [小程序原生开发](miniprogram.md) §三）。
- 代码：用微信开发者工具"代码依赖分析"剔未引用；图片走 CDN 不出包。

!!! danger "坑 2：tabBar 图标/大图塞进包"
    图片是最大的包体积来源。tabBar 图标用合适尺寸（建议 81×81），其余图片全走 CDN。整包超 20MB 无法发布。

---

## 五、原生 App 启动优化（H5 嵌 WebView 场景）

### 5.1 冷启动链路

```
进程创建 → Application 初始化 → UI 创建 → WebView 初始化 → H5 加载 → 首屏可交互
```

优化点：
- **Application 初始化瘦身**：SDK 懒加载/子线程初始化（推送、统计别全堆主线程）。
- **WebView 预创建**：App 启动就预热一个 WebView 实例池，进 H5 页直接复用，省初始化（数百 ms）。
- **离线包**：H5 资源走本地（见 [H5+WebView 离线包](h5-webview.md) §六），首屏秒开。

### 5.2 框架专项

| 框架 | 优化 |
|------|------|
| React Native | 开 **Hermes** 引擎（字节码，启动快、内存低）；启用 `inlineRequires` 懒加载模块 |
| Flutter | 减小基础包；用 `--split-debug-info`；避免过多 `Opacity`/大 `Shader` |
| uni-app(app-vue) | nvue 页用原生渲染；离线打包 SDK 瘦身 |
| 纯 H5 | 见第二/三节 |

!!! tip "WebView 预创建是混合 App 首屏提速最大杠杆之一**
    实测预热 WebView 可省 300-800ms。注意池大小控制内存（iOS 内存紧，池 1-2 个即可）。

---

## 六、防劣化（CI 卡门禁）

- 构建后体积检查（首屏 chunk ≤ 阈值，见 [监控 §5.1](monitoring.md)）。
- Lighthouse CI 移动端分数门禁（性能/可访问性）。
- 依赖变更审查：新增大依赖需评审。

---

## 七、速查：体积/启动问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| 首屏 JS 大 | 未懒加载/全量引入 | 路由懒加载 + 按需 |
| 启动卡 | 主线程长任务 | 拆片/Worker/延迟 |
| 小程序传不上 | 主包>2MB/整包>20MB | 分包 + 图片走 CDN |
| WebView 白屏久 | 未预热/无离线包 | 预创建 + 离线包 |
| RN 启动慢 | 未开 Hermes | 启用 Hermes |

---

## 八、章节关联

- 性能/INP/长列表 → [性能专项](performance.md)
- 监控/体积门禁 → [监控与上线](monitoring.md)
- 小程序分包 → [小程序原生开发](miniprogram.md)
- Web Worker/原生 API → [浏览器原生优化 API](../advanced/browser-optimize-api.md)
- Bridge/离线包 → [H5 + WebView 混合开发](h5-webview.md)
