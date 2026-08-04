# 音视频处理（移动端播放 / 截帧 / 压缩）

**难点**：移动端音视频比 PC 更坑——iOS 微信 X5 内核强制全屏、自动播放被禁、`playsinline` 行为不一；真机摄像头/麦克风权限；跨域视频 canvas 截帧污染；低端机解码掉帧。

**最佳实践**：用 `playsinline webkit-playsinline` 强制内联播放；能力探测后选协议；客户端轻处理用 `canvas` + `MediaRecorder`，重转码交服务端（见 [Java 音视频章节](../java/media-processing.md)）。本 demo 做真机能力探测。

<iframe src="../../../demos/m-media-processing.html" height="460" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **内联播放**：`<video playsinline webkit-playsinline>` 防 iOS 自动全屏跳转（电商详情页视频必须内联）。
- **自动播放**：移动端禁止有声自动播放，必须 `muted + autoplay + playsinline` 才肯播（静音自动播放是合规唯一解）。
- **能力探测**：`video.canPlayType('application/vnd.apple.mpegurl')` 判 HLS；`navigator.mediaDevices.getUserMedia` 判摄像头权限。
- **截帧污染**：跨域视频不加 `crossOrigin` + 服务端 CORS 头，则 `canvas.toBlob()` 抛 `SecurityError`（与 PC 同源）。

**踩坑**

- iOS 微信里 `<video>` 点播放跳系统全屏播放器 → 必须 `playsinline`，且 X5 内核仍可能强全屏，连麦类只能走原生。
- Android WebView 默认不解码某些编码（如 HEVC）→ 服务端统一转 H.264 最稳。
- 低端机播 1080p 掉帧 → 服务端按档出 480/720，HLS 自适应降档（见 [弱网](mobile-weak-network.md)）。
- 真机权限弹窗在 App WebView 里可能是原生层处理 → 见 [uni-app 音视频](../uniapp.md) 原生桥接。
- PC 端对照见 [PC 音视频处理](../../practice/pc/pc-media-processing.md)。
