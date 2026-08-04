# 🌐 分布式与高并发专题（资深必备）

> 当单实例扛不住、或业务要拆服务时，就得面对**分布式**问题：锁、限流、熔断、幂等、缓存一致性。这些是**资深后端**与高级的分水岭。本篇讲清每个问题的"为什么存在 + 代码级方案 + 避坑"，不堆概念。
>
> 依据 **[Redis 官方文档](https://redis.io/docs/)**、**[Sentinel 熔断](https://martinfowler.com/bliki/CircuitBreaker.html)**、**[DDIA（数据密集型应用系统设计）](https://dataintensive.net/)**。

---

## 一、限流（Rate Limiting）

**为什么**：防刷接口、防雪崩、公平分配资源。

### 算法对比

| 算法 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| 计数器（固定窗口） | 每秒计数，超阈值拒 | 简单 | 临界点双倍突发 |
| 滑动窗口 | 按时间滑动统计 | 平滑 | 稍复杂 |
| **令牌桶** | 恒定速率发令牌，桶满则弃 | 允许突发 | 实现稍复杂 |
| **漏桶** | 恒定速率流出，溢出丢弃 | 绝对平滑 | 不支持突发 |

```ts
// 令牌桶思路（Redis 实现，多实例共享）
async function allow(key: string, rate: number, capacity: number) {
  const now = Date.now()
  const bucket = await redis.hgetall(key) // {tokens, ts}
  const tokens = Math.min(
    capacity,
    (Number(bucket.tokens) || capacity) + (now - Number(bucket.ts)) / 1000 * rate,
  )
  if (tokens < 1) return false
  await redis.hset(key, { tokens: tokens - 1, ts: now })
  return true
}
```

!!! warning "限流坑"
    - **基于代理 IP**：多实例下 `req.ip` 是 Nginx IP，要配 `trust proxy` 读 `X-Forwarded-For`（见 [部署](deploy-ops.md)），否则限流误伤或失效。
    - **内存限流只适用单实例**：cluster/多 Pod 下各实例计数独立，要用 **Redis** 集中计数（如 `@nestjs/throttler` + Redis 存储）。
    - 登录/短信验证码接口必须限流，否则被爆破/刷短信。

---

## 二、分布式锁（Distributed Lock）

**为什么**：多实例同时改同一资源（如扣库存、定时任务只跑一次）会竞争。

```ts
// Redis SET NX（最常用）
const lock = await redis.set('lock:order:123', '1', 'NX', 'EX', 10) // 10s 自动过期
if (!lock) return '正在处理'            // 获取失败
try {
  await doCriticalWork()
} finally {
  await redis.del('lock:order:123')     // 释放（生产用 Lua 脚本保证原子，防误删别人的锁）
}
```

!!! danger "分布式锁三坑"
    - **死锁**：进程崩了锁没释放 → 必须 `EX` 过期时间兜底。
    - **误删别人的锁**：A 的锁过期、B 拿到，A 执行完 `del` 删了 B 的锁 → 用**唯一 value + Lua 校验**再删。
    - **锁过期但任务没跑完**：用"看门狗"自动续期（如 Redisson），或保证任务短于锁超时。
    - 强一致场景考虑 **Redlock**（多 Redis 节点），但实现复杂，多数场景单实例 `SET NX` 够用。

---

## 三、熔断与降级（Circuit Breaker）

**为什么**：依赖服务挂了，如果还疯狂重试，会把自己也拖死（雪崩）。

```
关闭(正常) ──失败率超阈值──▶ 打开(快速失败, 不再调依赖)
    ▲                          │
    │ 休眠期到, 放一个试探请求   │
    └──── 成功 ──▶ 半开 ───────┘
```

```ts
// opossum 库（Node 熔断）
import CircuitBreaker from 'opossum'
const breaker = new CircuitBreaker(callExternal, {
  timeout: 3000, errorThresholdPercentage: 50, resetTimeout: 30000,
})
breaker.fallback(() => ({ data: null, degraded: true })) // 降级返回
```

!!! tip "熔断 vs 降级"
    - **熔断**：依赖挂了，先"断开"不再调，给对端喘息，避免自己被拖垮。
    - **降级**：高峰期/依赖不可用时，返回简化结果（如推荐位返回默认列表），保核心功能。
    - 两者常一起用：熔断后触发降级。

---

## 四、幂等设计（Idempotency）

**为什么**：网络重试、消息重投、用户重复点击，会让同一操作执行多次（重复扣款、重复发券）。

**方案**：
- **唯一键**：数据库 `UNIQUE(user_id, order_no)`，重复插入直接报错捕获。
- **幂等表/Redis 去重**：请求带 `Idempotency-Key`，服务端记已处理，重复返回首次结果。
- **状态机**：订单 `待支付→已支付`，重复支付请求在"已支付"状态直接返回成功，不做二次扣款。

!!! warning "幂等坑"
    - 消息队列消费者**必须幂等**，同一条消息可能重投（at-least-once 投递）。
    - 别用"先查再改"判断（并发下两条同时过查），用**唯一约束/原子操作**。
    - 前端"防重复提交"只是体验，后端幂等才是安全保证。

---

## 五、缓存一致性（Cache Consistency）

**为什么**：改了 DB，缓存还是旧的，用户看到脏数据。

**两种策略：**

| 策略 | 做法 | 风险 |
|------|------|------|
| Cache-Aside（旁路） | 读：缓存没有才查 DB 并写回；写：先更新 DB，**再删缓存** | 删缓存失败→脏数据；用"延迟双删"兜底 |
| Write-Through | 写：同时写缓存和 DB | 写路径变慢 |

!!! danger "缓存三大灾难（面试必考）"
    - **穿透**：查不存在的 key，缓存/DB 都无，每次打 DB → 缓存空值（短 TTL）或布隆过滤器。
    - **击穿**：热点 key 过期瞬间，大量请求同时击穿 → 互斥锁（只放一个回源）或逻辑过期。
    - **雪崩**：大量 key 同一时间过期/Redis 挂 → 过期时间加**随机抖动**；Redis 高可用（哨兵/集群）。
    - 详情 + 代码见 [NestJS 进阶·缓存](nestjs-pro.md) 与 [最佳实践](best-practices.md)。

---

## 六、分布式事务（最终一致性）

**为什么**：跨服务写多库（下单 + 扣库存 + 减积分），没法用本地事务。

- **Saga 模式**：把大事务拆成一系列本地事务，每步有补偿操作（失败则逆序补偿）。
- **本地消息表 / 事务消息**：本地事务 + 发消息，保证"库写了、消息也发了"。
- **TCC**（Try-Confirm-Cancel）：预留资源 → 确认/取消，强一致但侵入大。

!!! tip "原则"
    - 能不用分布式事务就别用（先用单体 + 本地事务）。
    - 绝大多数场景用**最终一致性 + 幂等 + 补偿**即可，别追求强一致（CAP 取舍）。

---

## 七、高并发设计 Checklist

- [ ] 限流（令牌桶/漏桶，Redis 集中，多实例共享）
- [ ] 热点资源加分布式锁（带过期 + 防误删）
- [ ] 外部依赖加超时 + 熔断 + 降级
- [ ] 所有写操作幂等（唯一键/幂等表/状态机）
- [ ] 缓存策略明确（旁路 + 双删），防穿透/击穿/雪崩
- [ ] 跨服务用最终一致性 + 补偿，不滥用强事务
- [ ] 压测验证（见 [性能调优](performance-tuning.md)）

配合：[性能调优](performance-tuning.md)、[可观测性落地](observability.md)。
