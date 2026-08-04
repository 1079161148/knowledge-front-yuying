# 图片懒加载 + 骨架屏

**难点**：列表/瀑布流图片多，一次性加载卡顿、流量爆；图未加载时高度塌陷导致布局跳动（CLS 扣分、滚动错位）；弱网下白块久等。

**最佳实践**：`IntersectionObserver` 监听进入视口才加载（`data-src` → `src`）；加载前显示**骨架屏占位**，`aspect-ratio` 预留高度防 CLS；失败时占位图；弱网超时降级。

<iframe src="../../../demos/m-lazy-skeleton.html" height="480" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **懒加载**：`new IntersectionObserver` 监听卡片，`isIntersecting` 时把 `data-src` 赋给 `src` 并 `unobserve`（只加载一次）。
- **骨架屏**：加载前 `skeleton` 流光占位，`aspect-ratio: 1` 预留高度，图到位才替换，避免 CLS。
- **CLS 防控**：`aspect-ratio` 或预留 padding 让占位与真图同高，布局零跳动（Core Web Vitals 重要指标）。
- **多倍图**：`srcset` + `WebP/AVIF` 按 DPR/网络下发，省流量。

**踩坑**

- `loading="lazy"` 原生懒加载在 Safari 旧版不支持，且首屏图也会被懒 → 关键图用 `loading=eager`。
- 骨架屏闪一下就消失（数据秒回）比白屏还难受 → 最短展示 300ms。
- 图片 404 不处理会一直转圈 → `onerror` 换占位图并停止重试（防死循环请求）。
- 见 [弱网体验](mobile-weak-network.md) 与 [瀑布流](mobile-waterfall.md) 衔接。
