package com.yuying.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 接口限流：注解 + 拦截器（滑动窗口简易版，生产换 Redis + Lua）。
 *
 * 用法：在 Controller 方法上加 @RateLimit(permits=10, seconds=1)
 * 含义：同一 IP 每 1 秒最多 10 次，超出返回 429。
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final ConcurrentHashMap<String, Window> buckets = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if (!(handler instanceof HandlerMethod m)) return true;
        RateLimit ann = m.getMethodAnnotation(RateLimit.class);
        if (ann == null) return true;

        String key = req.getRemoteAddr() + ":" + m.getMethod().getName();
        long now = System.currentTimeMillis();
        Window w = buckets.computeIfAbsent(key, k -> new Window(ann.seconds() * 1000L));
        if (!w.tryAcquire(now, ann.permits())) {
            res.setStatus(429);
            return false;
        }
        return true;
    }

    /** 固定窗口限流（演示用；生产用 Redis+Lua 做分布式滑动窗口） */
    static class Window {
        private final long windowMs;
        private final AtomicInteger count = new AtomicInteger(0);
        private long start = System.currentTimeMillis();
        Window(long windowMs) { this.windowMs = windowMs; }
        synchronized boolean tryAcquire(long now, int permits) {
            if (now - start >= windowMs) { start = now; count.set(0); }
            return count.incrementAndGet() <= permits;
        }
    }
}
