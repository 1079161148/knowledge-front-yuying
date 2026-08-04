# 全局唯一 ID（雪花算法）

分库分表、分布式下单、消息去重都需要**全局唯一且趋势递增**的 ID。UUID 无序、DB 自增不能跨库。**雪花算法（Snowflake）**是主流，但时钟回拨是头号坑。

## 一、ID 结构（64bit）

```
| 1bit符号 | 41bit时间戳(ms) | 10bit workerId | 12bit 序列号 |
```

- 41bit 时间戳可用 ~69 年；10bit workerId 支持 1024 节点；12bit 序列号每毫秒 4096 个。
- 趋势递增 → 主键索引友好（B+ 树插入不频繁分裂）。

## 二、标准实现（含时钟回拨处理）

```java
public class Snowflake {
    private final long workerId;
    private long lastTs = -1L;
    private long seq = 0L;

    public synchronized long nextId() {
        long ts = System.currentTimeMillis();
        if (ts == lastTs) {
            seq = (seq + 1) & 0xFFF;            // 同毫秒内自增
            if (seq == 0) ts = waitNextMillis(lastTs);  // 溢出则等下一毫秒
        } else if (ts < lastTs) {
            // 时钟回拨：小幅回拨等一会儿，大幅回拨直接抛错（见下文方案）
            ts = handleClockBackwards(lastTs);
        } else {
            seq = 0;
        }
        lastTs = ts;
        return (ts << 22) | (workerId << 12) | seq;
    }
}
```

## 三、时钟回拨怎么破（重点）

服务器 NTP 校时会让时钟**往回跳**，若直接 `ts < lastTs` 生成 ID 可能**重复**（和回拨前的 ID 撞）。

三种处理：

1. **小幅回拨（<5ms）：自旋等待**追上 `lastTs` 再生成。
2. **大幅回拨：抛异常 + 告警**，宁可不可用也不出重复 ID（推荐金融场景）。
3. **容忍回拨：借用扩展位**——用 workerId 里借 1~2 bit 作 "clock offset" 序号，回拨期间递增，保证不重复（百度 UidGenerator 思路）。

> 更省心的生产方案：**号段模式（Leaf-segment）**——DB/Redis 一次取一段（如 1000 个）内存分配，不依赖时钟，无回拨问题；或 **Leaf-snowflake + ZooKeeper 分配 workerId + 监控时钟**。

## 四、workerId 怎么分配（别写死）

- **手动配置**：每台机器配置文件写死 → 易冲突（复制镜像忘了改）。
- **自动分配**：ZooKeeper/etcd 顺序节点、或启动向配置中心抢号、或取**机器 IP 后几位 + 端口**哈希。
- **K8s**：用 `STATEFULSET` 的 `pod ordinal` 当 workerId（稳定且唯一）。

## 五、踩坑清单

- **workerId 冲突**：两台机器配了同一个 → 生成相同 ID → 主键冲突。务必自动分配 + 启动校验。
- **时钟回拨不处理**：NTP 校时回拨 → 重复 ID。必须上面三种之一。
- **序列号溢出**：单毫秒 >4096 个请求 → 等下一毫秒（已实现），否则会重复。
- **ID 传给前端精度丢失**：JS `Number` 只有 53bit 精度，64bit ID 传到前端尾数被截 → **ID 用字符串传前端**，或只取低位。
- **时间戳用秒而非毫秒**：41bit 秒级只能用 1.4 年就溢出 → 必须用毫秒。
- **Snowflake 测性能**：单线程百万级/秒，够绝大多数场景，别过早优化。

## 六、选型对照

| 方案 | 优点 | 缺点 | 适用 |
|------|------|------|------|
| Snowflake | 趋势递增、本地生成 | 时钟回拨、workerId | 绝大多数 |
| 号段 Leaf-segment | 不依赖时钟、吞吐高 | 需中心存储 | 高并发、跨数据中心 |
| UUID | 无中心、简单 | 无序、36字符大 | 非主键、traceId |
| Redis INCR | 简单递增 | 强依赖 Redis、有热点 | 小流量 |

## 七、面试 STAR

- **难点**：分库分表后自增 ID 冲突 → 上 Snowflake，但一次 NTP 校时回拨导致两笔订单同 ID → 加时钟回拨处理（小回拨自旋、大回拨抛错告警）。
- **亮点**：workerId 用 K8s StatefulSet ordinal 自动分配，零冲突；ID 字符串下发前端避免精度丢失。
- **坑**：前端收到 ID 尾数变 0（JS 精度），全链路改 String 修复。
