# 📊 可观测性落地（日志 / 指标 / 链路追踪）

> "线上出问题能快速定位"靠的是可观测性。本篇落地三大支柱：**Logs（日志）、Metrics（指标）、Tracing（链路追踪）**，配 NestJS/Node 实战代码。资深工程师的标配能力。
>
> 依据 **[OpenTelemetry 官方](https://opentelemetry.io/)**、**[Prometheus](https://prometheus.io/)**、**[12-Factor·日志](https://12factor.net/logs)**。

---

## 一、日志（Logs）：发生了什么

**原则**：结构化（JSON）、分级、脱敏、不落 console 明文。

```ts
// 用 pino（快、结构化）
import pino from 'pino'
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })
logger.info({ userId: 'u_123', action: 'login' }, '用户登录') // 带结构化字段
```

!!! danger "日志事故三连"
    - **打明文敏感信息**（密码/token/身份证）→ 日志平台权限更松，二次泄露。用 `userId` 不 `password`。
    - **全量海量日志** → 磁盘撑满拖垮服务。重要字段采样或截断。
    - **只 console.log 无落盘** → 容器重启日志全丢，事故无法复盘。输出到 stdout，由采集器（Fluent Bit/Filebeat）收集。

**12-Factor 日志原则**：应用只往 **stdout** 写，不自己管理日志文件，收集交给基础设施。

---

## 二、指标（Metrics）：量化趋势

用 `prom-client` 暴露 QPS、延迟、错误率，接 Prometheus + Grafana。

```ts
import { collectDefaultMetrics, Registry, Histogram } from 'prom-client'
collectDefaultMetrics() // CPU/内存/事件循环默认指标
const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: '请求耗时', buckets: [0.05, 0.1, 0.3, 1, 3],
  labelNames: ['method', 'route', 'status'],
})
// 中间件记录
httpDuration.observe({ method, route, status }, durationSec)
```

```ts
// /metrics 端点给 Prometheus 拉取
app.get('/metrics', async (req, res) => res.set('Content-Type', register.contentType).send(await register.metrics()))
```

!!! tip "该监控哪些指标"
    - **RED 方法**：Rate(请求率)、Errors(错误率)、Duration(延迟 p50/p95/p99)。
    - **USE 方法**（资源）：Utilization(利用率)、Saturation(饱和度)、Errors(错误)。
    - 设告警：错误率突增、p99 超阈值、内存持续上涨触发告警，别等用户投诉。

---

## 三、链路追踪（Tracing）：一次请求跨服务怎么走

微服务下，一个请求经过多个服务，出问题要能"串起来看"。OpenTelemetry 是标准。

```ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
const sdk = new NodeSDK({ traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_URL }) })
sdk.start() // 自动给 HTTP/DB 调用打 span
```

- 每个请求有 `traceId`，跨服务通过请求头传递，所有 span 聚成一条完整调用链。
- 在 Jaeger / Tempo 里看：哪个服务慢、哪次 DB 查询拖了后腿。

!!! warning "追踪坑"
    - **traceId 要透传**：跨服务调用（HTTP/gRPC/消息）要把 `traceparent` 头带上，否则链路断成几截，追踪失效。
    - **采样率**：全量追踪成本高，生产用**采样**（如 10%~100% 按流量），关键错误 100% 采。
    - 日志也要带 `traceId`，才能从日志跳到链路、从链路跳到日志。

---

## 四、三者如何配合定位问题

```
用户报"下单慢"
  → Metrics 看 p99 延迟突增（哪个接口）
  → Tracing 看这条 trace，定位慢在"库存服务 - 扣减接口"
  → Logs 看该 traceId 的日志，发现 SQL 慢查询日志
  → 去 DB 加索引（见 数据库进阶）
```

!!! tip "排查闭环"
    - **Metrics** 告诉你"哪里有问题"（趋势/告警）。
    - **Tracing** 告诉你"问题在一次请求里卡在哪"（定位慢调用）。
    - **Logs** 告诉你"具体发生了什么"（细节）。
    - 三者靠 `traceId` 串联，缺一不可。

---

## 五、健康检查（与部署联动）

```ts
@Get('health/ready')
async ready() {
  // 查 DB/Redis 连通，挂了返回 500，K8s 摘流量
  await this.prisma.$queryRaw`SELECT 1`
  return { status: 'ok' }
}
@Get('healthz')
liveness() { return { status: 'ok' } } // 只表进程存活
```

详见 [部署与运维·健康检查](deploy-ops.md)。

---

## 六、可观测性 Checklist

- [ ] 结构化日志（pino/winston），分级 + 脱敏 + 落盘/stdout
- [ ] 指标暴露 `/metrics`（RED/USE），Grafana 看板 + 告警
- [ ] 链路追踪接入 OpenTelemetry，traceId 跨服务透传
- [ ] 日志/追踪靠 traceId 串联
- [ ] 健康检查 `/healthz` `/health/ready` 就绪探针
- [ ] 事故时能 Metrics→Tracing→Logs 闭环定位

配合：[部署与运维](deploy-ops.md)、[性能调优](performance-tuning.md)、[分布式与高并发](distributed.md)。
