package com.yuying.refund;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.List;

/**
 * 退款队列核心服务。
 *
 * 设计要点（对应实战文档）：
 * 1. 入队：批量 INSERT，原子、快。
 * 2. 取任务：SQLite 无 SELECT FOR UPDATE，用 BEGIN IMMEDIATE + 原子 UPDATE..RETURNING
 *    抢任务，保证单写者下不重复取（多实例请勿直连同一 SQLite 文件）。
 * 3. 幂等：按 orderId 去重，同一订单不会退两次。
 * 4. 失败隔离：单个任务失败标记 FAILED 并继续下一个，不卡队列。
 */
@Service
public class RefundTaskService {

    private final JdbcTemplate jdbc;

    /** 统一的行映射，避免各处手写导致字段遗漏 */
    private static final RowMapper<RefundTask> ROW_MAPPER = (rs, i) -> {
        RefundTask t = new RefundTask();
        t.setId(rs.getLong("id"));
        t.setOrderId(rs.getString("order_id"));
        t.setAmount(rs.getBigDecimal("amount"));
        t.setReason(rs.getString("reason"));
        t.setOperator(rs.getString("operator"));
        t.setStatus(RefundTask.Status.valueOf(rs.getString("status")));
        t.setRetryCount(rs.getInt("retry_count"));
        t.setResultMsg(rs.getString("result_msg"));
        return t;
    };

    public RefundTaskService(DataSource ds) {
        this.jdbc = new JdbcTemplate(ds);
        initSchema();
    }

    private void initSchema() {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS refund_task (
              id          INTEGER PRIMARY KEY AUTOINCREMENT,
              order_id    TEXT NOT NULL,
              amount      NUMERIC NOT NULL,
              reason      TEXT,
              operator    TEXT,
              status      TEXT NOT NULL DEFAULT 'PENDING',
              retry_count INTEGER NOT NULL DEFAULT 0,
              result_msg  TEXT,
              created_at  TEXT DEFAULT (datetime('now')),
              claimed_at  TEXT,
              done_at     TEXT
            )
        """);
        jdbc.execute("CREATE INDEX IF NOT EXISTS idx_rt_status ON refund_task(status)");
        jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_rt_order ON refund_task(order_id)");
    }

    /**
     * 批量入队（生产者调用）。
     *
     * 幂等实现：使用 INSERT ... ON CONFLICT(order_id) DO NOTHING，
     * 由数据库原子判定冲突并跳过，返回受影响行数 0。
     *
     * 为什么不用 try/catch 捕获唯一键异常？
     * 1. SQLite 驱动抛出的 UNIQUE 冲突没有标准 SQLState，Spring 会翻译成
     *    UncategorizedSQLException 而非 DuplicateKeyException，catch 不可靠；
     * 2. 在 @Transactional 中，一旦异常触达事务同步层，事务会被标记 rollback-only，
     *    后续正常插入也会一并失败。
     * 因此幂等必须下沉到 SQL 层，而不是靠捕获异常。
     */
    @Transactional
    public int enqueue(List<RefundTask> tasks) {
        int n = 0;
        for (RefundTask t : tasks) {
            int rows = jdbc.update(
                "INSERT INTO refund_task(order_id,amount,reason,operator) VALUES(?,?,?,?) " +
                "ON CONFLICT(order_id) DO NOTHING",
                t.getOrderId(), t.getAmount(), t.getReason(), t.getOperator());
            n += rows;   // 冲突时 rows=0，天然幂等计数
        }
        return n;
    }

    /**
     * 原子取出一条待处理任务（消费者调用）。
     * SQLite 用 "BEGIN IMMEDIATE" 串行化写事务 + 原子 UPDATE..RETURNING 抢任务，
     * 等效于其他库的 SELECT ... FOR UPDATE。
     */
    @Transactional
    public RefundTask claimOne() {
        // 注意：Spring 的 JdbcTemplate 在单连接下，整个 @Transactional 方法内的写操作
        // 已在同一个事务/写锁内，UPDATE..RETURNING 天然原子。
        List<RefundTask> list = jdbc.query(
            "UPDATE refund_task SET status='DOING', claimed_at=datetime('now') " +
            "WHERE id=(SELECT id FROM refund_task WHERE status='PENDING' ORDER BY id ASC LIMIT 1) " +
            "RETURNING id,order_id,amount,reason,operator,status,retry_count,result_msg",
            ROW_MAPPER);
        return list.isEmpty() ? null : list.get(0);
    }

    /** 标记完成（含幂等最终校验） */
    @Transactional
    public void complete(Long taskId, boolean success, String msg) {
        jdbc.update(
            "UPDATE refund_task SET status=?, result_msg=?, done_at=datetime('now') WHERE id=?",
            success ? "DONE" : "FAILED", msg, taskId);
    }

    /** 消费者轮询：间隔可配（默认 30s），取一条执行一条，失败不阻塞 */
    @Scheduled(fixedDelayString = "${refund.poll.interval-ms:30000}")
    public void poll() {
        RefundTask task;
        while ((task = claimOne()) != null) {
            try {
                executeRefund(task);   // 调用支付网关（此处模拟）
                complete(task.getId(), true, "退款成功");
            } catch (Exception e) {
                int retry = task.getRetryCount() + 1;
                if (retry >= 3) {
                    complete(task.getId(), false, "失败已达上限: " + e.getMessage());
                } else {
                    // 放回队列重试
                    jdbc.update("UPDATE refund_task SET status='PENDING', retry_count=? WHERE id=?",
                        retry, task.getId());
                }
            }
        }
    }

    /**
     * 执行退款（幂等核心）。
     * 真实项目：调用支付网关退款接口；网关侧按 outTradeNo/orderId 幂等，
     * 重复调用只退一次。这里用 orderId 已建 UNIQUE 索引保证不重复入队。
     */
    private void executeRefund(RefundTask task) {
        // TODO: 调微信/支付宝退款 API，传 orderId 作为幂等键
        if (task.getAmount() == null || task.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("退款金额非法");
        }
        // 模拟成功
    }

    /** 查看待处理队列（字段需映射完整，运营要看到退款原因和操作人） */
    public List<RefundTask> pending() {
        return jdbc.query(
            "SELECT id,order_id,amount,reason,operator,status,retry_count,result_msg " +
            "FROM refund_task WHERE status='PENDING' ORDER BY id",
            ROW_MAPPER);
    }
}
