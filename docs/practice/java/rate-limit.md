# 接口限流

目录 `examples/java/rate-limit/`（**可 clone 运行**），注解 `@RateLimit` + `HandlerInterceptor`。

## 难点

接口被刷（爬虫/恶意调用/下游雪崩），需要按 IP 或用户限流，且不能误伤正常用户。

## 最佳实践：注解 + 拦截器

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    int permits() default 10;   // 窗口内允许次数
    int seconds() default 1;    // 窗口大小
}
```

```java
// 拦截器内：超出返回 429
if (!window.tryAcquire(now, ann.permits())) {
    res.setStatus(429);
    res.getWriter().write("{\"code\":429,\"message\":\"too many requests\"}");
    return false;
}
```

> 演示用**固定窗口**（实现简单、有临界突刺问题）。生产用 **Redis + Lua 滑动窗口**，多实例共享计数，原子自增 + 过期。

```lua
-- 滑动窗口（Redis Lua，保证原子）
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local cnt = redis.call('ZCARD', key)
if cnt >= limit then return 0 end
redis.call('ZADD', key, now, now)
redis.call('PEXPIRE', key, window)
return 1
```

## 关键点

- 单 JVM 用内存窗口足够；**多实例必须上 Redis**，否则每实例各限各的，总阈值被放大 N 倍。
- 限流要配合**熔断（Resilience4j）**和**降级**（返回兜底数据），三者合称稳定性三板斧。
- 限流 key 设计：`ip`、`user:{id}`、或 `api:{path}:{userId}`，按业务选粒度。

## 选型对照

| 算法 | 优点 | 缺点 | 适用 |
|------|------|------|------|
| 固定窗口 | 简单 | 临界突刺（窗口边界双倍） | 演示/粗粒度 |
| 滑动窗口 | 平滑、准 | 需 ZSet，内存略高 | 生产主流 |
| 令牌桶 | 允许突发 | 实现复杂 | 需突发流量 |
| 漏桶 | 严格匀速 | 不允突发 | 强控速率 |

## 踩坑

- **只按 IP 限流**：NAT/公司出口同一 IP 下所有用户被一起限，误伤 → 优先 `userId`，IP 作兜底。
- **限流后不返回标准 429**：前端拿不到语义 → 统一 429 + Retry-After。
- **把限流放业务方法里**：分散难维护 → 统一拦截器/网关层（Spring Cloud Gateway）。

## 面试 STAR

- **难点**：大促接口被脚本刷爆，DB CPU 100% → 网关层加 Redis 滑动窗口限流 + 关键写接口令牌桶，峰值 QPS 10w 下错误率 < 0.1%。
- **亮点**：限流 + 熔断 + 降级三件套，配套 Grafana 面板实时看限流命中。
