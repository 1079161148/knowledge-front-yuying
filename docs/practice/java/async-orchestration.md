# 异步任务编排

一个接口要调 5 个下游（库存、优惠、风控、支付、物流），串行太慢、乱开线程又失控。**CompletableFuture 编排**是 Java 异步的主力，但坑极多。

## 一、并行编排（等全部完成）

```java
CompletableFuture<Item> f1 = supplyAsync(() -> stockService.get(sku), bizPool);
CompletableFuture<Item> f2 = supplyAsync(() -> promoService.calc(sku), bizPool);
CompletableFuture<Item> f3 = supplyAsync(() -> riskService.check(uid), bizPool);

CompletableFuture<Void> all = CompletableFuture.allOf(f1, f2, f3);
all.thenApply(v -> {
    Item stock = f1.join();   // join 在 allOf 后已就绪，不会阻塞
    Item promo = f2.join();
    Item risk  = f3.join();
    return buildResult(stock, promo, risk);
});
```

- **allOf**：等全部；**anyOf**：等任意一个（如"主+备"源取最快）。
- 有依赖的用 `thenCompose`（扁平化，避免 Future 套 Future）。

## 二、线程池隔离（最重要）

```java
// 每个下游独立线程池，一个慢依赖不拖垮其他
ExecutorService stockPool  = new ThreadPoolExecutor(10, 10, 0L, MILLISECONDS, new LinkedBlockingQueue<>(100), new NamedThreadFactory("stock"));
ExecutorService promoPool  = new ThreadPoolExecutor(10, 10, 0L, MILLISECONDS, new LinkedBlockingQueue<>(100), new NamedThreadFactory("promo"));
```

> **千万别用 `ForkJoinPool.commonPool()`（默认线程池）**：它是 JVM 共享的，一个业务占满，全局异步任务全卡。每个业务/下游独立池 + 命名。

## 三、异常与超时

```java
CompletableFuture.supplyAsync(() -> slowCall(), pool)
    .orTimeout(800, MILLISECONDS)             // 超时抛 TimeoutException
    .exceptionally(ex -> fallback());          // 降级
// 或带默认值
    .completeOnTimeout(defaultVal, 800, MILLISECONDS);
```

## 四、踩坑清单

- **用默认线程池**：`supplyAsync(() -> ...)` 不带池 → 进 commonPool，互相挤占 → 必须传自定义池。
- **上下文丢失**：MDC（日志 traceId）、SecurityContext、ThreadLocal 不跨线程 → 用 `TaskDecorator` 复制，或阿里的 **TransmittableThreadLocal (TTL)**。
- **silent 吞异常**：`thenApply` 里抛异常不处理，后续 `join` 才爆且难定位 → 显式 `exceptionally`/`handle`。
- **join 在没就绪时调用**：会阻塞当前线程 → 只在 `allOf`/`whenComplete` 之后 join，或用回调。
- **线程池无界队列**：任务暴涨 OOM → 用**有界队列 + 拒绝策略**（CallerRuns / 降级）。
- **忘记关池**：应用关闭线程泄漏 → `@PreDestroy` 里 `shutdown()`。
- **fork join 递归深度**：深层 `thenCompose` 链小心栈。

## 五、结构化并发（Java 21+）

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var a = scope.fork(() -> stockService.get(sku));
    var b = scope.fork(() -> promoService.calc(sku));
    scope.join();           // 任一个失败则整体取消
    scope.throwIfFailed();
    return new Result(a.get(), b.get());
}
```

## 六、面试 STAR

- **难点**：下单接口串行调 5 个下游，RT 2.5s → CompletableFuture 并行 + 下游独立线程池，RT 降到 600ms。
- **亮点**：每个下游配独立池 + 超时降级 + TTL 传 traceId，故障域隔离，一个下游挂不影响主流程。
- **坑**：曾用 commonPool 被别的业务占满导致全站异步卡，沉淀为"异步必须用业务专属线程池"。
