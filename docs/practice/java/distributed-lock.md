# 分布式锁

分布式锁是并发安全的利器，也是**最容易写错**的基础设施。用 Redis 做锁，错一个细节就退化成"假锁"，并发下互相覆盖数据。

## 一、最小可用锁（含防误删 + 过期）

```java
// 加锁：SET NX + EX，必须原子（不能用 setnx + expire 两步，会死锁）
String token = UUID.randomUUID().toString();   // 唯一值，防误删别人的锁
Boolean ok = redis.opsForValue().setIfAbsent("lock:order:" + orderId, token, 30, TimeUnit.SECONDS);
if (!ok) throw new BusyException("处理中");

try {
    doBusiness(orderId);
} finally {
    // 释放：只能删自己的锁（Lua 保证原子，避免 A 过期后删掉 B 的锁）
    String script = "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end";
    redis.execute(new DefaultRedisScript<>(script, Long.class), List.of("lock:order:" + orderId), token);
}
```

**三个不可省的细节**：

1. **`setIfAbsent(key, val, 30, SECONDS)`** 必须一步到位（SET NX EX 原子），否则 setnx 后进程挂了，锁永不过期 → 死锁。
2. **value 用唯一 token**，释放时校验，避免删掉别人的锁。
3. **释放用 Lua**，保证"判断+删除"原子，否则 A 锁过期、B 拿到锁后，A 的 finally 把 B 的锁删了。

## 二、锁续期（看门狗）

业务执行超过锁过期时间怎么办？用**看门狗**后台续期：

```java
// Redisson 自带看门狗：默认 30s 过期，每 10s 续到 30s，直到释放
RLock lock = redissonClient.getLock("order:" + orderId);
lock.lock();                 // 看门狗自动续期
try { doBusiness(orderId); }
finally { lock.unlock(); }
```

> 自己实现看门狗：后台定时任务 `pexpire` 续期，业务结束取消任务。**千万别让锁过期时间 < 业务耗时且没续期**——会并发重入。

## 三、Redlock 争议（重要）

Redis 官方曾推 Redlock（多独立节点多数派），但 **Martin Kleppmann 指出**：在**有GC停顿/时钟跳变**的现实中，Redlock 仍可能出现两个客户端同时持锁（ fencing token 缺失）。结论：

- **正确性要求极高**（金融扣款）→ 用 **ZooKeeper/etcd**（有 fencing、顺序一致）或 DB 乐观锁 + 版本号。
- **一般业务**（防重复处理、幂等兜底）→ Redis 锁 + 看门狗 + 业务幂等 足够。
- **任何分布式锁都不是银弹**，务必在业务层再加**幂等/版本号**兜底（锁只挡"大概率"，不挡"极端"）。

## 四、踩坑清单

- **锁粒度太粗**：一把大锁锁全表 → 并发全串行，吞吐崩。锁 `orderId` 而非锁整个服务。
- **锁过期业务没跑完**：没看门狗 → 并发重入。务必续期。
- **finally 没释放**：异常路径漏 unlock → 死锁。try/finally 或 Redisson 自动。
- **用 `del` 直接删**：删掉别人锁 → 必须用 Lua 校验 token。
- **Redis 主从切换丢锁**：master 加锁后还没同步就挂，slave 被提主，新主无锁 → 关键业务上 Redlock/etcd 或接受"锁非强一致 + 业务幂等"。
- **锁 key 无业务语义**：用固定字符串当 key，所有请求抢同一把锁 → key 必须带资源 ID。

## 五、面试 STAR

- **难点**：库存扣减并发超卖，单 JVM 锁不够（多实例）→ 上 Redis 分布式锁 + 看门狗，但发现极端情况仍重复 → 加 `orderId` 维度的 DB 唯一约束兜底。
- **亮点**：锁 key 精确到资源 ID + 看门狗续期 + Lua 释放 + 业务幂等四件套，超卖归零。
- **坑**：最初用 `setnx` + `expire` 两步，进程重启留下永久锁，沉淀为"加锁必须 SET NX EX 原子"。
