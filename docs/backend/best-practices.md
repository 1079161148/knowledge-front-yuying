# ✅ Node.js 最佳实践与反模式（避坑大全）

> 按 **[Node.js 最佳实践 (goldbergyoni/nodebestpractices)](https://github.com/goldbergyoni/nodebestpractices)**、**[12-Factor App](https://12factor.net/)**、**[OWASP](https://owasp.org/)** 整理。本篇把所有"能写出能跑但会出事"的反模式列出来，配正确写法，方便对照自查。适合任何层级——新手避免踩坑，老手做 Code Review 清单。

---

## 一、错误处理反模式

| ❌ 反模式 | ✅ 正确做法 |
|-----------|-----------|
| `try/catch` 包异步回调 | `async/await + try/catch` 或回调内处理 |
| 吞掉错误 `catch(e){}` | 至少记日志，重要错误向上抛 |
| 用 `uncaughtException` 当正常逻辑不退出 | 记日志后 `process.exit(1)`，由守护进程重启 |
| 抛原生 `Error` 给前端 | 抛 `HttpException`，且生产不返堆栈 |
| Promise 链不 `.catch` | 每个链尾 `catch`，或 `await` 配 `try/catch` |

!!! danger "最危险的一个"
    生产环境**未处理的 Promise 拒绝**会让程序在不可预测的时刻崩溃。统一在入口挂 `process.on('unhandledRejection')` 兜底，并配进程管理器自动重启。

---

## 二、代码与结构反模式

| ❌ 反模式 | ✅ 正确做法 |
|-----------|-----------|
| 在请求路径用 `readFileSync`/`execSync` | 全程异步非阻塞 API |
| 大文件 `readFile` 全读内存 | 用 `stream` 流式处理 |
| 业务逻辑写在 Controller | 抽到 Service 层 |
| 跨模块直接 `require` 内部文件 | 用模块 `exports`/`imports` 或 DI |
| 回调嵌套成"金字塔" | `async/await` 扁平化 |
| 全局变量存用户状态 | 状态外置（Redis/Session） |

!!! warning "阻塞事件循环是性能头号杀手"
    任何同步重活（大循环、同步读大文件、CPU 密集计算）都会让**所有并发请求**一起变慢，因为 Node 是单线程。CPU 密集任务请移步 `worker_threads` 或拆服务。

---

## 三、安全反模式（与 [前端安全全集](../security/index.md) 互补）

| ❌ 反模式 | ✅ 正确做法 |
|-----------|-----------|
| 密码 MD5/SHA 裸哈希 | `bcrypt`/`scrypt`/`argon2` 加盐慢哈希 |
| 密码/Token 存 localStorage | HttpOnly + Secure + SameSite Cookie |
| SQL 字符串拼接 | 参数化查询 / ORM |
| 前端校验代替后端校验 | 后端用 zod/class-validator 再校验 |
| CORS `*` + Credentials | 明确来源白名单 |
| `.env` 提交到 git | `.gitignore` 忽略，CI 后台配 |
| 日志打明文密码/token | 脱敏，只打 ID |
| JWT 无吊销机制 | 短过期 + refresh + 黑名单 |

!!! danger "OWASP Top 10 与后端的对应"
    - **A01 失效的访问控制（越权）**：`/api/order/:id` 必须校验归属，别只靠前端隐藏按钮。
    - **A03 注入**：SQL/命令注入，永远参数化、别拼接。
    - **A05 安全配置错误**：默认密码、暴露 `/health` 详情、调试模式上生产。
    - **A07 身份鉴别失效**：弱密码策略、JWT 无过期、会话不失效。

---

## 四、配置与依赖反模式

| ❌ 反模式 | ✅ 正确做法 |
|-----------|-----------|
| 密码写死在代码 | 环境变量 / 密钥管理（Vault） |
| 不提交 lock 文件 | 提交 `package-lock.json`/`pnpm-lock.yaml` |
| 从不 `npm audit` | 定期审计，CI 里加门禁 |
| 生产装 devDependencies | 多阶段构建，runner 只装 `production` |
| 依赖来源不明的小包 | 评估维护度/下载量，注意供应链攻击 |

!!! tip "12-Factor 配置原则"
    一份代码，多份部署。配置（端口、DB URL、密钥）必须来自环境变量，**代码里零硬编码环境相关值**。

---

## 五、测试与可观测反模式

| ❌ 反模式 | ✅ 正确做法 |
|-----------|-----------|
| 零测试 | 关键 Service 单测 + 核心接口 e2e |
| 测试直连生产库 | 独立测试库，跑完清空 |
| 无日志 / 全 `console.log` | `pino`/`winston` 分级结构化日志 |
| 无监控指标 | `prom-client` 暴露 QPS/延迟/错误率 |
| 出错无法追踪请求 | 请求加 `traceId`，日志带上下文 |

!!! tip "可观测三支柱"
    - **日志（Logs）**：发生了什么（结构化、可检索）。
    - **指标（Metrics）**：量化趋势（QPS、P99 延迟、错误率），配告警。
    - **链路追踪（Tracing）**：一次请求跨服务怎么走的（OpenTelemetry）。

---

## 六、部署反模式

| ❌ 反模式 | ✅ 正确做法 |
|-----------|-----------|
| `node app.js` 裸跑 | PM2 / Docker `restart:always` / K8s 自愈 |
| 无优雅退出 | `SIGTERM` 时停接新请求、排空再退 |
| 无健康检查 | `/healthz` `/health/ready` 给探针 |
| 镜像装全部依赖 | 多阶段构建，runner 只 production 依赖 |
| 手动改服务器文件 | CI/CD 流水线自动部署，不可变镜像 |

---

## 七、自查清单（打印贴墙）

- [ ] 所有外部输入都后端校验
- [ ] 密码加盐慢哈希、不当明文返回
- [ ] 鉴权区分 401/403，防越权（IDOR）
- [ ] CORS 白名单、已上 `helmet` 安全头
- [ ] 数据库用连接池、事务有回滚
- [ ] 大文件/大响应用流
- [ ] 请求路径无同步阻塞
- [ ] 全局异常兜底 + 进程管理器重启
- [ ] `.env` 不入库、日志脱敏
- [ ] 锁文件已提交、定期 `npm audit`
- [ ] 健康检查 + 优雅退出 + 多阶段镜像

详细的各技术点实现见 [Node.js 进阶](nodejs-pro.md) 与 [NestJS 进阶](nestjs-pro.md)。
