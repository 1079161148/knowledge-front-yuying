# 直播（低延迟播放 / 推流 / 连麦）

**难点**：直播链路 = 主播推流（RTMP）→ 服务端转封装 → 观众拉流。观众端浏览器**原生不支持 RTMP/FLV**，要引 `hls.js` / `flv.js`；延迟、首屏、卡顿三者永远在权衡；连麦（双向）必须 WebRTC。

**最佳实践**：纯观看用 **HLS**（兼容最好，iOS 原生）/ **HTTP-FLV**（延迟更低，需 flv.js）；超低延迟/连麦用 **WebRTC**。本 demo 对比三种协议延迟与首屏选型。

<iframe src="../../../demos/pc-live.html" height="360" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **拉流协议选型**

  | 协议 | 延迟 | 兼容性 | 适用 |
  |------|------|--------|------|
  | HLS (m3u8) | 6~30s | iOS 原生、最稳 | 秀场/赛事（容忍延迟） |
  | HTTP-FLV | 1~3s | 需 flv.js | 电商直播（低延迟观看） |
  | **WebRTC** | **<500ms** | 需信令 + TURN | **连麦 / 互动课堂** |
- **hls.js 用法**：
  ```js
  if (Hls.isSupported()) { const h = new Hls(); h.loadSource(url); h.attachMedia(video); }
  else if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = url; // Safari 原生
  ```
- **首屏优化**：HLS 首屏 = 至少下载 1~3 个 ts 分片；用「低延迟 HLS（LL-HLS）」或 FLV 缩短；预连接 CDN。
- **自适应码率**：HLS 多档 m3u8，弱网自动降档（[弱网体验](../../practice/mobile/mobile-weak-network.md)）。
- **卡顿处理**：`hls.on(Hls.Events.ERROR, ...)` 做分片重试、劣化降级；缓冲水位监控。

**踩坑**

- 直接给 `<video src="rtmp://...">` 在浏览器**完全播不了**（RTMP 非浏览器协议）→ 必须转 HLS/FLV 或用 WebRTC。
- flv.js 在 iOS 微信 X5 内核偶发黑屏 → 关键场景回退 HLS。
- WebRTC 企业内网需 **TURN 中继**（P2P 直连被 NAT 挡）→ 不配 TURN 公网连不通。
- 移动端差异更明显（见 [移动端直播](../../practice/mobile/mobile-live.md)）。
