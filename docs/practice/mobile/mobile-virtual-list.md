# 长列表虚拟滚动

**难点**：聊天/订单/商品列表动辄上万条，传统 `v-for` / `.map` 全量渲染会生成几万个 DOM 节点 → 滚动掉帧、内存暴涨、iOS 直接白屏。

**最佳实践**：只渲染「可视区域 + 上下 overscan 缓冲」的行，用占位元素撑出滚动高度。这是 `vue-virtual-scroller`、`react-virtuoso`、`Vant List` 的底层原理。

<iframe src="../../../demos/m-virtual-list.html" height="560" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- 容器定高 `overflow-y:auto`，内层 `phantom` 高度 = `总行数 × 行高`（撑出滚动条）。
- `scroll` 用 `requestAnimationFrame` 节流；行定位用 `transform: translateY(i*ROW_H)` 避免重排。
- **用稳定业务 id 当 key**，绝不用 index（数据重排会状态串台）。
- 无限加载用 `IntersectionObserver` 或触底判断，加载完 `total += N` 再 `render`。
- 不等高列表（聊天气泡）要用「测量缓存 + 预估高度」，复杂度更高（见 `@tanstack/virtual` 的 dynamic measurement）。

**踩坑**

- iOS Safari 长列表即使虚拟滚动，绝对定位大量节点仍可能白屏 → 控制 overscan 不要过大（100 左右）。
- 下拉刷新回弹时 `scrollTop` 跳变 → 刷新期间暂停虚拟计算，结束后重置。
- 见 [PC 虚拟表格](../../practice/pc/pc-virtual-table.md) 横向对照。
