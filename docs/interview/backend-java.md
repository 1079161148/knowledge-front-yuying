# ☕ Java 面试题（高频 / 经典 / 多章节）

> 后端 Java 岗求职常问 + 大厂真题，按 **集合 · 并发 · JVM · MySQL · Redis · Spring · MyBatis · 消息队列 · 微服务 · 场景设计** 划分多章节。答案依据 **[Java Language Spec](https://docs.oracle.com/javase/specs/)**、**[Spring 官方文档](https://spring.io/projects/spring-framework)**、**[MySQL 官方文档](https://dev.mysql.com/doc/)**、**[Redis 官方文档](https://redis.io/docs/)**、**[JavaGuide](https://javaguide.cn/)**。

> 本篇与 [后端高频 / 经典 / 踩坑](backend-high-freq.md) 互补：那篇偏综合速览，本篇按主题深挖、章节更细。

---

## 1. 集合框架

#### Q1：ArrayList vs LinkedList？
- ArrayList：数组实现，随机访问 O(1)，插入删除中间 O(n)（挪移）。
- LinkedList：双向链表，头尾插删 O(1)，随机访问 O(n)；且更占内存（节点指针）。
- 结论：绝大多数场景用 ArrayList；频繁头尾操作才考虑 LinkedList。

#### Q2：HashMap 扩容机制（JDK8）？
- 默认 16、负载因子 0.75；元素超 `容量*0.75` 触发扩容到 2 倍。
- 迁移用**高低位链表**拆分（e.hash & oldCap 判断在新表的低位/高位），减少 rehash 计算。

#### Q3：ConcurrentHashMap 怎么保证线程安全？
- JDK7：分段锁（Segment 数组）；JDK8：CAS + `synchronized` 锁**单个桶头节点**（更细粒度），读基本无锁（volatile + 原子）。

#### Q4：Fail-Fast 与 Fail-Safe？
- Fail-Fast：遍历中集合结构被改抛 `ConcurrentModificationException`（ArrayList 的 `modCount` 检测）。
- Fail-Safe：基于快照（CopyOnWrite / 并发容器），不抛异常但可能读到旧数据。

## 2. 并发编程

#### Q5：线程创建的几种方式？
- 继承 `Thread`、实现 `Runnable`、实现 `Callable`（有返回值+异常）、线程池（推荐）。

#### Q6：synchronized 锁升级过程？
- 无锁 → 偏向锁（同一线程复用）→ 轻量级锁（CAS 自旋）→ 重量级锁（OS 互斥，阻塞）。
- 升级不可逆；重量级会线程挂起，开销大。

#### Q7：volatile 的语义？
- 可见性（写立即刷主存、读从主存）、有序性（禁止指令重排，插入内存屏障）；**不保证原子性**。

#### Q8：CAS 是什么？ABA 问题？
- Compare-And-Swap：无锁原子更新（期望值==实际值才改）。
- ABA：值从 A→B→A，CAS 认为没变；解决用 **AtomicStampedReference**（加版本号）。

#### Q9：线程池的工作队列选择？
- `LinkedBlockingQueue`（无界，易 OOM）、`ArrayBlockingQueue`（有界）、`SynchronousQueue`（不缓存，直接交线程）、`DelayedWorkQueue`（定时）。
- 建议用有界队列 + 合理拒绝策略，防止资源被撑爆。

## 3. JVM

#### Q10：GC 算法有哪些？
- 标记-清除（有碎片）、标记-整理（无碎片但慢）、复制（新生代用，存活少时高效）、分代收集（综合）。

#### Q11：对象什么情况下进入老年代？
- 熬过多次 Minor GC（年龄阈值 `-XX:MaxTenuringThreshold`）、大对象直接进老年代、Survivor 区同龄对象超半数。

#### Q12：常见 OOM 类型？
- `Java heap space`（堆满）、`Metaspace`（类元数据多）、`GC overhead limit exceeded`（98% 时间 GC 却回收 <2%）、`Direct buffer`（堆外内存）。

## 4. MySQL

#### Q13：聚簇索引 vs 二级索引？回表？
- 聚簇：InnoDB 主键叶子存整行；二级索引叶子存主键值，查非索引列需**回表**（用主键再查）。
- 覆盖索引：查询列都在索引中，避免回表。

#### Q14：事务隔离级别与实现？
- RU/RC/RR（默认）/Serializable。
- RR 靠 **MVCC**（undo log 版本链 + ReadView）+ **Next-Key Lock**（间隙锁）防幻读。

#### Q15：explain 重点看哪些字段？
- `type`（访问类型，const > ref > range > index > ALL）、`key`（实际索引）、`rows`（扫描行）、`Extra`（`Using index` 覆盖、`Using filesort` 排序、`Using temporary` 临时表）。

## 5. Redis

#### Q16：ZSet 底层结构？
- 跳表（skiplist）+ 哈希表；元素少且小时用压缩列表（ziplist/listpack）。跳表支持范围查询 O(log n)。

#### Q17：Redis 持久化 RDB vs AOF？
- RDB：快照，恢复快、体积小，但可能丢数据、fork 阻塞。
- AOF：追加命令，丢数据少（everysec），文件大、恢复慢；4.0+ 支持混合持久化。

#### Q18：缓存一致性（延迟双删）？
- 写：更新 DB → 删缓存 → 延迟（如 500ms）再删一次（兜底并发读到的旧值回填）。

## 6. Spring / MyBatis

#### Q19：Spring 的 AOP 实现与场景？
- 动态代理：JDK 代理（接口）、CGLIB（类，继承）；用于事务、日志、鉴权、限流。
- 切面 = 切点（where）+ 通知（when: @Before/@After/@Around）+ 增强逻辑。

#### Q20：Spring 事务失效的常见场景？
- 非 public 方法、自调用（同类方法调事务方法，代理失效）、异常被 catch 未抛出、数据库引擎不支持（MyISAM 无事务）、传播行为配置错。

#### Q21：MyBatis 的 # 与 $ 区别？
- `#{}` 预编译（占位符，防 SQL 注入）；`${}` 字符串拼接（有注入风险，仅用于动态表名/排序且需校验）。

## 7. 消息队列（Kafka/RabbitMQ）

#### Q22：消息队列解决什么问题？
- 异步（削峰填谷）、解耦（生产者不依赖消费者）、削峰（扛突发流量）。
- 场景：订单后续发短信/积分、日志收集、事件驱动。

#### Q23：如何保证消息不丢失？
- 生产：确认机制（Kafka `acks=all` + 重试）；Broker：副本同步；消费：手动提交 offset（处理成功再提交）。
- 幂等：消费端去重（唯一键 / Redis 标记）。

#### Q24：Kafka 怎么保证顺序？
- 同 partition 内有序；需要全局顺序就让相关消息发同一 partition（按 key hash）；消费端单线程消费该 partition。

## 8. 微服务与分布式

#### Q25：微服务 vs 单体？何时用微服务？
- 单体：简单、部署易；微服务：独立部署/扩展/技术异构，但运维复杂（注册中心/配置/网关/链路）。
- 中小团队先用模块化单体，业务复杂、团队扩张再拆。

#### Q26：服务注册发现、配置中心、网关作用？
- 注册发现（Nacos/Eureka）：实例上下线自动感知。
- 配置中心（Nacos/Apollo）：配置热更新。
- 网关（Gateway）：统一入口、路由、鉴权、限流、熔断。

#### Q27：分布式事务方案？
- 2PC/TCC（强一致、复杂）、**本地消息表 / 事务消息**（最终一致，常用）、Saga（长事务补偿）、最大努力通知。

## 9. 场景设计

#### Q28：如何设计一个限流组件？
- 计数器（固定窗口）、**滑动窗口**、**漏桶**（恒定速率）、**令牌桶**（允许突发）；Redis + Lua 原子实现分布式限流（见 [接口限流实战](../practice/java/rate-limit.md)）。

#### Q29：如何设计短链系统？
- 发号器（雪花/号段）+ base62 编码 → 映射存储；重定向 302；热点用 Redis 缓存；布隆过滤器挡非法 key。

## 10. 下一步

- 综合速览看 [后端高频 / 经典 / 踩坑](backend-high-freq.md)；算法看 [Java 面试算法速览](java-algo.md)。
- Node/NestJS 后端看 [Node.js 面试题](backend-node.md)、[NestJS 面试题](backend-nestjs.md)。
- 实战落地看 [Java 后端真实业务实战](../practice/java/index.md)。
