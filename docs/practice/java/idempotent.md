# 幂等通用套路

"同一个请求多次执行，结果一致"——这是支付、下单、退款、消息消费不出错的根。前端重试、网络重发、MQ 至少一次投递，都会让同一操作跑多次。**幂等不是某个框架，是一套要在每一层兜底的纪律。**

## 一、四类典型场景与对应方案

| 场景 | 方案 | 说明 |
|------|------|------|
| 新增（下单/支付） | **去重表 + 唯一索引** | 用业务唯一键（orderId）插，冲突即跳过 |
| 更新（改状态/余额） | **状态机 + 版本号** | 只接受合法状态流转，重复流转 no-op |
| 重试安全的查询 | 天然幂等 | GET 不副作用 |
| MQ 消费重复 | **消费去重表** | 用 msgId 记录已处理 |

## 二、去重表（插入型幂等）

```java
@Transactional
public Result createOrder(CreateReq req) {
    try {
        // order_id 建 UNIQUE 索引，重复插入直接失败
        repo.insert(new Order(req.getOrderId(), req.getAmount()));
    } catch (DuplicateKeyException e) {
        // 已存在：返回已有的，不重复创建（幂等）
        return Result.ok(repo.findByOrderId(req.getOrderId()));
    }
    return doBusiness(req);
}
```
> 注意：`@Transactional` 内 catch 唯一键异常后，事务可能被标记 rollback-only（见退款队列坑 1）。优先用 `ON CONFLICT DO NOTHING` / `INSERT IGNORE` 让数据库层幂等，避免异常触达事务层。

## 三、前端 Token + 后端校验（防重复提交）

```java
// 1. 进入页面发 token 存 Redis（一次性）
String token = UUID.randomUUID().toString();
redis.setex("idempotent:" + token, 300, "1");

// 2. 提交时带 token，Lua 原子"校验并删除"（防并发双提交）
String script = "if redis.call('get',KEYS[1]) then redis.call('del',KEYS[1]) return 1 else return 0 end";
Long ok = redis.execute(new DefaultRedisScript<>(script, Long.class), List.of("idempotent:" + token));
if (ok == 0) throw new RepeatSubmitException();   // token 已用/不存在
```

## 四、状态机（更新型幂等）

```java
// 退款：只允许 PENDING→DOING→DONE/FAILED，重复推进是 no-op
public void advance(Long id, Status next) {
    Order o = repo.lock(id);                  // SELECT ... FOR UPDATE
    if (!o.getStatus().canTransitTo(next)) {
        if (o.getStatus() == next) return;    // 已是目标态 → 幂等返回
        throw new IllegalStateTransitionException();
    }
    o.setStatus(next);
    repo.save(o);
}
```
> 配合**乐观锁**（`UPDATE ... SET status=?, version=version+1 WHERE id=? AND version=?`）防并发覆盖。

## 五、MQ 消费幂等

```java
@RabbitListener(queues = "order.paid")
public void on(OrderPaidMsg msg) {
    if (consumed.contains(msg.getMsgId())) return;   // 或查 DB 去重表
    consumed.add(msg.getMsgId());                     // 先记后做
    handle(msg);
}
```

## 六、踩坑清单

- **只在入口拦截重复提交**：前端 token 防的是手抖，网络层重发 / MQ 重投照样进 → 必须**业务层去重表/状态机**兜底，token 只是第一道。
- **catch 唯一键异常在事务内**：导致 rollback-only 连带回滚 → 用 DB 层 `ON CONFLICT`/IGNORE 幂等，或 catch 后不回滚正常路径。
- **状态机不校验来源态**：`UPDATE status='DONE'` 无 WHERE 旧态 → 已退款的又被改成 DONE（看似幂等实则掩盖 bug）→ 用 `WHERE status=? AND version=?`。
- **去重表和业务表不同库**：去重写成功、业务写失败、回滚不一致 → 同事务或最终一致补偿。
- **用请求参数当幂等键**：参数被前端改一点就不是一个键 → 用**业务唯一标识**（orderId/流水号）。
- **token 不过期**：永久有效 → 设短 TTL + 用完即删。

## 七、面试 STAR

- **难点**：支付回调网络重发，同一笔重复入账 → 加"流水号唯一索引 + 状态机"双兜底，重复回调直接幂等返回。
- **亮点**：前端 token + 业务去重表 + 状态机 + MQ msgId 四层幂等，资金类零重复。
- **坑**：最初只在 Controller 拦重提交，MQ 重投仍重复 → 下沉到业务层去重表，根治。
