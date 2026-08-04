package com.yuying.refund;

/**
 * 退款任务领域对象。对应 SQLite 表 refund_task。
 */
public class RefundTask {
    public enum Status { PENDING, DOING, DONE, FAILED }

    private Long id;
    private String orderId;
    private java.math.BigDecimal amount;
    private String reason;
    private String operator;
    private Status status = Status.PENDING;
    private int retryCount = 0;
    private String resultMsg;

    public RefundTask() {}

    public RefundTask(String orderId, java.math.BigDecimal amount, String reason, String operator) {
        this.orderId = orderId;
        this.amount = amount;
        this.reason = reason;
        this.operator = operator;
    }

    // getters / setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public java.math.BigDecimal getAmount() { return amount; }
    public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
    public String getResultMsg() { return resultMsg; }
    public void setResultMsg(String resultMsg) { this.resultMsg = resultMsg; }
}
