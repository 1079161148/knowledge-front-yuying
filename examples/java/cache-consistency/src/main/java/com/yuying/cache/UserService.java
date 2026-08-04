package com.yuying.cache;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 缓存一致性最佳实践（Cache-Aside + 延迟双删）。
 *
 * 读：缓存命中直接返回；未命中查 DB 并回写。
 * 写：先更新 DB → 删缓存 → 延迟（如 500ms）再删一次（防并发读回脏数据）。
 *
 * 仍存在的极端窗口（并发读+写）用「设置较短 TTL」兜底，最终一致。
 */
@Service
public class UserService {

    private final StringRedisTemplate redis;
    private final UserRepository repo;

    public UserService(StringRedisTemplate redis, UserRepository repo) {
        this.redis = redis;
        this.repo = repo;
    }

    public String getUserName(Long id) {
        String cacheKey = "user:" + id;
        String cached = redis.opsForValue().get(cacheKey);
        if (cached != null) return cached;            // 1. 命中

        String name = repo.findNameById(id);          // 2. 查 DB
        redis.opsForValue().set(cacheKey, name, 5, TimeUnit.MINUTES); // 3. 回写（短 TTL 兜底）
        return name;
    }

    public void updateUserName(Long id, String name) {
        repo.updateName(id, name);                    // 1. 先更新 DB
        redis.delete("user:" + id);                   // 2. 删缓存
        // 3. 延迟双删：防「读请求在删缓存前回写了旧值」
        new Thread(() -> {
            try { Thread.sleep(500); } catch (InterruptedException ignored) {}
            redis.delete("user:" + id);
        }).start();
    }

    // 简单内存实现，真实项目换成 JPA/MyBatis
    public static class UserRepository {
        public String findNameById(Long id) { return "user-" + id; }
        public void updateName(Long id, String name) {}
    }
}
