package com.yuying.refund;

/** 统一响应包装（中后台接口基线结构） */
public class ApiResult<T> {
    public int code;
    public String message;
    public T data;
    public long ts = System.currentTimeMillis();

    public ApiResult(int code, String message, T data) {
        this.code = code; this.message = message; this.data = data;
    }
    public static <T> ApiResult<T> ok(T data) { return new ApiResult<>(0, "ok", data); }
    public static <T> ApiResult<T> fail(String msg) { return new ApiResult<>(1, msg, null); }
}
