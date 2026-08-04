# ☕ 并发编程基础（线程 / 锁 / 线程池 / 异步 · 进阶 → 资深）

> 上一篇 [Java 语言核心](java-basics.md) 只提了并发概念。并发是 Java 最容易出生产事故也最能拉开档次的主题，本篇独立成章：
> - 🔵 进阶：Thread/Runnable、synchronized、`volatile`、线程池基本用法、为什么不能直接 `new Thread`。
> - 🟣 资深：锁升级、AQS、线程池参数与拒绝策略、CompletableFuture 编排、并发容器、常见死锁排查。
>
> 依据 **[Oracle Concurrency Tutorial](https://docs.oracle.com/javase/tutorial/essential/concurrency/) · [Java Language Spec - Threads](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html) · [OpenJDK](https://github.com/openjdk/jdk)**（以 JDK 21 为准，含虚拟线程对照见 [高并发篇](high-concurrency.md)）。

> 📌 **适用版本 / 更新日期**：JDK 8 / 11 / 17 / 21；最后更新 **2026-08**。

---

## 1. 🔵 线程的两种创建（别直接 new Thread）

```java
// 方式一：实现 Runnable（推荐，任务与线程解耦）
Runnable task = () -> System.out.println("run");
new Thread(task).start();

// 方式二：继承 Thread（少用，Java 单继承受限）
class MyThread extends Thread { public void run() { } }
```

!!! danger "为什么别 `new Thread().start()` 裸跑"
    - 线程是**重量资源**（默认栈 512KB~1MB），无节制创建 → OOM / 上下文切换爆炸。
    - 无法统一监控、命名、异常处理。生产一律用**线程池**（`ExecutorService`）。

---

## 2. 🔵 共享变量的可见性与原子性

### 2.1 volatile：可见性，非原子

```java
class Flag {
    volatile boolean running = true;     // 一个线程改，其他线程立即可见
}
```

- `volatile` 保证**可见性**（写立即刷主存，读从主存取）和**禁止指令重排**，但**不保证复合操作原子性**（如 `i++` 仍是 3 步：读-改-写）。
- `i++` 并发自增要用 `AtomicInteger`（CAS）或锁。

### 2.2 synchronized：互斥锁

```java
synchronized void transfer() {        // 锁当前对象（this）
    balance -= 10;
}
void foo() {
    synchronized (lockObj) { /* 临界区 */ }   // 锁指定对象，粒度更可控
}
```

- 保证**原子性 + 可见性**（退出同步块前刷主存）。
- JDK 6+ 有**锁升级**：无锁 → 偏向锁 → 轻量级锁（CAS）→ 重量级锁（OS 互斥），竞争激烈才到重量级，性能远好于早期。

!!! warning "synchronized 坑"
    - 锁对象要**共享且不变**：别用 `new Object()` 每次新建（锁不住）；别用 `String` 常量（可能复用）。
    - 锁粒度太粗 → 并发度低；太细 → 易漏保护。临界区只包必要代码。

---

## 3. 🔵 线程池：参数与拒绝策略（资深必会）

```java
ExecutorService pool = new ThreadPoolExecutor(
    corePoolSize,            // 核心线程数（常驻）
    maximumPoolSize,         // 最大线程数
    keepAliveTime,           // 非核心线程空闲回收时间
    TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(100),   // 工作队列
    Executors.defaultThreadFactory(),
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略
);
```

**执行流程**：任务来 → 核心线程满 → 进队列 → 队列满 → 开非核心线程到最大 → 再满 → **拒绝策略**。

| 拒绝策略 | 行为 |
|----------|------|
| `AbortPolicy`（默认） | 抛 `RejectedExecutionException` |
| `CallerRunsPolicy` | 调用者线程自己跑（降级，不丢任务） |
| `DiscardPolicy` | 静默丢弃 |
| `DiscardOldestPolicy` | 丢最旧任务 |

!!! danger "别用 `Executors.newFixedThreadPool()` 无界队列"
    - `newFixedThreadPool` / `newSingleThreadExecutor` 用**无界 `LinkedBlockingQueue`**，任务堆积 → OOM。
    - **正确**：手动 `new ThreadPoolExecutor` 指定有界队列 + 合理拒绝策略；给线程起名（`ThreadFactory`）方便排查。

!!! tip "线程数怎么定（经验公式）"
    - CPU 密集：≈ 核数（`Runtime.getRuntime().availableProcessors()`）。
    - IO 密集：可远大于核数（线程在等 IO），如 `核数 * (1 + 等待/计算)`。
    - 混合：拆两个池或用 `ForkJoinPool`/虚拟线程（见 [高并发篇](high-concurrency.md)）。

---

## 4. 🟣 并发容器与工具

| 需求 | 类 | 说明 |
|------|-----|------|
| 并发 Map | `ConcurrentHashMap` | 见 [集合深入](java-collections-deep.md) |
| 计数 | `AtomicLong` / `LongAdder` | `LongAdder` 高并发分段计数更快 |
| 阻塞队列 | `ArrayBlockingQueue` | 生产者-消费者 |
| 读写锁 | `ReentrantReadWriteLock` | 读多写少 |
| 一次性触发 | `CountDownLatch` | 等 N 个任务完成 |
| 多任务齐发 | `CyclicBarrier` | 多线程到齐再继续 |
| 信号量 | `Semaphore` | 限流（控制并发数） |

!!! warning "死锁四条件（资深排查）"
    互斥、持有并等待、不可剥夺、循环等待。破坏任一即可避免：
    - 统一**加锁顺序**（多锁按固定 id 顺序获取）。
    - 用 `tryLock(timeout)` 超时退出。
    - 缩小锁范围，减少持锁等待。
    - 排查：jstack / `Arthas thread` 看 `BLOCKED` 线程与锁持有链。

---

## 5. 🟣 CompletableFuture：异步编排（现代 Java 异步核心）

```java
CompletableFuture.supplyAsync(() -> queryUser(id), pool)     // 异步取用户
    .thenApplyAsync(user -> enrich(user), pool)             // 链式转换
    .thenAccept(user -> send(user))                          // 消费结果
    .exceptionally(ex -> { log.error("fail", ex); return null; });  // 异常兜底

// 等多个并行任务
CompletableFuture.allOf(f1, f2, f3).join();   // 全部完成
CompletableFuture.anyOf(f1, f2).join();        // 任一完成
```

!!! tip "最佳实践"
    - **显式传线程池**（`supplyAsync(fn, executor)`），否则用 `ForkJoinPool.commonPool()`（共享、可能被别的任务拖慢）。
    - 用 `exceptionally` / `handle` 兜底异常，别让异步任务静默失败。
    - IO 密集/大量并发用**虚拟线程**池（见 [高并发篇](high-concurrency.md)）替代线程池更高效。

---

## 6. 🟣 内存可见性模型（JMM 一句话）

- 线程有自己的**工作内存**（缓存），变量改动不一定立刻对其他线程可见 → `volatile`/`synchronized`/`final`/锁 建立 **happens-before** 关系，保证可见与有序。
- `final` 字段：构造器内正确发布后，其他线程**保证看到正确值**（无需 volatile）。
- 64 位 `long`/`double` 的非 volatile 读写在 32 位 JVM 可能**撕裂**（分两次写），但现代 64 位 JVM 极少遇。

---

## 7. 自测

```java
// 以下输出不一定为 20000：i++ 非原子
int count = 0;
ExecutorService p = Executors.newFixedThreadPool(10);
for (int i = 0; i < 20; i++) p.submit(() -> { for (int j=0;j<1000;j++) count++; });
// 正确：用 AtomicInteger 或 synchronized
```

---

## 8. 下一步
- 想用虚拟线程把并发写简单 → [高并发与虚拟线程](high-concurrency.md)
- 想看清线程/锁在 JVM 怎么实现、怎么排查 → [JVM](jvm.md)
- 想深挖集合并发实现 → [集合框架深入](java-collections-deep.md)
