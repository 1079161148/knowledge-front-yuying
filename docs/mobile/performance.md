# ⚡ 移动端性能专项（首屏 / 长列表 / 弱网）

> 移动端性能比 PC 苛刻 10 倍：芯片弱、内存小、网络波动大、流量贵。本篇聚焦三大高频瓶颈——**首屏慢、长列表卡、弱网差**，每个给指标、定位法、解法、避坑。依据 **web.dev Core Web Vitals**、**MDN**、**Chrome DevTools**。
>
> 适用：中级优化、高级专项。前置：[移动端基础](basics.md)、[浏览器原生优化 API](../advanced/browser-optimize-api.md)、[性能总纲](../performance.md)。

---

## 一、移动端性能指标准则

| 指标 | 移动端及格线 | 说明 |
|------|-------------|------|
| **LCP**（最大内容绘制） | ≤ 2.5s | 首屏主图/文字 |
| **INP**（交互到下一帧，取代 FID） | ≤ 200ms | 点击/输入响应（2026 主用 INP） |
| **CLS**（累计布局偏移） | ≤ 0.1 | 图片/广告跳动 |
| **FID**（旧） | ≤ 100ms | 已废弃，看 INP |
| **TTFB** | ≤ 800ms | 服务端响应 |

!!! tip "移动端权重"
    首屏（LCP）和交互（INP）是移动端最该盯的两项；CLS 在图片懒加载/广告位最易超标。

---

## 二、首屏优化（LCP）

### 2.1 定位
DevTools → Performance 录制首屏，看**长任务、网络瀑布、布局偏移**。Lighthouse 跑移动端模拟给评分。

### 2.2 解法清单

```html
<!-- 1. 首图 preload（别 lazy！见 原生API §2.1） -->
<link rel="preload" href="/hero.avif" as="image">
<!-- 2. 关键字体 preload + crossorigin -->
<link rel="preload" href="/title.woff2" as="font" type="font/woff2" crossorigin>
<!-- 3. 首屏主 JS 别阻塞：defer / 路由级 import() -->
<script type="module" src="/main.js"></script>
```

```css
/* 4. 给图片预留尺寸防 CLS */
img { width: 100%; aspect-ratio: 16/9; }
/* 5. 屏外内容跳过渲染（长文/长列表） */
.section { content-visibility: auto; contain-intrinsic-size: 0 600px; }
```

- **图转 AVIF/WebP** + `srcset`（[原生API §2.2](../advanced/browser-optimize-api.md)）
- **路由级懒加载**：`() => import('./Page.vue')`，首屏只加载当前路由 chunk
- **骨架屏**：先出结构再填数据，弱网下体验优于白屏

!!! danger "坑 1：首屏图加 loading=lazy"
    首屏图 lazy 反而延迟、LCP 崩。首屏图 `loading="eager"` + `preload`，只有屏外图才 lazy。

!!! danger "坑 2：第三方脚本拖死 LCP"
    埋点/统计/广告同屏加载会抢带宽。用 `rel="preconnect"` 提前建连 + `requestIdleCallback` 延迟非关键脚本（[原生API §3.2](../advanced/browser-optimize-api.md)）。

---

## 三、长列表优化（卡顿/内存）

### 3.1 问题
普通 `v-for` / `.map` 渲染上万条 → DOM 节点爆炸、滚动掉帧、内存涨、甚至白屏。

### 3.2 虚拟滚动（唯一正解）

| 框架 | 库 |
|------|-----|
| Vue3 | `vue-virtual-scroller` / `vxe-table`（表格） |
| React | `react-window` / `react-virtuoso` |
| 通用 | 自写（只渲染可视区 + 前后 buffer） |

```js
// React 最小虚拟列表思路
const Row = ({ index, style }) => <div style={style}>第 {index} 行</div>
// <FixedSizeList height={600} itemCount={10000} itemSize={50}>{Row}</FixedSizeList>
```

### 3.3 其他手段

- **分页/无限滚动**：IntersectionObserver 触底加载下一批（[原生API §3.3](../advanced/browser-optimize-api.md)）
- **图片懒加载**：屏外 `loading="lazy"`
- **重计算移 Web Worker**：如列表筛选/排序放 Worker，避免阻塞主线程（[原生API §3.5](../advanced/browser-optimize-api.md)）
- **避免列表内大组件重渲染**：React `memo`、Vue `v-memo`，稳定 `key`

!!! danger "坑 3：虚拟列表里用 index 当 key"
    数据重排时 index key 导致复用错乱、状态串台。用**稳定业务 id** 当 key。

!!! danger "坑 4：onScroll 里同步重计算"
    滚动回调同步算 → 掉帧。用 `requestAnimationFrame` 节流或 `IntersectionObserver` 替代滚动监听。

---

## 四、弱网优化（2G/3G/地铁/电梯）

### 4.1 原则
弱网下"能看 > 好看"，优先保证**首屏结构与文字先出来**。

- **体积瘦身**：按需引入、拆包、gzip/brotli（[工程化](../engineering/index.md)）
- **骨架屏 + 乐观更新**：先渲染占位，数据回来再填
- **请求策略**：
  - 合并请求、减少往返（RTT 在弱网是最大成本）
  - 失败重试 + 指数退避
  - 关键请求 `AbortController` 取消旧请求（[原生API §5.1](../advanced/browser-optimize-api.md)）
- **离线缓存**：Service Worker 缓存壳 + 静态资源（见 [PWA](../mobile/pwa.md)）
- **数据缓存**：IndexedDB 存草稿/列表，断网可看（[原生API §4.2](../advanced/browser-optimize-api.md)）

!!! tip "弱网模拟"
    DevTools → Network → 选 `Slow 3G` / `Regular 3G` 复现；Chrome 还可设 `No throttling` 对比。

### 4.2 图片/媒体弱网降级

```html
<picture>
  <source srcset="hero.avif" type="image/avif">
  <img src="hero.jpg" loading="lazy" decoding="async">
</picture>
```
弱网可进一步用 `loading="lazy"` + 低清占位（LQIP）逐步替换。

---

## 五、内存与崩溃

| 现象 | 根因 | 方案 |
|------|------|------|
| 长列表滚久白屏 | 内存溢出（iOS 尤甚） | 虚拟滚动 + 及时 `dispose`/`unobserve` |
| 切页后卡顿 | 旧实例未销毁 | 组件卸载清定时器/Worker/图表实例（[原生API §3.3/§3.5](../advanced/browser-optimize-api.md)） |
| 大图 OOM | 单图过大 | 限制尺寸 + WebP + 分片 |

!!! danger "坑 5：组件卸载不清理"
    `setInterval`、`ResizeObserver`、`IntersectionObserver`、`Web Worker`、ECharts 实例必须在 `onUnmounted`/`useEffect cleanup` 里释放，否则内存只涨不跌。

---

## 六、速查：瓶颈 → 解法

| 瓶颈 | 指标 | 解法 |
|------|------|------|
| 首屏慢 | LCP > 2.5s | preload 首图/字体、懒加载非关键 JS、图转 AVIF、路由级 import |
| 交互卡 | INP > 200ms | 拆长任务、rAF、Web Worker、防抖 |
| 布局跳 | CLS > 0.1 | 图片预留尺寸、`content-visibility` 配 intrinsic-size |
| 长列表卡 | FPS < 50 | 虚拟滚动 + 稳定 key + memo |
| 弱网卡 | TTFB 高 | 体积瘦身、请求合并、重试、离线缓存 |
| 内存崩 | 白屏 | 虚拟滚动 + 卸载清理 |

---

## 七、与其他章节联动

- 原生 API 用法 → [浏览器原生优化 API](../advanced/browser-optimize-api.md)
- 打包/拆包/压缩 → [工程化总览](../engineering/index.md)
- 图片/字体 → [第三方库 · 大屏可视化](../libraries/index.md) 外，更看 [原生API §2](../advanced/browser-optimize-api.md)
- 离线缓存 → [PWA 离线实战](pwa.md)
