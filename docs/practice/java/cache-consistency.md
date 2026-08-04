# 缓存一致性

目录 `examples/java/cache-consistency/UserService.java`（含单测，**可 clone 运行**）。

## 难点

DB 和 Redis 双写不一致——更新 DB 后删缓存前，若有读请求把旧值写回缓存，就脏了。并发读写越多，脏窗口越大。

## 最佳实践：Cache-Aside + 延迟双删 + TTL 兜底

```java
public void updateUserName(Long id, String name) {
    repo.updateName(id, name);          // 1. 先更 DB
    redis.delete("user:" + id);         // 2. 删缓存（Cache-Aside：不写回）
    new Thread(() -> {                   // 3. 延迟双删（防并发读回脏数据）
        try { Thread.sleep(500); } catch (InterruptedException ignored) {}
        redis.delete("user:" + id);
    }).start();
}
```

读路径：

```java
public User get(Long id) {
    User u = redis.get("user:" + id);
    if (u != null) return u;
    u = repo.findById(id);
    redis.setex("user:" + id, 300, u);   // 短 TTL 兜底
    return u;
}
```

## 关键点

- **读多写少**才适合缓存；写入频繁的场景缓存命中率低、不一致成本高，谨慎用。
- 延迟双删的 500ms 是经验值，应略大于"读请求平均耗时"，本质是兜底，不能替代强一致方案。
- 强一致场景（余额、库存扣减）**别用缓存**，直接读 DB 或走事务。
- 删缓存失败要**重试**（MQ/定时补偿），否则双删也救不回。

## 进阶选型

| 方案 | 一致性 | 复杂度 | 适用 |
|------|--------|--------|------|
| 先删缓存再更 DB | 弱 | 低 | 写极少 |
| Cache-Aside + 双删 + TTL | 最终一致 | 中 | 绝大多数读多写少 |
| 写 DB 后发 binlog（Canal）异步刷缓存 | 最终一致 | 高 | 缓存为准、异构数据源 |
| 强一致（读 DB） | 强 | 低 | 余额/库存 |

## 踩坑

- **缓存穿透**：查不存在的 key，压到 DB → 缓存空值（短 TTL）或布隆过滤器。
- **缓存击穿**：热点 key 失效瞬间高并发打到 DB → 互斥锁重建（singleflight）或不过期 + 异步刷新。
- **缓存雪崩**：大量 key 同时过期 → TTL 加随机抖动；Redis 高可用（集群 + 哨兵）。
- **大 key / 热 key**：value 过大、单 key 访问集中 → 拆分、本地缓存 + 限流。

## 面试 STAR

- **难点**：库存缓存和 DB 偶发不一致，超卖投诉 → 改"Cache-Aside + 延迟双删 + 互斥重建"，并给关键读加 singleflight，脏数据窗口从秒级降到毫秒级。
- **亮点**：引入 Canal 监听 binlog 异步失效缓存，业务代码零侵入，缓存命中率 98%+。
