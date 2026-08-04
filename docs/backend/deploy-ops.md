# 🚀 部署与运维实战（从代码到上线全流程）

> 代码写完只是开始，能**稳定跑在生产**才是后端工程师的基本功。本篇统筹上线全流程：容器化（Docker）→ 反代（Nginx）→ 进程管理 → CI/CD → 日志监控 → 优雅退出 → 常见事故。面向所有层级，重点在"避坑"和"为什么这么做"。
>
> 依据 **[Docker 官方文档](https://docs.docker.com/)**、**[Nginx 官方指南](https://nginx.org/en/docs/)**、**[12-Factor App](https://12factor.net/)**、**[Kubernetes 生产实践](https://kubernetes.io/docs/concepts/workloads/pods/)**。

---

## 一、为什么需要反代（Nginx）

生产环境**几乎不直接把 Node 暴露公网**，前面放 Nginx/Caddy 做：

- **TLS 终止**：HTTPS 证书在 Nginx 解密，Node 内部走 HTTP（简化）。
- **静态资源**：图片/前端包由 Nginx 直接返回，不消耗 Node。
- **负载均衡**：把流量分到多个 Node 实例（配合 cluster / 多 Pod）。
- **限流 / 防刷 / 屏蔽恶意 UA**。
- ** gzip 压缩**。

```nginx
server {
  listen 443 ssl;
  server_name api.example.com;
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

!!! warning "反代导致 IP 错乱（必踩）"
    - Node 里 `req.ip` 会变成 Nginx 的 IP。必须 `proxy_set_header X-Forwarded-For` 并在 Node 配 `app.set('trust proxy', true)`，否则限流/审计/风控全基于错误 IP。
    - 不配 `X-Forwarded-Proto` 时，Node 以为请求是 HTTP，生成绝对 URL（如邮件链接）会变成 `http://` 导致混合内容错误。

---

## 二、容器化（Docker 多阶段构建）

```dockerfile
# builder 阶段：装全部依赖并 build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# runner 阶段：只装生产依赖运行
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm prune --omit=dev
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

!!! danger "Docker 三大坑"
    - **镜像过大**：runner 阶段只装 `production` 依赖，别把 devDependencies 和源码全打进镜像。多阶段构建是标准解。
    - **`process.env.PORT` + `0.0.0.0`**：监听 `localhost` 在容器内外部访问不到；用 `0.0.0.0` 并读 `PORT`（K8s 动态分配）。
    - **无 `restart` 策略**：`docker run --restart always` 或 K8s `restartPolicy`，进程崩了自动拉起。别 `node app.js` 裸跑。

---

## 三、进程管理与优雅退出

```js
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3000)
}
const server = await bootstrap()

// 优雅退出：K8s/Docker 发 SIGTERM 先停接新请求、排空在途请求
process.on('SIGTERM', async () => {
  await app.close()           // 停止监听新连接
  server.close(() => process.exit(0))
})
```

!!! danger "不优雅退出 = 丢请求"
    - K8s 滚动发布会先发 `SIGTERM` 给旧 Pod，默认 30s 后强杀。若不处理，在途请求直接 500、用户报错。
    - 正确做法：收到信号 → 停止 `listen`（不再接新请求）→ 等活跃请求完成 → `process.exit(0)`。
    - 后台定时任务/长连接在退出前也要清理，避免孤儿进程。

---

## 四、CI/CD 流水线

典型 Git 推送即部署：

```
push → 安装依赖 → 测试 → build → 构建镜像 → 推镜像仓库 → 部署(K8s/Docker)
```

!!! tip "CI/CD 门禁"
    - **测试不过不许部署**：CI 里跑单测 + e2e，失败即阻断。
    - **`npm audit` 门禁**：高危漏洞阻止发布。
    - **不可变镜像**：每次部署用新镜像 tag（如 commit sha），回滚即切旧 tag，别改服务器文件。
    - 密钥不在仓库：数据库密码/Token 在 CI 平台 / K8s Secret 里配。

---

## 五、日志与监控

- **结构化日志**：用 `pino`/`winston` 输出 JSON，方便 ELK/Loki 检索；分级 debug/info/warn/error。
- **脱敏**：日志绝不打密码、token、身份证、银行卡。
- **指标（Metrics）**：`prom-client` 暴露 QPS、P99 延迟、错误率，接 Prometheus + Grafana 告警。
- **链路追踪**：跨服务请求用 OpenTelemetry + `traceId`，定位慢调用。
- **健康检查**：`/healthz`（进程存活）、`/health/ready`（DB/Redis 连通）给 K8s 探针。

!!! warning "日志的三个事故"
    - 日志打明文敏感信息 → 二次泄露（日志平台权限往往更松）。
    - 日志量爆炸（每个请求打全量大 JSON）→ 磁盘撑满拖垮服务。重要字段采样/截断。
    - 只 `console.log` 无落盘 → 容器重启日志全丢，线上事故无法复盘。

---

## 六、常见生产事故速查

| 现象 | 可能原因 | 排查方向 |
|------|----------|----------|
| 接口偶发 502 | 反代后端超时 / 进程崩 | Nginx `proxy_read_timeout`、看 Node 是否 OOM |
| 内存缓慢上涨 | 监听器泄漏 / 流未关 / 全局缓存 | `process.memoryUsage`、`clinic.js` |
| CPU 100% 卡死 | 同步重活 / 死循环 / 正则灾难 | worker_threads 隔离、火焰图 |
| 数据库连满 | 连接池未释放 / 每请求新建连 | 连接池单例、`release` |
| 限流误伤全员 | `trust proxy` 没配，基于代理 IP | 配 X-Forwarded-For |
| 滚动发布丢请求 | 无优雅退出 | SIGTERM 处理 |
| 缓存雪崩 | 大量 key 同过期 | 过期时间加随机抖动 |

!!! tip "事故应对原则"
    先止血（重启/回滚/扩容）→ 再定位（日志+监控+链路）→ 最后根治（改代码+加测试+加告警）。**回滚是最快止血手段**，别在事故中现场改代码。

---

## 七、上线前 Checklist

- [ ] 多阶段 Docker 镜像，runner 只 production 依赖
- [ ] `0.0.0.0` + `process.env.PORT`
- [ ] 反代配 `X-Forwarded-For` / `trust proxy`
- [ ] 已上 `helmet` 安全头、CORS 白名单
- [ ] `/healthz` `/health/ready` 探针就绪
- [ ] 优雅退出（SIGTERM）
- [ ] `restart: always` / K8s 自愈
- [ ] 结构化日志 + 脱敏 + 落盘
- [ ] 监控指标 + 告警
- [ ] CI 测试 + audit 门禁、不可变镜像

配合前面章节：[Node.js 进阶·部署防护](nodejs-pro.md)、[NestJS 进阶·部署红线](nestjs-pro.md)、[最佳实践与反模式](best-practices.md)。
