package com.yuying.refund;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 单元测试即文档：跑通即证明逻辑正确。
 * 内存 SQLite 由 src/test/resources/application-test.properties 覆盖 url 提供，
 * 保证单写者（连接池 max=1）模拟生产约束。
 *
 * 注意：连接池 max=1 且为内存库，整个测试类共享同一个数据库实例，
 * 因此每个用例前必须清表，否则用例间会互相污染（例如上一个用例遗留的
 * PENDING 任务会被下一个用例的 claimOne() 先取走）。
 */
@SpringBootTest(classes = RefundApplication.class, webEnvironment = WebEnvironment.NONE)
@ActiveProfiles("test")
class RefundTaskServiceTest {

    @Autowired RefundTaskService service;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void cleanUp() {
        jdbc.update("DELETE FROM refund_task");
    }

    @Test
    void shouldEnqueueAndClaimOneByOne() {
        List<RefundTask> tasks = new ArrayList<>();
        tasks.add(new RefundTask("A001", new BigDecimal("100.00"), "用户申请", "op1"));
        tasks.add(new RefundTask("A002", new BigDecimal("200.00"), "用户申请", "op1"));
        int n = service.enqueue(tasks);
        assertEquals(2, n);

        RefundTask first = service.claimOne();
        assertNotNull(first);
        assertEquals("A001", first.getOrderId());

        RefundTask second = service.claimOne();
        assertNotNull(second);
        assertEquals("A002", second.getOrderId());

        // 没有更多 pending
        assertNull(service.claimOne());
    }

    @Test
    void shouldBeIdempotentOnDuplicateOrder() {
        service.enqueue(List.of(new RefundTask("B001", new BigDecimal("50"), "r", "op")));
        // 重复入队同一订单 → 幂等跳过
        int n = service.enqueue(List.of(new RefundTask("B001", new BigDecimal("50"), "r", "op")));
        assertEquals(0, n);

        // 只能取出一条
        assertNotNull(service.claimOne());
        assertNull(service.claimOne());
    }
}
