# 音视频处理最佳方案

音视频是公认的高门槛业务：**编解码、转码、截帧、压缩、HLS 切片、水印、转封装**，选错方案要么转码慢到不可用，要么成本爆炸，要么客户端播放卡顿。

## 一、先定三道选择题

**1. 谁来做转码？**

| 方式 | 优点 | 缺点 | 适用 |
|------|------|------|------|
| 服务端 FFmpeg（同步） | 可控、质量稳 | 占 CPU、阻塞请求 | 小文件、低频 |
| 服务端 FFmpeg（异步队列） | 不阻塞 | 需队列/worker | 中频、可控 |
| **云转码（云点播/FFmpeg on FaaS）** | 弹性、免运维 | 出网流量费 | **生产首选** |
| 客户端（WebCodecs/WASM） | 省服务端 | 兼容性差、慢 | 轻量预览 |

> **结论**：生产用**云转码 / 异步 FFmpeg worker**，绝不在 Web 请求线程里同步 `ffmpeg -i`。

**2. 存储与分发？**
源文件 + 转码后多档（480p/720p/1080p）存对象存储（OSS/S3），经 **CDN** 分发。播放端用 **HLS（m3u8）自适应码率**，弱网自动降档。

**3. 播放协议？**
HLS（iOS 原生、最稳）/ DASH（更灵活）/ 短视频用 MP4（边下边播）。

## 二、FFmpeg 核心命令（直接能用）

```bash
# 转码 + 多档（一次出 480/720/1080）
ffmpeg -i in.mp4 -vf scale=640:-2 -b:v 800k out_480.mp4
ffmpeg -i in.mp4 -vf scale=1280:-2 -b:v 2500k out_720.mp4

# 截帧（第 5 秒一张封面）
ffmpeg -i in.mp4 -ss 00:00:05 -vframes 1 -q:v 2 cover.jpg

# 抽关键帧做雪碧图（视频列表悬停预览）
ffmpeg -i in.mp4 -vf "select=eq(pict_type\,I),scale=160:-1,tile=10x10" -vsync 0 sprite.jpg

# 转 HLS（自适应码率，m3u8 + ts 切片）
ffmpeg -i in.mp4 -profile:v main -hls_time 6 -hls_list_size 0 -f hls index.m3u8

# 加水印
ffmpeg -i in.mp4 -i logo.png -filter_complex "overlay=W-w-10:10" out.mp4

# 提取音频（做 ASR 前先抽轨）
ffmpeg -i in.mp4 -vn -ar 16000 -ac 1 -f wav audio.wav
```

## 三、Java 侧怎么接（异步 + 进度）

服务端只做**调度**，worker 执行 FFmpeg。用消息队列解耦：

```java
// 1. 上传完成后发转码任务
@PostMapping("/upload")
public String upload(MultipartFile f) {
    String key = oss.put(f);
    mq.send(new TranscodeTask(key, List.of(480, 720, 1080)));  // 异步
    return key;
}

// 2. Worker 消费，执行 FFmpeg，回报进度
@RabbitListener(queues = "transcode")
public void onTask(TranscodeTask t) {
    for (int res : t.resolutions) {
        Process p = new ProcessBuilder("ffmpeg", "-i", local(t.key),
                "-vf", "scale=" + width(res) + ":-2", out(t.key, res)).start();
        // 读 stderr 解析 "time=" 算进度，写 Redis/DB
        watchProgress(p, t.key, res);
    }
    cdn.refresh(t.key);   // 刷新 CDN
}
```

## 四、踩坑清单

- **同步转码阻塞请求**：一个 500MB 视频转码 3 分钟，线程池打满 → 必须异步队列，Web 只发任务。
- **内存爆（Java 读整个文件）**：转码让 FFmpeg 做，别用 `Files.readAllBytes` 读视频进内存。
- **HLS 切片数过多**：`hls_time` 太小 → ts 碎片海量化、CDN 压力大。一般 4~10s 一片。
- **首帧黑屏/转码花屏**：关键帧间隔（GOP）太大 → 设 `-g 60` 合理关键帧，封面用 `-ss` 后再 `-i` 避免取空帧。
- **音频抽取格式错**：ASR 要 16k/16bit/单声道，直接抽默认可能被拒 → 显式 `-ar 16000 -ac 1`。
- **版权/合规**：用户上传视频转码要审核（先过内容安全再转），避免违规内容分发。
- **进度解析**：FFmpeg 进度在 **stderr** 不是 stdout，`time=00:00:12` 解析要注意。

## 五、成本与质量平衡

- 只转**被访问的档位**：首次播放按需转（lazy transcode），省 80% 存储。
- 源文件保留一份高清，其余档按需生成，老档可降冷存储。
- 短视频（<1min）直接 MP4 多副本，长视频必 HLS。

## 六、面试 STAR

- **难点**：视频列表雪碧图生成慢、首帧黑屏 → 用 I 帧雪碧图 + 合理 GOP + 指定 `-ss` 抽封面，列表 hover 预览秒出。
- **亮点**：上传→异步转码→多档 HLS→CDN 自适应，弱网下卡顿率降 60%，服务端零同步转码。
- **坑**：曾在请求线程同步 ffmpeg，压测直接线程耗尽，沉淀为"媒体处理一律异步队列"规范。
