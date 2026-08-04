# 退款队列（SQLite + 幂等）

> 对应你和"龙虾（OpenClaw）"讨论的架构：@龙虾 只入队，Spring Boot 轮询执行，SQLite 存队列，幂等防重复退。目录 `examples/java/refund-queue-sqlite/`，**可 clone 运行**。

## 最佳实践要点

- **生产者/消费者分离**：OpenClaw 只解析自然语言→批量入队→秒回；执行放 Spring Boot `@Scheduled` 轮询，**不靠 Agent 搬钱**。
- **队列用 SQLite**：中低频、要审计、零运维。`BEGIN IMMEDIATE` + 原子 `UPDATE..RETURNING` 抢任务，等效 `SELECT FOR UPDATE`（SQLite 无该语法）。
- **幂等三道闸**：① `order_id` 建 UNIQUE 索引，重复入队跳过；② 支付网关按 orderId 幂等；③ 单写者连接（`maxPoolSize=1`）防并发抢同一任务。
- **失败隔离**：单个失败标 `FAILED` 继续下一个，不卡队列；重试 3 次上限。

## 核心代码（节选）

```java
// 原子抢任务（单写者下天然串行，不重复取）
@Transactional
public RefundTask claimOne() {
    List<RefundTask> list = jdbc.query(
        "UPDATE refund_task SET status='DOING', claimed_at=datetime('now') " +
        "WHERE id=(SELECT id FROM refund_task WHERE status='PENDING' ORDER BY id ASC LIMIT 1) " +
        "RETURNING id,order_id,amount,reason,operator,status,retry_count,result_msg",
        (rs, i) -> { /* 映射 */ });
    return list.isEmpty() ? null : list.get(0);
}

// 消费者：每 30s 取一条，单条串行，失败不阻塞
@Scheduled(fixedDelay = 30_000)
public void poll() {
    RefundTask task;
    while ((task = claimOne()) != null) {
        try { executeRefund(task); complete(task.getId(), true, "退款成功"); }
        catch (Exception e) { /* 重试或标 FAILED */ }
    }
}
```

## 运行方式（整包跑起来联调）

```bash
cd examples/java/refund-queue-sqlite
mvn test                 # 跑单测，验证 入队/原子取/幂等
mvn spring-boot:run      # 启动 Web 服务（默认 8080）
```
> Windows：`mvn` 不在 PATH 时用完整路径 `& "C:\Program Files\Apache\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run`。

联调 curl（PowerShell 用 `curl.exe` + 文件传 JSON，详见下方坑 5）：

```powershell
'{"tasks":[{"orderId":"A001","amount":100.00,"reason":"用户申请","operator":"op1"},{"orderId":"A002","amount":200.00,"reason":"用户申请","operator":"op1"}]}' | Out-File -Encoding utf8 tmp.json
curl.exe -X POST http://localhost:8080/api/refund/tasks -H "Content-Type: application/json" -d "@tmp.json"; Remove-Item tmp.json
curl.exe http://localhost:8080/api/refund/tasks/pending
curl.exe -X POST http://localhost:8080/api/refund/poll
curl.exe http://localhost:8080/api/refund/tasks/pending
```

## 接口清单

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/refund/tasks` | 批量入队（生产者调用），返回成功条数 |
| GET | `/api/refund/tasks/pending` | 查看待处理队列 |
| POST | `/api/refund/poll` | 手动触发一次消费（联调用） |

## 踩坑记录（本地实跑验证过）

**坑 1：幂等不能靠 catch 唯一键异常**
最初 `try { INSERT } catch (DuplicateKeyException e) { ... }` 直接失败：① SQLite UNIQUE 冲突不是标准 SQLState，catch 不到；② `@Transactional` 内异常会让整个事务 rollback-only，正常任务也跟着回滚。
正确做法下沉到 SQL：

```java
int rows = jdbc.update(
    "INSERT INTO refund_task(order_id,amount,reason,operator) VALUES(?,?,?,?) " +
    "ON CONFLICT(order_id) DO NOTHING",
    t.getOrderId(), t.getAmount(), t.getReason(), t.getOperator());
n += rows;   // 冲突时 rows=0，天然幂等计数
```

**坑 2：手写 RowMapper 字段会漏**
`SELECT *` 只 set 了 id/orderId/amount/status，`reason`/`operator` 没读 → 队列页看到 `null`。抽成统一 `ROW_MAPPER` 常量共用。

**坑 3：共享内存库测试必须清表**
`@BeforeEach` 里 `DELETE FROM refund_task`，否则上一个用例的 PENDING 被下一个按 `id ASC` 先取走。

**坑 4：本地 8080 被残留进程占用**
`netstat -ano | findstr ":8080" | findstr "LISTEN"` 找 PID，`Stop-Process -Id <PID> -Force`；或多实例用 `--server.port=8081`。

**坑 5：PowerShell 下 curl 内联 JSON 报 400**
`curl` 是 `Invoke-WebRequest` 别名，内联双引号被转义破坏 → 后端收非法 JSON 报 400。用 `curl.exe` + 文件 `@tmp.json` 传最稳。Git Bash/Linux/macOS 原文直接可用。

## 关键点

- 支付密钥、签名放 Spring Boot，OpenClaw 不碰钱。
- 多实例横向扩展时 SQLite 不合适，换 PostgreSQL（有真 `FOR UPDATE`）。
- 单写者：`hikari.maximum-pool-size=1`，保证写串行。
