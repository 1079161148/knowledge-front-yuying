# Web Worker 大数据计算

**难点**：前端做大量数据计算（Excel 解析、图像像素处理、大数组聚合、加密）时，同步跑会**阻塞主线程** → 页面"假死"、输入框卡住、动画掉帧，用户体验直接崩。

**最佳实践**：重计算丢到 **Web Worker** 线程，主线程只管 UI；Worker 间靠 `postMessage` 通信；大数据**分块（chunk）上报进度**；用完 `terminate()` 释放。计算逻辑可用 `Blob` 内联，免部署额外文件。

<iframe src="../../../demos/pc-webworker.html" height="420" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **主线程 vs Worker**：点 demo 左侧"主线程同步算"时，期间按钮都点不动（假死）；右侧 Worker 算时 UI 完全流畅，还能看进度条。
- **分块上报**：把 300 万次循环按 10 万切块，每块 `postMessage` 进度，避免"算完才回一声"的黑盒等待。
- **Worker 限制**：不能碰 DOM、`window`、`document`；`localStorage` 不可用；通信是**结构化克隆**（传大对象有拷贝成本，可用 `Transferable` 零拷贝转移 `ArrayBuffer`）。
- **终止**：用户离开页面 / 取消计算要 `worker.terminate()`，否则线程常驻占资源。
- **模块化**：生产用独立 `xx.worker.js` + `new Worker(new URL('./xx.worker.js', import.meta.url))`（Vite/Webpack 支持）。

**踩坑**

- Worker 里 `console.log` 不会出现在主线程控制台 → 调试靠 `postMessage` 把日志发回。
- 频繁 `postMessage` 小消息有通信开销 → 控制上报频率（如每 5%）。
- `Transferable` 转移后原线程的 buffer 会被"清空"，别再读。
- 见 [Java 海量 Excel 流式导入](../java/excel-import.md) 后端侧的 OOM 防控思路对照。
