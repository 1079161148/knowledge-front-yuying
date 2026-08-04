# 🧩 微服务全家桶（注册发现 / 配置 / 网关 / 熔断 / 链路追踪）

> 从单体到微服务的工程化治理。覆盖：服务拆分原则、注册中心、配置中心、API 网关、熔断限流、链路追踪、分布式事务思路。
> 依据 **[Spring Cloud 官方](https://spring.io/projects/spring-cloud)** · **[Micrometer](https://micrometer.io/)** · **[OpenTelemetry](https://opentelemetry.io/)**（官方/官方社区为准）。注：Netflix 组件（Eureka/Hystrix）进入维护态，优先用官方现行替代。

> 📌 **适用版本 / 更新日期**：Spring Cloud 2023/2024（基于 Boot 3.x）；最后更新 **2026-08**。

---

## 1. 要不要微服务（先问清楚）

!!! danger "微服务的代价"
    - 分布式事务、网络延迟、运维复杂度、链路追踪、数据一致性全来。单体能扛住就别拆。
    - 触发条件：团队 > 10 人、模块边界清晰、需独立部署/扩缩容、技术异构需求。

---

## 2. 服务拆分原则

- **单一职责**：一个服务一个业务能力（DDD 限界上下文）。
- **数据库独享**：每服务自有库，禁止跨服务直连对方 DB（通过 API/事件）。
- **去中心化**：团队自治、技术选型自主（在治理框架内）。

---

## 3. 注册发现与配置中心

| 组件 | 角色 | 现状 |
|------|------|------|
| **Nacos**（阿里，官方社区活跃） | 注册 + 配置一体化 | 国内主流推荐 |
| Consul | 注册 + KV 配置 | HashiCorp |
| Eureka | 注册 | Netflix 维护态，新项目慎选 |
| Apollo | 配置中心 | 携程 |

```java
@SpringBootApplication
@EnableDiscoveryClient   // 注册到 Nacos/Consul
public class OrderApp { public static void main(String[] a){ SpringApplication.run(OrderApp.class,a);} }
```

!!! tip "配置治理"
    - 配置集中化 + 环境隔离 + 动态刷新（`@RefreshScope`），避免改个开关要发版。

---

## 4. API 网关（Spring Cloud Gateway）

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-svc
          uri: lb://order-service      # 服务发现负载均衡
          predicates:
            - Path=/api/order/**
          filters:
            - name: RequestRateLimiter   # 限流
              args: { redis-rate-limiter.replenishRate: 10 }
```

!!! warning "网关职责边界"
    - 做：路由、鉴权（JWT 校验）、限流、灰度、日志。不做：重业务逻辑（放业务服务）。
    - 网关是入口咽喉，要限流+熔断，避免单服务故障拖垮全站。

---

## 5. 熔断、降级、限流

| 模式 | 作用 | 实现 |
|------|------|------|
| 熔断（Circuit Breaker） | 依赖故障快速失败，防止雪崩 | Resilience4j（官方推荐，替代 Hystrix） |
| 限流 | 控制 QPS，保护自身 | 网关/Sentinel/Resilience4j |
| 降级 | 故障时返回兜底 | fallback 方法 |

```java
@CircuitBreaker(name="orderSvc", fallbackMethod="fallback")
public Order getOrder(Long id){ return orderClient.get(id); }
public Order fallback(Long id, Exception e){ return Order.EMPTY; }
```

!!! danger "雪崩防护"
    - 不熔断 -> 依赖慢调用占满线程池 -> 级联失败。务必给远程调用设超时 + 熔断 + 线程池/信号量隔离。
    - 超时时间要小于调用方等待上限（Hedging/重试需带退避与幂等）。

---

## 6. 链路追踪（可观测）

- **OpenTelemetry**：厂商中立的 Trace/Metric/Log 标准（官方社区，趋势）。
- **Micrometer**：Spring 官方指标门面，接 Prometheus。
- TraceId 透传：网关 → 服务 → DB/Redis，问题可全程回溯。

!!! tip "三件套"
    - Metrics（Prometheus）看趋势、Tracing（OTel/Jaeger）看调用链、Logging 看细节。三者关联用 TraceId。

---

## 7. 分布式事务（思路，非银弹）

- **尽量避免**：通过最终一致性（事件/消息）代替强一致。
- **Saga / TCC / 本地消息表**：长事务拆分 + 补偿。
- **Seata**（官方社区）：AT/TCC/Saga 模式框架。

!!! warning "坑"
    - 不要为所有跨服务调用上分布式事务；绝大多数场景"本地事务 + 可靠事件"足够。
    - 消息丢失/重复 → 用 [Kafka](kafka.md) 幂等 + 消费幂等处理。

> 下一章：[Kafka（消息队列）](kafka.md)
