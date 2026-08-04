# 🧠 浏览器原生优化 API 实战手册（用法场景全列举）

> 现代浏览器自带大量"免费"的优化 API，不引第三方库就能显著提升性能与体验。本篇按**使用场景**逐个列举：干什么用、怎么写、什么时候用、坑在哪。依据 **MDN**、**web.dev / Chrome 团队文档**、**WICG 提案**。
>
> 适用：中级打底、高级进阶。前置：[浏览器渲染与性能总纲](../performance.md)、[JS 高级进阶](../js/advanced-topics.md)。

---

## 一、资源加载类（让首屏更快）

### 1.1 `<link rel="preload">` —— 提前加载关键资源

**场景**：首屏必需但被 CSS/JS 延迟发现的资源（字体、首图、关键脚本）。

```html
<!-- 预加载关键字体，避免 FOUT -->
<link rel="preload" href="/fonts/title.woff2" as="font" type="font/woff2" crossorigin>
<!-- 预加载首屏主图 -->
<link rel="preload" href="/hero.webp" as="image">
```

!!! danger "坑 1：preload 了却不用"
    预加载的资源 3 秒内没被使用，Chrome 会在 Console 警告并**浪费带宽**。只预加载真正首屏必需的。

!!! tip "as 属性必须正确"
    `as="font"` 必须用 `crossorigin`（字体跨域），`as="script"` 对应 JS，写错会被当成普通请求、失去优先级提升。

### 1.2 `<link rel="prefetch">` —— 空闲预取下一页

**场景**：用户大概率会去的下一页（如列表→详情、步骤向导下一页）。

```html
<link rel="prefetch" href="/next-page.html">
```

!!! info "与 preload 区别"
    preload 是**当前页面**立刻用；prefetch 是**未来页面**空闲用，优先级更低，不与当前资源抢带宽。

### 1.3 `<link rel="preconnect">` / `dns-prefetch` —— 提前建连

**场景**：知道要请求第三方域名（CDN、API、字体站），提前做 DNS+TCP+TLS 握手。

```html
<link rel="preconnect" href="https://api.example.com" crossorigin>
<link rel="dns-prefetch" href="https://cdn.example.com"> <!-- 老浏览器降级 -->
```

!!! tip "最多 6 个"
    同一页面 preconnect 超过 ~6 个会稀释收益甚至拖累，只给最关键的两个域名用。

### 1.4 `<link rel="modulepreload">` —— 预加载 ES Module

**场景**：用 Vite/Webpack 产物时，预加载入口依赖图里的关键 chunk。

```html
<link rel="modulepreload" href="/assets/vendor.mjs">
```

---

## 二、图片/媒体类（省流量、防跳动）

### 2.1 原生懒加载 `loading="lazy"`

**场景**：首屏外的图片、iframe，滚动到视口才加载。

```html
<img src="big.jpg" loading="lazy" alt="说明" width="800" height="600">
<iframe src="map.html" loading="lazy"></iframe>
```

!!! danger "坑 2：首屏图千万别加 lazy"
    首屏图的 `loading="lazy"` 反而延迟加载、拖慢 LCP。首屏图用 `loading="eager"`（默认）并配合 `preload`。

### 2.2 响应式图 `srcset` / `sizes` / `<picture>`

**场景**：不同屏宽/分辨率给不同图，避免手机拉原图。

```html
<img src="hero-800.jpg"
     srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w"
     sizes="(max-width: 600px) 400px, 800px"
     alt="hero">
```

### 2.3 `decoding="async"` —— 解码不阻塞

**场景**：大图解码时避免阻塞主线程。

```html
<img src="x.jpg" decoding="async">
```

---

## 三、渲染/主线程类（让交互不卡）

### 3.1 `requestAnimationFrame`（rAF）—— 跟渲染节奏对齐

**场景**：动画、随滚动/拖拽更新的视觉变化，必须放 rAF，否则掉帧。

```js
function animate() {
  el.style.transform = `translateX(${x}px)`
  x += 2
  if (x < 500) requestAnimationFrame(animate)
}
requestAnimationFrame(animate)
```

!!! danger "坑 3：别在 rAF 里做重计算"
    rAF 回调里跑重计算会吃掉本帧时间导致掉帧。重计算放 Web Worker，rAF 只做"把结果写到样式"。

### 3.2 `requestIdleCallback`（rIC）—— 空闲时做杂活

**场景**：埋点上报、非紧急的预处理、缓存预热等"可延后"任务。

```js
requestIdleCallback(() => {
  prefetchSuggestions()
}, { timeout: 2000 }) // 最迟 2s 内必须执行
```

!!! warning "兼容性 & 保底"
    Safari 不支持 rIC。用 `setTimeout` 兜底，或引 `requestIdleCallback` polyfill。iOS 用户量大时必须保底。

### 3.3 `IntersectionObserver` —— 高效监听进入视口

**场景**：无限滚动、曝光埋点、进入视口才初始化图表/视频、滚动动画触发。

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view')
      io.unobserve(e.target) // 只触发一次就停止观察
    }
  })
}, { threshold: 0.2 })
io.observe(document.querySelector('.card'))
```

!!! danger "坑 4：忘记 unobserve"
    持续观察不再需要的元素会累积回调、内存泄漏。一次性动画/曝光务必 `unobserve`。

### 3.4 `ResizeObserver` —— 监听元素尺寸变化

**场景**：自适应容器尺寸变化重绘图表、响应式组件内部布局。

```js
const ro = new ResizeObserver(entries => {
  for (const e of entries) chart.resize(e.contentRect.width)
})
ro.observe(container)
```

!!! danger "坑 5：ResizeObserver loop 死循环"
    回调里改尺寸触发新一轮观察 → 无限循环，Chrome 报 `ResizeObserver loop limit exceeded`。解决方案：用 `requestAnimationFrame` 把副作用推迟到下一帧。

### 3.5 `Web Worker` —— 主线程减负

**场景**：大数组排序、加解密、图片/音视频处理、PDF 解析等 CPU 密集任务。

```js
// main.js
const worker = new Worker('./compute.js')
worker.postMessage(bigData)
worker.onmessage = ({ data }) => render(data)

// compute.js
self.onmessage = ({ data }) => {
  const result = heavyCompute(data)
  self.postMessage(result)
}
```

!!! tip "现代写法：模块 Worker + 转移对象"
    用 `new Worker(url, { type: 'module' })` 支持 import；大数据用 `Transferable`（`postMessage(buf, [buf])`）零拷贝转移，避免结构化克隆卡顿。

---

## 四、缓存/存储类（减少重复请求）

### 4.1 `Cache Storage API` + `Service Worker` —— 离线/秒开

**场景**：PWA、静态资源离线缓存、二次访问秒开。

```js
// sw.js
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  )
})
```

!!! danger "坑 6：缓存不更新"
    忘了 `cache.add` 新版本或没做 `activate` 阶段 `caches.delete` 旧缓存，用户永远拿到旧 JS。务必设计版本化 cache name + skipWaiting/clients.claim。

### 4.2 `IndexedDB` —— 大结构化本地存储

**场景**：离线数据、草稿、大列表缓存（远大于 localStorage 的 5MB 上限）。

!!! tip "别裸写原生 API"
    原生 IndexedDB 回调嵌套反人类，直接用 `idb`（小封装）或 `Dexie`。

### 4.3 `localStorage` / `sessionStorage`

**场景**：小体积键值（token、用户偏好）；**别存大对象/敏感信息**（XSS 可读取）。

---

## 五、网络/并发类

### 5.1 `fetch` + `AbortController` —— 可取消请求

**场景**：组件卸载取消未完成的请求、搜索输入防抖取消旧请求。

```js
const ctrl = new AbortController()
fetch('/api/search?q=' + q, { signal: ctrl.signal })
  .catch(err => { if (err.name !== 'AbortError') throw err })
// 用户继续输入时：
ctrl.abort()
```

!!! danger "坑 7：组件卸载不取消请求"
    请求回来 setState 但组件已卸载 → React 报 `Can't perform a state update on unmounted component`（旧版）/ Vue 内存泄漏。务必在 `useEffect` cleanup 或 `onUnmounted` 里 `abort()`。

### 5.2 `fetch` + `ReadableStream` 流式响应

**场景**：大模型流式输出、大文件分块下载、进度展示。

```js
const res = await fetch('/api/stream')
const reader = res.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  appendChunk(value)
}
```

### 5.3 `WebSocket` / `EventSource`(SSE) —— 服务端推送

**场景**：实时通知、聊天、行情。SSE 是单向流式（更轻，自动重连）；需要双向用 WebSocket。

---

## 六、绘制/合成加速类

### 6.1 触发 GPU 合成层

**场景**：动画/过渡用 `transform`、`opacity`，避免 `top/left/width` 触发重排。

```css
/* 好：只走合成 */
.card { transition: transform .3s; }
.card:hover { transform: translateY(-4px); }

/* 差：触发重排重绘 */
.card:hover { top: -4px; }
```

### 6.2 `will-change` —— 提前提示浏览器

**场景**：元素即将持续动画时提示浏览器建合成层。

```css
.slider { will-change: transform; }
```

!!! danger "坑 8：will-change 滥用"
    滥用会长期占用 GPU 内存、反而变卡。动画结束及时移除（`will-change: auto` 或删 class）。

### 6.3 `content-visibility: auto` —— 跳过屏外渲染

**场景**：长列表/长文章，屏外内容不渲染，大幅降低首屏成本。

```css
.section { content-visibility: auto; contain-intrinsic-size: 0 600px; }
```

!!! warning "CLS 风险"
    不配 `contain-intrinsic-size` 会导致滚动条跳动、CLS 飙升。务必给出预估尺寸。

---

## 七、测量/诊断类（量化性能）

### 7.1 `Performance API` —— 埋点计时

**场景**：自定义指标、接口耗时、关键路径打点。

```js
performance.mark('start')
// ... 逻辑 ...
performance.mark('end')
performance.measure('task', 'start', 'end')
console.log(performance.getEntriesByName('task')[0].duration)
```

### 7.2 `PerformanceObserver` —— 监听长任务/LCP/CLS

**场景**：实时上报长任务（>50ms 卡顿）、监控 Core Web Vitals。

```js
const po = new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) reportLongTask(entry)
  }
})
po.observe({ type: 'longtask', buffered: true })
```

### 7.3 `Performance Navigation Timing` / `Resource Timing`

**场景**：统计白屏、DOMReady、资源加载耗时，定位慢资源。

---

## 八、其他实用原生 API

| API | 场景 | 注意 |
|-----|------|------|
| `Navigator.sendBeacon` | 页面卸载时可靠上报埋点（不阻塞卸载） | 比同步 xhr 更适合 `beforeunload` |
| `Page Visibility API` | 切后台暂停动画/视频/轮询 | `document.hidden` + `visibilitychange` |
| `Clipboard API` | 复制文本/图片 | 需 HTTPS + 用户手势触发 |
| `Fullscreen API` | 视频/大屏全屏 | 移动端兼容差异 |
| `Web Share API` | 调起系统分享面板 | 移动端支持好，桌面有限 |
| `BroadcastChannel` | 同域多标签页通信（购物车同步） | 比 localStorage 事件更干净 |
| `URLSearchParams` | 解析/拼接查询参数 | 替代手写正则 |
| `structuredClone` | 深拷贝（替代 JSON.parse(JSON.stringify)） | 支持 Date/Map/Set，不拷贝函数 |

---

## 九、速查：场景 → API 映射表

| 你想解决的问题 | 用哪个原生 API |
|---------------|---------------|
| 首屏图慢 | `preload` + 不 `lazy` + `srcset` |
| 下一页预取 | `prefetch` |
| 第三方域名慢 | `preconnect` |
| 首屏外图片 | `loading="lazy"` |
| 滚动动画/曝光 | `IntersectionObserver` |
| 容器尺寸变化重绘 | `ResizeObserver` |
| 大数据计算卡 | `Web Worker` + `Transferable` |
| 非紧急杂活 | `requestIdleCallback`（带兜底） |
| 动画掉帧 | `requestAnimationFrame` |
| 请求可取消 | `fetch` + `AbortController` |
| 流式输出 | `fetch` + `ReadableStream` / SSE |
| 离线秒开 | `Service Worker` + `Cache Storage` |
| 本地大存储 | `IndexedDB`（用 idb/Dexie） |
| 长列表渲染慢 | `content-visibility: auto` |
| 动画卡顿 | `transform/opacity` + `will-change`（适度） |
| 量化卡顿 | `PerformanceObserver` 长任务 |
| 卸载上报 | `sendBeacon` |
| 多标签同步 | `BroadcastChannel` |

---

## 十、避坑清单（Top 10）

1. **preload 不用 = 浪费**，只预加载首屏必需。
2. **首屏图别 lazy**，否则 LCP 崩。
3. **IntersectionObserver 记得 unobserve**，防泄漏。
4. **ResizeObserver 回调别同步改尺寸**，用 rAF 推迟防死循环。
5. **will-change 别全局滥用**，动画完移除。
6. **content-visibility 必配 contain-intrinsic-size**，防 CLS。
7. **组件卸载取消 fetch（AbortController）**，防内存泄漏。
8. **Service Worker 缓存要版本化 + 更新策略**，否则永远旧版。
9. **rIC 在 Safari 不支持**，必须 setTimeout 兜底。
10. **localStorage 不存敏感/大对象**，大存储走 IndexedDB。
