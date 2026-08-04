# ⚡ 浏览器渲染原理与性能总纲

> 把 [HTML/CSS 核心术语](html-css/glossary.md) 里的"重排/重绘/合成"、**CSS 布局**的盒模型、**JS** 的事件循环串成一条"页面为什么快/慢"的完整链路。依据 **Web 性能工作组（W3C）**、**web.dev / Chrome 团队文档**、**MDN**。
>
> 适用：中级打底、高级进阶——所有想让页面"不卡"的开发者。

---

## 一、从输入 URL 到像素：关键渲染路径

```
URL → DNS → TCP/TLS → HTML 响应
  → 解析 HTML 建 DOM 树
  → 解析 CSS 建 CSSOM 树
  → 合成 Render Tree（渲染树）
  → 布局 Layout（计算每个盒子位置大小）  ← 重排 reflow
  → 绘制 Paint（填充像素：颜色/文字/阴影）← 重绘 repaint
  → 合成 Composite（分层交给 GPU）        ← 合成层
```

!!! info "三个核心概念"
    - **重排（Reflow）**：几何变化（宽高/位置）→ 最贵，会触发后续重绘。
    - **重绘（Repaint）**：外观变化（颜色/visibility）→ 比重排便宜。
    - **合成（Composite）**：`transform`/`opacity` 改的只走 GPU 合成 → 最便宜，不触发前两者。

---

## 二、核心 Web 指标（Core Web Vitals）

| 指标 | 含义 | 优秀值 | 优化方向 |
|------|------|--------|----------|
| **LCP** 最大内容绘制 | 主内容渲染时间 | < 2.5s | 图片懒加载、预加载关键资源、SSR |
| **CLS** 累积布局偏移 | 视觉稳定性 | < 0.1 | 图片设宽高、预留空间防跳动 |
| **INP** 交互到下一次绘制 | 响应延迟（取代 FID） | < 200ms | 减少长任务、拆分 JS |

!!! danger "死角 1：CLS 由"无尺寸的图片/异步插入"引发"
    图片不写 `width/height` 或 `aspect-ratio`，加载后撑开布局导致文字下移 → CLS 飙升。养成给媒体定尺寸的习惯（见 [CSS 布局](html-css/layout.md)）。

---

## 三、JS 与渲染的关系

JS 是单线程，长任务会阻塞渲染（用户感觉"卡死"）。

```js
// 长任务：同步循环 100ms 阻塞渲染
for (let i = 0; i < 1e7; i++) {}

// 优化：拆分 + requestAnimationFrame / 分片
function chunk(task, i = 0) {
  if (i >= task.length) return
  doOne(task[i])
  requestAnimationFrame(() => chunk(task, i + 1))  // 让出主线程
}
```

!!! tip "用 Web Worker 搬走重计算"
    加密/解析/图像处理放 `Web Worker`（见 [JS 高级进阶](js/advanced-topics.md)），主线程只管 UI，不卡。

!!! danger "死角 2：强制同步布局（Layout Thrashing）"
    读写交替触发多次重排：
    ```js
    for (const el of items) {
      el.style.width = el.offsetWidth + 10 + 'px'; // 写后立刻读 → 强制重排
    }
    ```
    先**批量读**、再**批量写**，避免读写交替。

---

## 四、网络层性能（前后端协作）

| 手段 | 说明 |
|------|------|
| 压缩 | 后端开 gzip/brotli |
| 缓存 | `Cache-Control: max-age` + 文件哈希（构建产物带 hash） |
| HTTP/2 | 多路复用，减少连接开销 |
| 预加载 | `<link rel="preload">` 关键 CSS/字体 |
| 懒加载 | `loading="lazy"` 图片 / `IntersectionObserver` |

!!! info "前端构建优化"
    code splitting（路由级懒加载）、tree-shaking（ESM 静态分析）、按需引入组件库——属于 [工程化](engineering/index.md) 范畴。

---

## 五、常见性能反模式

| 反模式 | 后果 | 修正 |
|--------|------|------|
| 频繁改 DOM 样式（循环里） | 多次重排 | 用 `class` 批量切、或 `transform` |
| 监听 scroll 不节流 | 卡顿 | `rAF` + 节流（见 [JS 高级进阶](js/advanced-topics.md)） |
| 大列表全量渲染 | 卡死 | 虚拟滚动（只渲染可见项） |
| 滥用 `box-shadow` / `filter` | 重绘贵 | 限制使用、用 `will-change` 谨慎提示合成层 |
| 同步加载巨量 JS | LCP 差 | 拆包、懒加载、`<script defer>` |

!!! danger "死角 3：will-change 不能乱加"
    给太多元素加 `will-change: transform` 会创建大量合成层，反而吃内存。只在"即将动画"的元素上用，动画结束移除。

---

## 六、性能优化自检清单

- [ ] 懂关键渲染路径（DOM/CSSOM/布局/绘制/合成）
- [ ] 知道重排 > 重绘 > 合成，优先 `transform/opacity`
- [ ] 图片有尺寸防 CLS，用懒加载
- [ ] 避免 Layout Thrashing（读写分离）
- [ ] 长任务用 rAF/Worker 拆分
- [ ] 后端开了压缩 + 缓存 + HTTP/2
- [ ] 关注 LCP / CLS / INP 三个指标

> 配套：[CSS 布局](html-css/layout.md) 实践；[Web API](js/web-api.md) 的 rAF / IntersectionObserver；[工程化](engineering/index.md) 的打包优化。
>
> 延伸：**浏览器原生优化 API 实战手册**（[advanced/browser-optimize-api.md](advanced/browser-optimize-api.md)）—— preload/IntersectionObserver/Web Worker/ResizeObserver/Service Worker 等原生 API 的用法场景与避坑，以及 [前端热门第三方库总览](libraries/index.md)（可视化/大屏/状态/请求/动画选型）。
