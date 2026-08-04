# 实时看板卡顿优化

**难点**：监控大屏 / 实时交易面板，后端通过 WebSocket 每秒推送几十~几百条更新。常见错误：

```js
// ❌ 每条消息直接 setState + 全量重渲染 → 一秒几百次重排，CPU 100%，掉帧卡死
ws.onmessage = (e) => {
  const item = JSON.parse(e.data);
  list.unshift(item);
  render(); // React/Vue 整体重渲染，DOM 抖动
};
```

表现：看板越跑越卡、风扇狂转、内存上涨、数字"跳不动"、滚动卡顿。

**根因**：推送频率（~100/s） ≫ 浏览器渲染帧率（60fps ≈ 16ms/帧，最多 60 次/s）。**每条都渲染 = 渲染次数远超屏幕能显示的**，白白浪费 CPU 且引发频繁重排（reflow）。

**最佳实践**：核心是**「合帧 + 节流 + 减 DOM」**三板斧：

1. **合帧（批处理）**：WebSocket 消息只进**缓冲区队列**，用 `requestAnimationFrame` 每帧只消费一次，把一帧内所有更新合并成一次渲染。
2. **数据节流/采样**：非关键指标按时间窗口（如 1s）取最新值，不每条刷新。
3. **虚拟滚动**：长列表只渲染可视区（见 [万行表格虚拟滚动](pc-virtual-table.md)），DOM 节点恒定。
4. **避免重排**：用 `transform`/`opacity` 做动画；批量改样式走 `DocumentFragment`；数字更新走 `textContent` 而非重建节点。
5. **离屏暂停**：页面 `visibilitychange` 隐藏时停渲染、缓冲消息，回来再追。

<iframe src="../../../demos/pc-realtime-dashboard.html" height="480" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **rAF 合帧**：demo 模拟 100 条/s 推送，左侧"裸渲染"每条约一次 DOM 更新（卡顿、FPS 低）；右侧"rAF 合帧"每帧只渲染一次（FPS 稳 60，CPU 低）。
- **环形缓冲**：看板只关心"最近 N 条"，用定长数组（环形缓冲）丢弃旧数据，内存恒定不涨。
- **时间窗口聚合**：曲线图按 1s bucket 取均值/最新，避免每秒画几百个点（图表库也扛不住）。
- **Web Worker 预处理**：极端场景（如行情撮合）可在 Worker 里算指标，主线程只拿结果渲染。

**踩坑**

- `onmessage` 里 `JSON.parse` 高频调用有成本 → 后端推二进制（ArrayBuffer/Protobuf）或用 `JSON.parse` 批处理。
- 忘记 `rAF` 里 `cancelAnimationFrame` 清理 → 组件卸载后还在渲染，内存泄漏。
- 长列表不用虚拟滚动 → DOM 节点几万，任何一次 setState 都触发全量 diff，必卡。
- 数字跳动能见度用 `will-change` 但要节制，滥用反而占 GPU 内存。
- 断线重连没做退避 → 服务端被瞬时重连打爆（见 [请求层](pc-request-layer.md) 重试/退避）。
- 见 [Web Worker 大数据计算](pc-webworker.md) 把计算挪出主线程的通用思路。
