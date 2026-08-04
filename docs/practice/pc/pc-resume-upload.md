# 大文件断点续传

**难点**：几百 MB / GB 文件直接 `POST` 必超时；弱网中断要重传全部；同一文件重复传浪费带宽。

**最佳实践**：切片（5MB）→ 算文件内容 hash（spark-md5）→ 问后端"已传哪些片" → 只传缺失片 → 后端按序合并。暂停/刷新后可从断点续。

<iframe src="../../../demos/pc-resume-upload.html" height="460" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **hash 方案**：全文件 hash 慢（GB 级要几十秒）。生产用「抽样 hash」——头尾+中间各取几段算 partial hash，速度提升 10 倍，碰撞率可接受；或 `Web Worker` 算不卡主线程。
- **秒传**：先查 hash 是否存在，存在直接返回已完成，不发字节。
- **并发传片**要限并发数（如 3~5）+ 错误重试，不然把浏览器/网关打满。
- **合并**：后端用流式 `append` 写，别一次性读进内存；合并完删分片。
- **续传**：前端存「已传分片 index → localStorage / IndexedDB」，刷新后查询缺失片续传。

**踩坑**

- 切片大小 < TCP 窗口 / 网关 body 限制会很多小请求；太大则单片失败成本高 → 5MB 是经验值。
- 弱网下 `fetch` 进度拿不到 → 用 `XMLHttpRequest` 的 `upload.onprogress`。
- 文件修改后 hash 变了，但文件名没变 → 必须用内容 hash 而非文件名做 key。
- 见 [Java 分片上传 + 断点续传](../java/chunk-upload.md) 后端配合。
