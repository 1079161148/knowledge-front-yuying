# 🚀 前端性能优化面试题

> 面试高频且**能落地、能讲量化结果**的板块。不只背「用缓存」，要能讲「怎么测、怎么定位、优化前后指标对比」。答案依据 **[Web Vitals](https://web.dev/articles/vitals)**、**[Chrome Developers 性能文档](https://developer.chrome.com/docs/devtools/performance)**、**[MDN 性能](https://developer.mozilla.org/zh-CN/docs/Web/Performance)**。

---

## 1. 指标体系与测量

#### Q1：Core Web Vitals 三大指标及优化？
- **LCP**（最大内容绘制 ≤2.5s）：优化主资源（SSR、图片优先级、预连接）。
- **INP**（交互到下一次绘制 ≤200ms，取代 FID）：拆长任务、减少主线程阻塞。
- **CLS**（累积布局偏移 ≤0.1）：图片/广告预留尺寸、`aspect-ratio`。
- 其他：FCP、TTFB、TBT。

#### Q2：怎么量化性能？用什么工具？
- 实验室：Lighthouse、Chrome DevTools Performance、WebPageTest。
- 真实用户（RUM）：`PerformanceObserver` 采集 Web Vitals 上报；长任务 `PerformanceLongTaskTiming`。
- 关键 API：`Navigation Timing`、`Resource Timing`、`Performance.now()`。

## 2. 加载性能（网络与体积）

#### Q3：减少首屏白屏的手段？
- 路由级**代码分割**（`import()`懒加载非首屏）。
- 资源：`preconnect`/`dns-prefetch` 提前建连；关键 CSS 内联；图片 `loading=lazy` + WebP/AVIF。
- 缓存：强缓存 + 协商缓存；静态资源 content-hash 文件名。
- 渲染：SSR / 流式渲染（Next.js `streaming`）、骨架屏防 CLS。

#### Q4：Tree Shaking 为什么有时不生效？
- 前提：ESM 静态结构 + `sideEffects: false` + 不用 `require`/`eval`。
- 坑：引入 `lodash`（全量）而非 `lodash-es`；副作用文件未标记；Babel 把 ESM 转 CJS 会破坏。

#### Q5：图片优化全方案？
- 格式：WebP/AVIF 替代 PNG/JPG；图标用 SVG/Iconfont。
- 加载：`srcset` + `sizes` 响应式、`loading="lazy"`、首屏 `fetchpriority="high"`。
- 处理：CDN 实时裁剪、压缩、渐进式 JPEG。

## 3. 运行时性能（渲染与 JS）

#### Q6：长任务（Long Task）怎么定位与拆分？
- 定义：主线程阻塞 >50ms 的任务；用 `PerformanceObserver` 监听 `longtask`。
- 拆分：`requestIdleCallback` / `setTimeout(0)` 切片；耗时计算移入 **Web Worker**（见 [Web Worker 实战](../practice/pc/pc-webworker.md)）。
- React：用 `useDeferredValue`/`startTransition` 把低优先级更新让出主线程。

#### Q7：大量 DOM / 长列表怎么优化？
- **虚拟滚动**：只渲染视口内节点（万行表格见 [虚拟滚动实战](../practice/pc/pc-virtual-table.md)、[移动端虚拟列表](../practice/mobile/mobile-virtual-list.md)）。
- 文档片段 `DocumentFragment` 批量插入；事件委托减少监听数。

#### Q8：重排重绘如何避免？
- 读写分离，避免强制同步布局（连续 `offsetTop` 读+写）。
- 动画用 `transform/opacity`（仅合成层）；`will-change` 提示但勿滥用（显存）。

## 4. 内存与流畅度

#### Q9：内存泄漏常见原因与排查？
- 原因：未清的 `setInterval`/`addEventListener`、`ECharts` 实例未 `dispose`、闭包持有大对象、Vue 组件卸载未清理副作用。
- 排查：DevTools Memory 快照对比、Performance Monitor 看 JS Heap 是否只涨不跌。

#### Q10：怎么让动画 60fps 稳定？
- 只动 `transform/opacity`；`will-change` 提层；`requestAnimationFrame` 对齐帧；避免动画中触发布局。
- 复杂时间线用 GSAP（见 [插件面试题](frontend-plugins.md)）。

## 5. 工程化与监控

#### Q11：构建产物优化手段？
- 分包：`splitChunks` 抽 vendor；`manualChunks` 按路由/库拆。
- 压缩：gzip/brotli；`Terser` 去 console；CSS 压缩 + PurgeCSS。
- 现代构建：Vite（见 [插件面试题](frontend-plugins.md)）开发态基于 ESM 秒级冷启。

#### Q12：怎么建立性能监控闭环？
- RUM 上报 Web Vitals + 资源加载耗时 + 长任务。
- 设告警阈值；发版对比指标；用 Lighthouse CI 卡门禁（见 [工程化面试题](engineering.md)）。

## 6. 实战量化话术（面试加分）

!!! tip "讲性能题的黄金结构"
    1. **现象**：「首屏 LCP 4.2s、列表滚动掉帧」
    2. **定位**：DevTools/Lighthouse/Performance 找到瓶颈（主线程长任务、未压缩大图）
    3. **手段**：代码分割 + 虚拟滚动 + 图片 WebP
    4. **结果（量化）**：「LCP 4.2s → 1.3s，长任务从 12 个 → 2 个，Crash 率降 40%」

## 7. 下一步

- 浏览器原理看 [浏览器与网络面试题](frontend-browser-network.md)；工程化看 [工程化面试题](engineering.md)。
- 实战案例看 [前端 PC 业务实战](../practice/pc/index.md)、[移动端实战](../practice/mobile/index.md)。
