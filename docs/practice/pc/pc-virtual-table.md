# 万行表格虚拟滚动

**难点**：中后台动辄几万行订单/日志，传统 `v-for` 全量渲染会生成几万个 DOM 节点 → 页面卡死、内存爆、滚动掉帧。

**最佳实践**：只渲染「可视区域 + 上下 overscan 缓冲」的行，用占位元素撑出滚动高度。这是 Element Plus `el-table-v2`、AG Grid、`@tanstack/react-virtual` 的底层原理。

<iframe src="../../../demos/pc-virtual-table.html" height="520" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- 容器定高 `overflow-y:auto`，内层 `phantom` 高度 = `总行数 × 行高`（撑出滚动条）。
- `scroll` 事件用 `requestAnimationFrame` 节流，计算 `start/end` 索引。
- `position:absolute; top: i*ROW_H` 定位每行，避免重排（reflow）。
- **行高固定**最简单；**动态行高**要用「测量缓存 + 二分查找偏移」，复杂度高一个量级（见 `@tanstack/virtual` 的 `measureElement`）。
- 不要给每行加复杂 `:hover` 动画，虚拟列表滚动时频繁增删 DOM，动画会闪。
- 横向万列（Excel 式）要用「横纵双向虚拟」，参考 `univer` / `handsontable`。

**踩坑**

- 数据更新后必须重置测量缓存，否则位置错位。
- 用 `index` 当 `key` 在排序/筛选后会状态串台，要用稳定业务 id。
- 移动端同样适用（见 [移动端虚拟列表](../mobile/mobile-virtual-list.md)）。
