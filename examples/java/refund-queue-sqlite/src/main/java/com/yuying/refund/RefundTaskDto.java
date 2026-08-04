package com.yuying.refund;

import java.math.BigDecimal;
import java.util.List;

/** 入队请求体（对应 OpenClaw 生产者 POST 的 JSON 数组项） */
public class RefundTaskDto {
    private String orderId;
    private BigDecimal amount;
    private String reason;
    private String operator;

    public RefundTaskDto() {}

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    /** 转领域对象 */
    public RefundTask toEntity() {
        return new RefundTask(orderId, amount, reason, operator);
    }

    /** 批量入队请求 */
    public static class BatchRequest {
        private List<RefundTaskDto> tasks;
        public List<RefundTaskDto> getTasks() { return tasks; }
        public void setTasks(List<RefundTaskDto> tasks) { this.tasks = tasks; }
    }
}
