# 🗄️ 数据库进阶专题（索引 / 事务 / 读写分离 / 分库分表）

> 后端 80% 的性能和数据正确性问题都在数据库。本篇讲高级工程师必须懂的 DB 进阶：索引优化、事务隔离、连接池、读写分离、分库分表。配 PostgreSQL/MySQL 通用原理与避坑。
>
> 依据 **[PostgreSQL 官方文档](https://www.postgresql.org/docs/)**、**[MySQL 官方文档](https://dev.mysql.com/doc/)**、**[DDIA](https://dataintensive.net/)**。

---

## 一、索引优化（性能第一抓手）

**为什么**：无索引的查询是全表扫描，数据量一大就慢到不可接受。

```sql
-- 给常用查询条件加索引
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
-- 联合索引遵循最左前缀：能命中 (user_id) 和 (user_id, created_at)，但不能只命中 (created_at)
```

!!! danger "索引坑"
    - **索引不是越多越好**：每个索引拖慢写入、占空间。只给高频查询条件建。
    - **最左前缀失效**：联合索引 `(a,b,c)`，查询只用 `b`/`c` 走不了索引，必须含 `a`。
    - **函数/隐式转换失效**：`WHERE DATE(created_at)=...` 或 `WHERE phone=123`（phone 是字符串）会让索引失效，改成范围查询 / 参数类型一致。
    - **LIKE 前缀**：`LIKE 'abc%'` 能用索引，`LIKE '%abc'` 不能。
    - 用 `EXPLAIN ANALYZE` 看执行计划，确认是否走索引、是否全表扫描。

---

## 二、事务与隔离级别

**为什么**：多个写操作要"要么全成、要么全败"，且并发时不串数据。

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 性能 |
|----------|------|-----------|------|------|
| Read Uncommitted | ❌可能 | ❌ | ❌ | 最高 |
| Read Committed | ✅防 | ❌ | ❌ | 高 |
| **Repeatable Read** | ✅ | ✅防 | ❌(快照) | 中 |
| Serializable | ✅ | ✅ | ✅防 | 最低 |

```ts
// TypeORM 事务（必须回滚）
await dataSource.transaction(async (manager) => {
  await manager.save(order)
  await manager.decrement(Product, { id }, { stock: 1 })
  // 抛错自动回滚，数据不会半截
})
```

!!! warning "事务坑"
    - **忘了回滚**：多步写中途抛错，前面已提交的部分不会回滚 → 数据不一致。用框架事务（自动 rollback）而非手动。
    - **事务太长**：事务内做网络调用/慢查询，锁持有时间长，并发死锁/超时。事务尽量短，只包必要写。
    - **死锁**：两个事务互相等对方锁。应用层统一**加锁顺序**，或捕获死锁重试。
    - `synchronize:true` 上生产会改表 → 必须 false + migration（见 [NestJS 进阶](nestjs-pro.md)）。

---

## 三、连接池（Connection Pool）

**为什么**：每次请求新建 DB 连接开销巨大，连接数爆了 DB 直接拒绝。

```ts
// pg 连接池（全局单例）
const pool = new Pool({ max: 20, idleTimeoutMillis: 30000 })
// 用完 release，别每次 new Pool
```

!!! danger "连接池坑"
    - **连接泄漏**：查询后忘了 `release`/`close`，池子耗尽，新请求全卡住。用 `try/finally` 或 ORM 自动管理。
    - **池大小盲目调大**：超过 DB 承受上限反而更慢（上下文切换 + DB 压力）。按并发量逐步压测定。
    - **多实例共享一个池上限**：N 个 Node 实例 × 每实例 max 20 = DB 实际 20N 连接，DB `max_connections` 要算总账。

---

## 四、读写分离与复制

**为什么**：读多写少场景，把读流量分到只读副本，主库只写，提升吞吐。

- 主库（Master）写，从库（Replica）读，数据异步复制。
- 应用层用读写分离中间件（如 `pg` 的读从库、或 ProxySQL）。

!!! warning "主从延迟坑"
    - 主库写入后立刻从库读，可能读到**旧数据**（复制有延迟）。关键读（刚写完立刻读自己）要走主库。
    - 延迟期间从库数据不一致，金融/库存类强一致读必须主库。

---

## 五、分库分表（海量数据）

**为什么**：单表几千万/上亿行，索引也救不了，要水平拆分。

- **分表**：按 `user_id % 64` 或时间范围拆成 `orders_2024_01` 等。
- **分库**：不同业务/不同分片放不同数据库实例。
- 中间件：ShardingSphere、Vitess。

!!! tip "分片原则"
    - 选**高基数、均匀**的分片键（如 user_id），别用性别/状态（数据倾斜）。
    - 能不拆就不拆：先索引优化、读写分离、归档冷数据，拆库是最后手段（运维复杂度爆炸）。
    - 跨分片查询/JOIN 很痛苦，设计时就避免跨分片事务。

---

## 六、DB 性能自查清单

- [ ] 高频查询有索引，`EXPLAIN` 确认走索引（无全表扫描）
- [ ] 联合索引遵循最左前缀，避免函数/隐式转换失效
- [ ] 写操作包事务且有回滚
- [ ] 事务短小，不在事务内做网络调用
- [ ] 连接池单例、用完释放、大小匹配并发
- [ ] 读写分离注意主从延迟，强一致读走主库
- [ ] 慢查询有监控告警（慢日志 / APM）
- [ ] 大表有归档/分表计划

配合：[性能调优](performance-tuning.md)、[NestJS 进阶·DB](nestjs-pro.md)、[部署与运维](deploy-ops.md)。
