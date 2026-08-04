# ⚡ 高并发与虚拟线程（线程池 / 锁优化 / Project Loom / 压测）

> 性能与并发的资深战场。覆盖：线程模型、线程池原理与参数、锁优化、JUC 工具、Project Loom 虚拟线程、压测方法论。
> 依据 **[Java Concurrency in Practice（官方社区经典）](https://jcip.net/)** · **[Project Loom](https://openjdk.org/projects/loom/)** · **[Java 21 Docs](https://docs.oracle.com/en/java/javase/21/)**。

> 📌 **适用版本 / 更新日期**：Java 21（虚拟线程正式特性）；最后更新 **2026-08**。

---

## 1. 线程池（必须精通）

```java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    10,                       // corePoolSize
    100,                      // maximumPoolSize
    60, TimeUnit.SECONDS,     // keepAliveTime
    new LinkedBlockingQueue<>(1000),   // 工作队列
    new ThreadFactory() { ... },       // 命名线程，便于排查
    new ThreadPoolExecutor.CallerRunsPolicy()); // 拒绝策略
```

| 参数 | 含义 | 坑 |
|------|------|-----|
| `corePoolSize` | 核心线程 | 常驻 |
| `maximumPoolSize` | 最大 | 队列满才扩容 |
| `workQueue` | 队列 | `LinkedBlockingQueue` 无界 → 内存撑爆 |
| 拒绝策略 | 满后怎么办 | `AbortPolicy` 抛异常；`CallerRuns` 调用方执行（天然限流） |

!!! danger "线程池致命坑"
    - **用 `Executors.newFixedThreadPool()` 无界队列** → 任务堆积 OOM。生产用 `ThreadPoolExecutor` 显式设队容量与拒绝策略。
    - 不命名线程 → 出事分不清哪个池（用 `ThreadFactoryBuilder`/自定义）。
    - IO 密集（DB/HTTP）与 CPU 密集用**不同池**：IO 池线程数可大（如 2*核数~数十），CPU 池≈核数，混用会互相拖。
    - 同一 JVM 建大量线程池 → 线程总数失控；用统一池 + 不同队列。

---

## 2. 锁优化

- **减小锁粒度/范围**：只锁必要代码；用 `ConcurrentHashMap` 分段、读写锁 `ReentrantReadWriteLock`（`StampedLock` 更优，乐观读）。
- **CAS 无锁**：`AtomicX`、`LongAdder`（高并发计数，分段 Cell 减少争用）。
- **避免锁竞争**：缩小临界区、减少锁内 IO、用 `ThreadLocal` 去共享。

!!! warning "synchronized 演进"
    - JDK6+ 有锁升级（无锁→偏向→轻量→重量），多数场景 `synchronized` 性能已不差；别盲目换 `ReentrantLock`，按需选。

---

## 3. JUC 常用

| 类 | 用途 |
|----|------|
| `CountDownLatch` | 等待 N 个任务完成 |
| `CyclicBarrier` | 多线程到齐再继续 |
| `CompletableFuture` | 异步编排（见 [Java 基础](java-basics.md)） |
| `ConcurrentHashMap` | 并发 KV |
| `LongAdder` | 高并发计数 |
| `Phaser` | 可重用屏障 |

---

## 4. Project Loom 虚拟线程（Java 21）

```java
// 虚拟线程：轻量（JVM 管理，映射少量 OS 线程），万级并发不爆
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        executor.submit(() -> {
            Thread.sleep(1000);     // 阻塞时让出载体线程，不占 OS 线程
            return doWork();
        });
    }
} // 自动关闭等待完成
```

- **虚拟线程适合 IO 密集型**：每个请求一个虚拟线程，阻塞时自动让出载体（carrier）线程，吞吐量远超平台线程池。
- **不要用线程池复用虚拟线程**（`newVirtualThreadPerTaskExecutor` 已是每任务一个，或 `Thread.startVirtualThread`）。
- `synchronized` 内阻塞会**钉住（pin）**载体线程 → 用 `ReentrantLock` 替代临界区内阻塞。

!!! danger "虚拟线程坑"
    - 虚拟线程 ≠ 并行计算加速，它解决的是**并发阻塞**而非 CPU 并行；CPU 密集仍靠多核平台线程。
    - `ThreadLocal` 在虚拟线程海量场景下内存放大 → 用 `ScopedValue`（Java 21 预览/后续）替代。
    - 避免在虚拟线程里用 `synchronized` 做重阻塞（pinning），改用 `ReentrantLock`。
    - 池化虚拟线程是反模式（它们本就极廉价）。

---

## 5. 压测方法论

1. **定目标**：QPS、P99 延迟、错误率（如 P99<200ms，错误率<0.1%）。
2. **工具**：JMeter / Gatling / wrk / k6。
3. **梯度加压**：从低到高找拐点（吞吐不再涨、延迟陡升）。
4. **监控**：CPU/内存/GC/线程数/DB 连接池/Redis/QPS，定位瓶颈（见 [JVM 排查](jvm.md)）。
5. **瓶颈不在应用就查依赖**：慢 SQL（[MySQL](mysql.md)）、缓存命中（[Redis](redis.md)）、消息堆积（[Kafka](kafka.md)）。

!!! tip "误区"
    - 只压单接口不看全链路 → 真实流量有依赖，需链路压测或影子库。
    - 压测机自身成瓶颈（CPU/端口耗尽）→ 分布式压测或多机。

---

## 6. 自测

```text
Q: 1万并发请求都涉及 DB 查询，用线程池还是虚拟线程？
A: IO 密集为主 → 虚拟线程（每请求一虚拟线程，阻塞自动让出载体）更简洁高吞吐；
   若用平台线程池需 large corePoolSize + 有界队列 + 拒绝策略，且要防 DB 连接池耗尽（连接数 << 并发数，需限流/队列）。
```

> 下一章：[Java 常用插件与工具链](java-toolchain.md)
