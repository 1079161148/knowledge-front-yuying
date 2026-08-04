# ⚡ 性能调优专题（CPU / 内存 / 事件循环）

> 服务"能跑"和"跑得快、扛得住"是两回事。本篇讲后端工程师进阶到**高级/资深**必须掌握的性能诊断与优化：事件循环延迟、内存泄漏、CPU 瓶颈、慢查询。全篇配诊断命令与避坑。
>
> 依据 **[Node.js 官方 perf 文档](https://nodejs.org/en/docs/guides/diagnostics/)**、**[clinic.js](https://clinicjs.org/)**、**[V8 调优](https://v8.dev/docs)**。

---

## 一、先建立性能基线认知

Node 性能瓶颈通常来自三类：

| 类型 | 现象 | 根因 |
|------|------|------|
| **CPU 密集** | 单核 100%、所有请求变慢 | 大循环/JSON 解析/加密/压缩卡住事件循环 |
| **内存泄漏** | RSS 缓慢上涨不回落 | 监听器/全局缓存/流未关/闭包引用 |
| **I/O 等待** | QPS 上不去、延迟高 | 慢查询/外部 API 慢/连接池打满 |

!!! tip "诊断顺序"
    1. 看 **CPU 利用率** 和 **事件循环延迟**（是否卡循环）
    2. 看 **内存曲线**（是否泄漏）
    3. 看 **外部依赖耗时**（DB/Redis/HTTP）
    别一上来就"加机器"，先定位瓶颈类型。

---

## 二、事件循环延迟（最隐蔽的卡顿）

事件循环被同步重活阻塞时，所有请求一起变慢，但 CPU 可能并不满。

```js
// 测量事件循环延迟（生产可监控告警）
const start = process.hrtime.bigint()
setImmediate(() => {
  const delay = Number(process.hrtime.bigint() - start) / 1e6
  if (delay > 100) console.warn(`事件循环延迟 ${delay}ms`) // >100ms 异常
})
```

!!! danger "阻塞事件循环的反模式"
    - 大数组 `for` 循环做计算、`JSON.parse` 超大字符串、同步正则（灾难性回溯）。
    - `crypto` 重计算、图片/PDF 处理放主线程。
    - **解法**：移入 `worker_threads`（见 [Node 高级](nodejs-advanced.md)），或拆成异步分批。

---

## 三、内存泄漏定位

```bash
# 抓取堆快照
node --inspect app.js
# Chrome DevTools → Memory → 拍快照，对比两次找增长对象
# 或用 heapdump
npm i heapdump
process.on('SIGUSR2', () => require('heapdump').writeSnapshot())
```

常见泄漏源：

| 泄漏源 | 表现 | 修复 |
|--------|------|------|
| EventEmitter 重复 `on` 不 `off` | 监听器数涨、回调重复执行 | `once` / 销毁时 `off` |
| 全局 Map/数组缓存无限增长 | RSS 涨 | 加 TTL / LRU（如 `lru-cache`） |
| 流/文件描述符未关 | FD 耗尽、报错 EMFILE | `destroy()` / `end()` |
| 闭包持有大对象 | 老对象不回收 | 及时置 `null` 断开引用 |

!!! warning "内存泄漏坑"
    - 用 `process.memoryUsage()` 的 `heapUsed` 长期监控，设告警。RSS 只涨不落就要排查。
    - `lru-cache` 比手写 `Map` 缓存安全——自动淘汰最旧，避免缓存撑爆内存（也是 [缓存雪崩](distributed.md) 的一种）。
    - V8 老版本有堆内存上限（约 2GB/4GB），大对象处理要流式，必要时 `--max-old-space-size`。

---

## 四、CPU 瓶颈与 profiling

```bash
# 用 0x 抓 CPU profile
npm i -g 0x
0x app.js          # 按 Ctrl+C 后生成火焰图
# 或用 clinic.js
npm i -g clinic
clinic doctor -- node app.js
clinic flame -- node app.js
```

优化手段：
- 把 CPU 密集任务移到 `worker_threads` 或独立服务。
- 减少热路径对象分配（避免循环内 `{}`/`[]` 大量新建，触发频繁GC）。
- JSON 序列化用 `fast-json-stringify`（预编译 schema 快数倍）。
- 正则避免灾难性回溯（用 `re2` 或简化模式）。

!!! tip "GC 压力"
    频繁创建短命对象会触发频繁 MinorGC，间接抬升延迟。热路径里复用对象、避免大字符串拼接（`+` 改为数组 `join` 或模板）。

---

## 五、I/O 与依赖耗时

- **慢查询**：给热查询加索引（见 [数据库进阶](db-advanced.md)），避免 `SELECT *` + 全表扫描。
- **连接池**：DB/Redis 连接池大小要匹配并发，太小排队、太大会压垮 DB。
- **外部 HTTP**：给 `fetch`/`axios` 设 `timeout`，别无限等待第三方。
- **N+1 查询**：循环里查关联 → 用 `leftJoin`/批量查询（见 [Node 最佳实践](best-practices.md)）。

!!! danger "超时不设 = 连锁雪崩"
    调第三方 API 不设超时，对方慢了你的请求就一直挂着，连接池耗尽，整个服务不可用。所有出网请求**必须 timeout + 熔断**（见 [分布式与高并发](distributed.md)）。

---

## 六、压测验证优化效果

```bash
# autocannon 压测
npm i -g autocannon
autocannon -c 100 -d 30 http://localhost:3000/api/posts
# 看 RPS（每秒请求数）、延迟分布 p50/p99
```

!!! tip "压测纪律"
    - 优化前后用同一压测脚本对比，用数据说话，不靠"感觉快了"。
    - 关注 **p99 延迟** 而非平均——平均值掩盖长尾，长尾才是用户体验杀手。
    - 压测环境尽量贴近生产（数据量、连接数）。

---

## 七、性能自查清单

- [ ] 事件循环延迟有监控（>100ms 告警）
- [ ] 无同步阻塞（大循环/同步读/重计算）
- [ ] CPU 密集任务已移 `worker_threads`/独立服务
- [ ] 内存曲线平稳，无泄漏（监听器/缓存/流已治理）
- [ ] 所有出网请求有 timeout
- [ ] DB 慢查询已加索引、无 N+1
- [ ] 连接池大小匹配并发
- [ ] 压测 p99 达标，优化前后有对比数据

配合：[部署与运维·监控](deploy-ops.md)、[可观测性落地](observability.md)。
