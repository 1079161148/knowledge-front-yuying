# 🐳 容器化（Docker / Kubernetes / 部署最佳实践）

> Java 服务的现代化部署底座。覆盖：Docker 镜像与分层、多阶段构建、K8s 核心对象、部署清单、资源限制与健康探针、最佳实践。
> 依据 **[Docker Docs](https://docs.docker.com/)** · **[Kubernetes Docs](https://kubernetes.io/docs/)**（官方为准）。

> 📌 **适用版本 / 更新日期**：Docker 27+ / Kubernetes 1.30+；最后更新 **2026-08**。

---

## 1. Docker 镜像与分层

镜像由**只读层**叠加，层可缓存复用。Dockerfile 指令顺序影响构建缓存命中。

!!! danger "镜像体积陷阱"
    - 用 `openjdk:21` 全量镜像动辄 400MB+；生产用 **`eclipse-temurin:21-jre`** 或 **`alpine`/distroless** 基础镜像，明显瘦身。
    - 把**不变层（依赖安装）放在前、易变层（源码）放后**，充分利用缓存。

---

## 2. 多阶段构建（Java 推荐）

```dockerfile
# 阶段1：构建
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline         # 缓存依赖层
COPY src ./src
RUN mvn -q package -DskipTests

# 阶段2：运行（极小）
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseG1GC", "-jar", "app.jar"]
```

!!! tip "好处"
    - 构建工具（Maven/JDK 编译）不进最终镜像，最终只剩 JRE + jar。

---

## 3. JVM 在容器里的坑（重要）

- 老 JDK（<8u191）不识别 cgroup 限制，按宿主机内存算堆 → 被 K8s 杀掉（OOMKill）。
- **JDK 8u191+ / 11+ / 17+ 默认识别容器内存限制**。仍建议显式设 `-Xmx`：
  ```dockerfile
  ENTRYPOINT ["java","-XX:MaxRAMPercentage=75.0","-jar","app.jar"]
  ```
  `MaxRAMPercentage` 按容器 limit 的比例设堆，避免留太多给非堆导致被 kill。

!!! danger "OOMKill 高频原因"
    - 只设 `-Xmx` 不设容器 limit，或 limit 小于堆+非堆 → 超内存被 K8s 杀。约定：容器内存 limit = 堆 / 0.75。

---

## 4. Kubernetes 核心对象

| 对象 | 作用 |
|------|------|
| `Pod` | 最小调度单位（含容器） |
| `Deployment` | 管理 Pod 副本与滚动更新 |
| `Service` | 稳定访问入口（ClusterIP/NodePort/LoadBalancer） |
| `Ingress` | 七层路由（对外暴露） |
| `ConfigMap` / `Secret` | 配置 / 密钥 |
| `HPA` | 基于 CPU/指标自动扩缩容 |
| `Probe` | 存活/就绪/启动探针 |

---

## 5. 部署清单示例（关键项）

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: app
          image: registry/app:1.0.0
          resources:
            requests: { memory: "1Gi", cpu: "500m" }
            limits:   { memory: "1Gi", cpu: "1" }   # 与 -Xmx 匹配
          readinessProbe:      # 就绪：通过才接流量
            httpGet: { path: /actuator/health, port: 8080 }
            initialDelaySeconds: 20
          livenessProbe:       # 存活：失败则重启
            httpGet: { path: /actuator/health, port: 8080 }
```

!!! warning "探针坑"
    - 就绪探针探了"能启动"但不探"依赖就绪"（DB 没连上就开始接流量）→ 初期报错；探真实健康/依赖。
    - 探针路径要用轻量 `/health`，别触发重逻辑。
    - `livenessProbe` 别和 `readinessProbe` 设成相同严格条件，否则依赖抖动产生活跃重启循环。

---

## 6. 最佳实践清单

!!! tip "生产必做"
    - 镜像最小化 + 多阶段构建 + 固定 tag（禁 `latest`）。
    - 资源 `requests=limits`（保证 QoS，避免被驱逐）。
    - 配置与密钥分离（ConfigMap/Secret），不写死镜像。
    - 优雅停机：Spring Boot 开 `server.shutdown=graceful`，K8s `terminationGracePeriodSeconds` 给足，避免请求中断。
    - 日志输出到 stdout（K8s 收集），不写本地文件。
    - HPA 基于真实指标（CPU/QPS）自动扩缩。

> 下一章：[高并发与虚拟线程](high-concurrency.md)
