# 音频转文字（ASR）

语音转写是会议纪、客服质检、字幕、语音搜索的底座。难点不在"调个 API"，而在**选型、流式 vs 整段、长音频切片对齐、方言/噪声、成本与延迟的平衡**。

## 一、方案选型（先定边界）

| 方案 | 延迟 | 成本 | 隐私 | 适用 |
|------|------|------|------|------|
| 云端 ASR（阿里/腾讯/讯飞/Google/Azure） | 中 | 按量 | 低（音频出网） | 通用、要高准确率、方言多 |
| 本地 Whisper（openai/whisper / faster-whisper） | 高（批） | GPU 一次性 | 高 | 内网/隐私敏感/离线 |
| 端侧（WebRTC + WASM Whisper） | 低 | 0 | 最高 | 实时字幕、小模型 |
| 自研 VAD+ASR 流水线 | — | 极高 | 高 | 特殊场景，慎选 |

> **结论**：90% 业务用**云端流式 ASR**；隐私合规或离线用 **faster-whisper（CTranslate2，比原版快 4 倍、省显存）**；实时字幕可用端侧 WASM。

## 二、流式 vs 整段

- **整段（一句话一段）**：等整段说完再发，延迟高但准确率稳，适合录音笔、会议结束后转写。
- **流式（实时字幕）**：边说边出字，要把音频按 **VAD（语音活动检测）** 切成小段（如 200ms~1s）连续发送，前端用 WebSocket 收增量结果。

```java
// 流式 ASR 客户端骨架（伪代码，以讯飞/阿里 WebSocket 协议为准）
public class AsrStreamClient {
    private final BlockingQueue<byte[]> audioQueue = new LinkedBlockingQueue<>();
    private WebSocket ws;

    public void start(Long uid) {
        ws = new WebSocketClient(new URI(asrUrl(uid)));   // 带 token 的签名 URL
        ws.connect();
        // 麦克风/文件流持续喂音频
        new Thread(this::pump).start();
    }

    private void pump() {
        while (recording) {
            byte[] chunk = audioQueue.poll();
            if (chunk != null) ws.send(chunk);   // 16k/16bit 单声道 PCM
        }
        ws.send("{\"end\":true}");               // 结束帧
    }
}
```

## 三、长音频切片与对齐（最容易踩坑）

云端单次 ASR 有**时长上限**（如 60s/片段、整文件 2h）。长会议要切：

1. **按静音切（VAD）**：在静音点切，避免把一句话劈成两半 → 语义断裂、标点错乱。
2. **切片重叠（overlap 200ms）**：相邻片段重叠，合并时去重中间重复字。
3. **时间戳对齐**：每段返回 `start/end`，合并后整体时间轴要对齐原音频，否则字幕错位。

```java
// 切静音点（基于能量阈值），返回切片边界
List<int[]> splitBySilence(float[] pcm, int sampleRate) {
    List<int[]> segs = new ArrayList<>();
    int last = 0;
    for (int i = 0; i < pcm.length; i += sampleRate / 100) {
        if (energy(pcm, i) < SILENCE_THRESHOLD) {       // 连续静音超 300ms 才切
            if (i - last > minSegSamples(sampleRate)) segs.add(new int[]{last, i});
            last = i;
        }
    }
    return segs;
}
```

## 四、踩坑清单

- **采样率不匹配**：麦克风 44.1k 喂给只认 16k 的 ASR → 转写乱码。先重采样（`AudioSystem` / FFmpeg）。
- **噪声/远场**：会议室远讲识别率暴跌 → 前端降噪 + VAD 触发 + 选远场模型。
- **方言/专有名词**：通用模型不识行业词（如"核保""放单"）→ 用**热词/热句（vocabulary）**提权。
- **流式断线重连**：网络抖断导致整段丢失 → 切片级重传，已转写部分保留。
- **成本失控**：把所有人说话都无脑转写 → 先 VAD 过滤无人声片段，按有效音频计费。
- **标点/说话人分离**：单流 ASR 不分说话人 → 需要**说话人分离（diarization）**二次处理（pyannote/自研聚类）。

## 五、面试 STAR

- **难点**：2 小时会议转写丢字、时间轴错位 → 引入 VAD 静音切片 + 200ms overlap + 时间戳对齐，转写完整率 99%+。
- **亮点**：热词提权让行业术语识别率从 82% 到 96%；按有效音频计费，成本降 40%。
- **坑**：采样率不对导致全段乱码，沉淀成"音频入参必须 16k/16bit/单声道"的接入规范。
