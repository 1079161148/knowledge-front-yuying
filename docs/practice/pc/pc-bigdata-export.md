# 前端大数据导出

**难点**：运营/报表场景常要导出几万~上百万行数据。常见错误写法：

```js
// ❌ 一次性拼字符串 + 同步生成 Blob → 主线程卡死、页面假死
let csv = 'id,name,amount\n';
for (const row of hugeArray) csv += row.join(',') + '\n';
const blob = new Blob([csv]); // 百万行时这里直接内存爆炸 + 主线程阻塞数秒
```

表现：导出按钮点了"没反应"→ 页面冻结 → 用户狂点 → 浏览器提示"页面无响应"。

**最佳实践**：导出是**大量字符串拼接 + 内存分配**，本质属于重计算 IO，应做到：

1. **数据分批拉取**：后端分页/游标拉，不一次性 `SELECT *` 全量进前端内存（见 [后端流式导出](../java/excel-import.md) 思路对照）。
2. **主线程不背锅**：用 **Web Worker** 做字符串拼接，或至少用 `requestIdleCallback` / 分块 `setTimeout` 切片，避免长任务。
3. **流式写盘**：用 [StreamSaver.js](https://github.com/jimmywarting/StreamSaver.js) 边生成边写 `WritableStream`，内存占用恒定，不被 Blob 撑爆。
4. **CSV 优先，Excel 谨慎**：纯 CSV 用 `TextEncoder` + 流式即可；真要 `.xlsx` 用 `ExcelJS`（支持流式 `stream.xlsx.write`）。

<iframe src="../../../demos/pc-bigdata-export.html" height="460" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **Worker 内拼接**：demo 右侧 Worker 把 50 万行分批拼 CSV，主线程全程可滚动/点按钮；左侧主线程同步拼同样数据会冻结数秒（故意对比）。
- **流式落盘**：用 `StreamSaver.createWriteStream('export.csv')` 拿到 `WritableStream`，`writer.write(chunk)` 边拼边写，进度条匀速走，内存不涨。
- **字段转义**：CSV 字段含逗号/引号/换行必须包引号并双写引号（`"a""b"`），否则 Excel 打开错位——demo 已处理。
- **数字精度**：大额/长数字（如订单号 19 位）用 CSV 打开会被 Excel 转科学计数法 → 字段前加制表符 `\t` 或导出 `.xlsx` 并设 `cell.style.numFmt`。
- **取消**：用户点"取消导出"要 `worker.terminate()` + `writer.abort()`，否则流一直挂着。

**踩坑**

- `Blob` 一次性生成百万行 → 内存峰值翻倍（字符串 + Blob 同时驻留），低端机直接 OOM 标签页崩溃。
- Worker 里不能 `import` 业务 npm 包（除非打包进 worker 或用 `importScripts`）→ 简单拼接逻辑建议手写/内联。
- 浏览器对单文件下载有大小限制（部分移动端 ~2GB），超大导出应**分卷**或走后端生成直链。
- `StreamSaver` 依赖 `serviceWorker` 做中转，需站点 `https`/`localhost` 且 SW 注册成功，否则降级为内存 Blob（仍有上限）。
- 见 [Web Worker 大数据计算](pc-webworker.md) 把重活丢线程的通用范式。
