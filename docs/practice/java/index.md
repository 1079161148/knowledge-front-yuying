# Java 后端真实业务实战

每个示例都聚焦**真实业务中高频、易踩坑、有技术含量**的难点。可本地跑的工程（退款队列/缓存/限流）标注运行方式；偏架构与外部依赖的（音视频、ASR、分布式锁等）给出**完整可落地代码 + 方案选型 + 踩坑清单**，直接能照抄到生产。

> 选型总原则：**先想清一致性/可用性边界，再选技术；能单机的别上分布式；外部依赖要隔离、可降级。**

---

## 菜单

**可 clone 运行的模块**

- [退款队列（SQLite + 幂等）](refund-queue.md) — 生产者/消费者分离、原子抢任务、幂等三道闸
- [缓存一致性](cache-consistency.md) — Cache-Aside + 延迟双删 + TTL 兜底
- [接口限流](rate-limit.md) — 注解 + 拦截器，单机到分布式滑动窗口

**经典业务难点亮点（方案 + 踩坑）**

- [音频转文字 ASR](asr-audio-to-text.md) — 本地 Whisper vs 云端 API 选型、流式 vs 整段、转写对齐
- [音视频处理最佳方案](media-processing.md) — FFmpeg 转码/截帧/压缩/HLS，服务端 vs 客户端 vs 云转码
- [分布式锁](distributed-lock.md) — Redis 误删、看门狗、Redlock 争议与正确姿势
- [大文件分片上传 + 断点续传](chunk-upload.md) — 前端切片、秒传、合并、并发控制
- [异步任务编排](async-orchestration.md) — CompletableFuture 陷阱、线程池隔离、上下文丢失
- [海量 Excel 流式导入](excel-import.md) — SAX 防 OOM、校验、失败行回写
- [全局唯一 ID（雪花）](snowflake-id.md) — 时钟回拨、workerId 分配、号段模式
- [幂等通用套路](idempotent.md) — 去重表 / Token / 状态机，覆盖写与更新
