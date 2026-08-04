# 音视频处理（前端 / PC 客户端）

**难点**：音视频是公认高门槛业务——播放、截帧、压缩、水印、转封装。前端**客户端处理**能省服务端转码成本，但兼容性（WebCodecs / MediaRecorder / captureStream）坑很多；服务端转码选型又是另一套（见 [Java 音视频章节](../java/media-processing.md)）。

**最佳实践**：小文件轻量处理走客户端（canvas 截帧、MediaRecorder 导出）；转码/多档/切片走服务端或云转码。本 demo 演示"选片→播放→截帧→导出片段"。

<iframe src="../../../demos/pc-media-processing.html" height="420" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **截帧**：`video` 当前帧用 `ctx.drawImage(video, ...)` 画到 canvas，再 `canvas.toDataURL()` / `toBlob()` 导出 PNG（demo 已实现）。
- **客户端压缩/水印**：`canvas.captureStream(fps)` + `MediaRecorder` 录制成 WebM（demo 的"导出 3s 片段"）；加水印就是在每帧 `drawImage` 前先画文字/图片。
- **WebCodecs（新）**：`VideoEncoder/VideoFrame` 可控性最强（逐帧编码、硬编），但 Safari 支持晚（16.4+）、兼容性差 → 生产做特性检测降级到 MediaRecorder。
- **格式兼容**：`.mp4` 在 Safari 原生支持、Chrome 也能播；`.webm` Chrome 支持、Safari 不支持 → 检测 `video.canPlayType`。
- **大文件**：别在浏览器里转码大视频（内存/性能顶不住），上传服务端异步转（[Java 分片上传](../java/chunk-upload.md) + 云端转码）。

**踩坑**

- `captureStream` 在视频未 `play` 时黑屏 → 先 `play()` 再录。
- iOS Safari 对 `MediaRecorder` 的 codec 限制严，仅支持特定组合 → 特性检测 `MediaRecorder.isTypeSupported`。
- canvas 导出受**跨域污染**限制：跨域视频不配 CORS 则 `toBlob` 抛 `SecurityError` → 视频加 `crossOrigin="anonymous"` 且服务端返回 CORS 头。
- 移动端同样要做，但权限/内核差异更大（见 [移动端音视频](../../practice/mobile/mobile-media-processing.md)）。
