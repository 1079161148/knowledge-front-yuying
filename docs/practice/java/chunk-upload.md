# 大文件分片上传 + 断点续传

大文件（视频/安装包/数据集）直接 POST 容易超时、失败重传浪费带宽。标准做法是**前端切片 + 服务端合并 + 秒传 + 断点续传**。

## 一、整体流程

```
前端: 算文件 hash(sha256, 取首尾+大小做秒传指纹)
  → 查服务端是否已存在(秒传)
  → 不存在则按 5MB 切片并发上传(带 index)
  → 每片上传前先查"已上传索引"(断点续传)
  → 全部到齐后发合并请求
服务端: 接收分片落临时目录, 记录已收 index, 合并成最终文件, 校验大小/hash
```

## 二、前端切片（Web worker 算 hash 防卡 UI）

```js
async function upload(file) {
  const shardSize = 5 * 1024 * 1024;
  const shardCount = Math.ceil(file.size / shardSize);
  const fileHash = await hashInWorker(file);   // web worker 里 spark-md5，不卡主线程

  // 1. 秒传检查
  const { exist, uploaded } = await axios.post('/api/file/check', { fileHash, size: file.size });
  if (exist) return alert('秒传成功');

  // 2. 并发传分片（控制并发数，别全开）
  const pool = new ConcurrentPool(3);
  for (let i = 0; i < shardCount; i++) {
    if (uploaded.includes(i)) continue;        // 断点续传：跳过已传
    const chunk = file.slice(i * shardSize, (i + 1) * shardSize);
    pool.add(() => axios.post('/api/file/chunk', formData(fileHash, i, chunk)));
  }
  await pool.all();

  // 3. 合并
  await axios.post('/api/file/merge', { fileHash, fileName: file.name, size: file.size });
}
```

## 三、服务端（Spring Boot）

```java
// 接收分片：fileHash + index 定位落盘
@PostMapping("/chunk")
public void chunk(@RequestParam String fileHash, @RequestParam int index, MultipartFile file) {
    Path dir = Paths.get(uploadTmp, fileHash);
    Files.createDirectories(dir);
    file.transferTo(dir.resolve(index + ".part"));   // 落盘为 i.part
    redis.sadd("file:uploaded:" + fileHash, String.valueOf(index));  // 记录已传
}

// 合并：按 index 顺序拼，校验大小
@PostMapping("/merge")
public String merge(@RequestBody MergeReq req) throws IOException {
    try (OutputStream out = Files.newOutputStream(Paths.get(uploadDir, req.fileName))) {
        for (int i = 0; ; i++) {
            Path p = Paths.get(uploadTmp, req.fileHash, i + ".part");
            if (!Files.exists(p)) break;
            Files.copy(p, out);
        }
    }
    // 校验大小/hash 一致后删除临时分片
    return "done";
}
```

## 四、踩坑清单

- **hash 卡 UI**：主线程算大文件 sha256 直接卡死 → 用 **Web Worker + spark-md5 增量算**。
- **并发失控**：一次性开几百个请求 → 连接耗尽、被限流。用**并发池（如 3~6）**兜底。
- **断点续传失效**：前端没先查"已上传索引"就全传 → 合并前 `GET /check` 拿 `uploaded` 列表跳过。
- **合并顺序错**：分片不按 index 拼 → 文件损坏。用有序循环（i 从 0 递增，遇缺失即停）。
- **秒传指纹冲突**：只用文件名当指纹 → 不同文件同名误判秒传。用 **hash + 大小**双因子。
- **临时分片不清理**：失败残留 `.part` 占磁盘 → 合并成功后删，定时任务扫孤儿目录。
- **大文件内存溢出**：`MultipartFile` 默认缓冲到内存 → 调大 `spring.servlet.multipart` 阈值或流式写盘。
- **Nginx 超时**：分片大/慢 → 调 `client_max_body_size` 和 `proxy_read_timeout`。

## 五、面试 STAR

- **难点**：1GB 视频直接上传频繁超时失败 → 改 5MB 分片 + 3 并发 + 断点续传，失败可续，成功率 99.9%。
- **亮点**：文件 hash 秒传，重复文件 0 上传；Web Worker 算 hash 不卡 UI。
- **坑**：曾因没按 index 合并导致文件损坏，加"大小 + hash 双重校验"后零损坏。
