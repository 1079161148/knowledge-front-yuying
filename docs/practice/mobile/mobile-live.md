# 直播（移动端低延迟 + 连麦）

**难点**：移动端直播比 PC 多一层"内核地狱"——微信/抖音/支付宝内置浏览器对 `<video>` 和直播协议支持不一；iOS 微信禁止播 RTMP、自动全屏；移动网络抖动大，缓冲策略要更激进；连麦必须原生或 WebRTC + TURN。

**最佳实践**：纯观看用 **HLS**（iOS 原生最稳）/ **HTTP-FLV**（低延迟，需 flv.js）；连麦用 **WebRTC**。本 demo 对比三方案在移动端的延迟/兼容/成本。

<iframe src="../../../demos/m-live.html" height="420" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **移动协议选型**

  | 方案 | 移动延迟 | 移动兼容 | 场景 |
  |------|---------|---------|------|
  | HLS | 6~30s | 最优（iOS 原生） | 秀场/赛事 |
  | HTTP-FLV | 1~3s | 中（flv.js，X5 偶发黑屏） | 电商低延迟观看 |
  | WebRTC | <500ms | 弱（需信令+TURN） | 连麦/互动课堂 |
- **iOS 微信**：HLS 原生支持最稳；RTMP 直接禁播；`<video>` 自动全屏要 `playsinline`。
- **flv.js 黑屏**：X5 内核偶发 → 关键场景回退 HLS，或接原生播放器（uni-app 用原生 `live-pusher`/`video` 组件）。
- **连麦**：双向 WebRTC，公网 NAT 穿透需 **TURN 中继服务器**，不配则连不通。
- **缓冲策略**：移动抖动大，首屏可适当多缓冲 1 个分片；卡顿用 `hls.js` 的 `maxBufferLength` 调。

**踩坑**

- 微信里直接 `<video src="rtmp://">` 完全没反应 → 服务端转 HLS/FLV。
- 移动端 4G 切 WiFi 时 WebSocket/WebRTC 连接断 → 做断线重连 + 重新协商。
- 低端机解码 1080p 直播掉帧发热 → 服务端推多档，客户端按机型/网络选档。
- PC 端对照见 [PC 直播](../../practice/pc/pc-live.md)。
