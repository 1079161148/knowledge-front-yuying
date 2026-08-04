# ☕ 后端面试题（高频 / 经典 / 踩坑）

> 后端岗（Java / Node / 通用服务端）求职常问 + 大厂真题。按 **基础 · JVM · 并发 · MySQL · Redis · Spring · 分布式 · 场景/踩坑** 划分。答案依据 **[Java Language Spec](https://docs.oracle.com/javase/specs/)**、**[Spring 官方文档](https://spring.io/projects/spring-framework)**、**[MySQL 官方文档](https://dev.mysql.com/doc/)**、**[Redis 官方文档](https://redis.io/docs/)**、**[Guide 哥 JavaGuide](https://javaguide.cn/)**（社区权威整理）。

---

## 1. Java 基础经典题

#### Q1：== 和 equals 的区别？
- `==`：基本类型比值、引用类型比地址。
- `equals`：默认等价于 `==`，但 `String/Integer` 等重写了，比**内容**；重写 `equals` 必须重写 `hashCode`。

#### Q2：String、StringBuilder、StringBuffer？
- `String` 不可变（线程安全、常量池复用）；`StringBuilder` 可变、非线程安全、快；`StringBuffer` 方法加 `synchronized`、线程安全、慢。
- 循环拼接用 `StringBuilder`，别用 `+`（产生大量临时对象）。

#### Q3：HashMap 底层（JDK 8）？
- 数组 + 链表 + 红黑树：默认容量 16、负载因子 0.75；hash 冲突先链表，链表长度 ≥8 且数组 ≥64 转红黑树，≤6 退化为链表。
- 扩容：翻倍，迁移时**高低位拆分**减少 rehash。

#### Q4：为什么用 Integer 缓存？`128==128` 是多少？
- `IntegerCache` 缓存 -128~127，此区间 `Integer.valueOf` 复用对象；故 `127==127` 为 true，`128==128` 为 **false**（超出缓存是新对象）。

## 2. JVM 经典题

#### Q5：JVM 内存结构？
- 线程私有：程序计数器、虚拟机栈（栈帧/局部变量）、本地方法栈。
- 线程共享：堆（对象实例，GC 主战场）、方法区（元空间，类信息/常量）。

#### Q6：GC 怎么判断对象可回收？常见垃圾回收器？
- 可达性分析（GC Roots 不可达）；Java 用**分代收集**：新生代（复制算法，Minor GC）+ 老年代（标记-整理/清除）。
- 回收器：G1（Region 化、可预测停顿，JDK9+ 默认）、ZGC（超低停顿、TB 级堆）。

## 3. 并发经典题

#### Q7：synchronized 和 ReentrantLock 区别？
- `synchronized`：JVM 内置、自动释放、可重入，锁升级（无锁→偏向→轻量→重量）。
- `ReentrantLock`：API 控制、可**公平锁**、可**中断**、可多条件 `Condition`、需手动 `unlock`（try-finally）。

#### Q8：线程池参数与拒绝策略？
- 核心参数：核心线程、最大线程、队列、空闲存活、拒绝策略。
- 任务流程：核心满 → 入队 → 队满 → 开非核心 → 再满 → 拒绝。
- 拒绝：Abort（抛异常）、CallerRuns（调用者线程执行）、Discard、DiscardOldest。

#### Q9：volatile 能保证原子性吗？
- 只保证**可见性 + 有序性**（禁止指令重排），**不保证原子性**（如 `i++` 非原子）；原子性用 `AtomicInteger` / 锁。

## 4. MySQL 高频题

#### Q10：索引为什么用 B+ 树？聚簇 vs 非聚簇？
- B+ 树：矮胖（减少 IO）、叶子链表有序、非叶只存 key，查询稳定 O(log n)。
- 聚簇索引（InnoDB）：数据即索引，主键叶子存整行；二级索引叶子存主键（回表）。
- 覆盖索引：查询字段都在索引里，免回表。

#### Q11：最左前缀原则？什么时候索引失效？
- 联合索引 `(a,b,c)` 必须从最左连续用；跳列（只用 b,c）失效。
- 失效场景：对列做函数/运算、隐式类型转换、`%xx` 前模糊、`or` 不全是索引、优化器选全表。

#### Q12：事务隔离级别与脏读/幻读？
- 读未提交 → 读已提交（防脏读）→ 可重复读（InnoDB 默认，MVCC 防幻读）→ 串行化。
- InnoDB 用 **MVCC + 间隙锁（Next-Key Lock）** 在 RR 下防幻读。

## 5. Redis 高频题

#### Q13：Redis 为什么快？
- 纯内存、单线程（避免锁/上下文切换，6.0+ 引入 IO 多线程但命令仍单线程）、IO 多路复用（epoll）、高效数据结构。

#### Q14：缓存穿透 / 击穿 / 雪崩？怎么解决？
- **穿透**：查不存在的 key → 打 DB。解法：缓存空值、布隆过滤器。
- **击穿**：热点 key 过期瞬间大量请求打 DB。解法：互斥锁重建、逻辑过期（不真删）。
- **雪崩**：大量 key 同时过期 / Redis 挂。解法：过期时间加随机、集群高可用、限流降级。

#### Q15：怎么保证缓存与数据库一致性？
- 读：先缓存后 DB，命中返回。
- 写：**先更新 DB，再删缓存**（Cache-Aside + 延迟双删兜底）；严格一致用 Canal 订阅 binlog 异步刷新。

## 6. Spring 高频题

#### Q16：Spring Bean 生命周期？
- 实例化 → 属性填充（依赖注入）→ Aware 回调 → `BeanPostProcessor` 前置 → 初始化（`@PostConstruct`/`InitializingBean`）→ 后置 → 就绪 → 销毁（`@PreDestroy`/`DisposableBean`）。

#### Q17：Spring 循环依赖怎么解决？
- 三级缓存：singletonObjects（成品）→ earlySingletonObjects（早期）→ singletonFactories（工厂，暴露半成品引用）。
- 仅**单例 + setter/字段注入**可解；构造器注入循环无法解（报错）。

#### Q18：Spring Boot 自动配置原理？
- `@SpringBootApplication` 含 `@EnableAutoConfiguration`；`spring.factories` / `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 列出候选；按 `@Conditional` 条件（类存在/classpath/配置）按需装配。

## 7. 分布式与场景题

#### Q19：分布式锁怎么实现？Redis 还是 Zookeeper？
- Redis：`SET key value NX PX`（_SET if not exist_）加锁，用 **Lua 脚本**保证删锁原子性；注意锁过期但业务没跑完（看门狗续期，Redisson 已实现）。
- ZK：临时顺序节点，强一致但性能低。
- 选型：高并发低延迟用 Redis（AP），强一致用 ZK（CP）。

#### Q20：如何设计一个短链 / 发号器（雪花算法）？
- 雪花：时间戳(41)+机器id(10)+序列(12)；趋势递增、不重复；注意**时钟回拨**问题（缓存上次时间戳、回拨告警/等待）。
- 短链：发号 → 转 62 进制 → 映射存储（Redis + DB），重定向 302。

#### Q21：接口幂等怎么设计？
- 前端：按钮防重；后端：**唯一索引 / 唯一流水号 + 去重表 / Redis 原子标记 / Token 机制**。详见 [Java 幂等通用套路](../practice/java/idempotent.md)。

## 8. 后端踩坑经验题

#### Q22：生产慢查询怎么排查？
- `slow_query_log` 开慢日志 → `EXPLAIN` 看执行计划（type/key/rows/Extra）→ 缺索引就建、索引失效就改写 SQL、深分页用游标/延迟关联。

#### Q23：线上 Full GC 频繁 / OOM 怎么定位？
- `jstat -gc` 看 GC 频率；`jmap -dump` 抓堆；MAT 分析大对象；常见：内存泄漏（集合未清、监听未注销）、大对象、元空间不足、堆设太小。
- 用 **Arthas** 线上诊断：`dashboard`、`thread`、`watch` 不重启排查。

#### Q24：库存超卖怎么防？
- 数据库层：`UPDATE stock SET n=n-1 WHERE id=? AND n>0`（乐观，受影响行数判断）。
- 缓存层：Redis `DECR` / Lua 原子扣减；配合 MQ 异步落库；高并发用分布式锁或 Redis + 数据库的「预扣减 + 最终一致」。

## 9. 下一步

- 算法刷题看 [Java 面试算法速览](java-algo.md)；Java 全栈实战看 [Java 工程师（0-1 到资深）](../java/index.md)。
- 缓存/锁/幂等实战看 [Java 后端真实业务实战](../practice/java/index.md)。
- 前端对照看 [前端高频面试题](frontend-high-freq.md)。
