# 🟢 Node.js 进阶

> 工程实战：框架选型、ORM、鉴权、中间件、测试、环境、性能与部署。依据 **[Express](https://expressjs.com/)**、**[Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)**、**[12-Factor](https://12factor.net/)**。本页讲**进阶工程化**：Express/Koa、Nest 生态、数据库与 ORM、鉴权、日志、配置、测试、限流、部署。

---

## 1. Web 框架：Express / Koa

**Express（最主流、生态最大）**
```js
const express = require('express')
const app = express()
app.use(express.json())                    // 解析 JSON 请求体（中间件）
app.get('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id })
})
app.use((err, req, res, next) => {         // 错误处理中间件（4 参）
  res.status(500).json({ error: err.message })
})
app.listen(3000)
```
- **中间件模型**：`app.use` 注册，按注册顺序执行，`next()` 进入下一个；错误中间件 4 个参数。

!!! danger "Express 中间件三件套坑"
    - **忘记 `next()`**：请求永远挂起（客户端转圈）。除了真正结束响应的中间件，其余都要 `next()`。
    - **错误处理中间件参数少了**：必须是 `(err, req, res, next)` 四个参数，写成 3 个 Express 不认它是错误处理中间件，错误直接漏掉。
    - **顺序错误**：CORS / 解析 body 的中间件要放在路由之前；`express.json()` 没注册就去读 `req.body` 是 `undefined`。

**Koa（更轻、async 原生）**
```js
const Koa = require('koa')
const app = new Koa()
app.use(async (ctx, next) => {              // ctx 封装 req/res
  await next()
  ctx.body = 'hi'
})
```

---

## 2. NestJS 之外的组合：Nest 生态

- 见 [NestJS 基础/高级/进阶](nestjs-basic.md)；Nest 内置 Express（可切 Fastify），自带 DI、管道、守卫、拦截器。

---

## 3. 数据库与 ORM

**连接（以 PostgreSQL + Prisma 为例）**
```ts
// prisma/schema.prisma
model User { id Int @id @default(autoincrement()); email String @unique; posts Post[] }
// 查询
const user = await prisma.user.findUnique({ where: { email } })
```
- ORM 选型：Prisma（类型安全、迁移友好）、TypeORM（装饰器、Nest 原生友好）、Sequelize（老牌）。
- 连接池：用 `pg` / `mysql2` 的连接池避免频繁建连；`promise` 驱动 + `async/await`。

!!! warning "数据库与 ORM 实战坑"
    - **连接池耗尽**：每次请求 `new Pool` 或 `createConnection` 会撑爆 DB 连接数。连接池应全局单例，用完 `release`/`close`。
    - **N+1 查询**：循环里逐条查关联表，一次列表变几百次 SQL。用 ORM 的 `include`/`leftJoin` 预加载，或批量查询。
    - **事务忘了回滚**：多步写操作必须 `begin → commit`，出错 `rollback`，否则数据半截。
    - **`synchronize:true`（TypeORM）**：开发方便，但生产会**自动改表结构丢数据**，生产必须关掉用迁移（migration）。

**防 SQL 注入**
- 用参数化查询 / ORM，绝不字符串拼接 SQL：
```js
// ❌ 危险
db.query(`SELECT * FROM user WHERE name='${name}'`)
// ✅ 安全（参数化）
db.query('SELECT * FROM user WHERE name=$1', [name])
```

---

## 4. 鉴权与会话（配合 [安全·认证授权](../security/auth.md)）

```js
const jwt = require('jsonwebtoken')
const token = jwt.sign({ uid: 1 }, SECRET, { expiresIn: '2h' })   // 签发
const payload = jwt.verify(token, SECRET)                          // 校验
```
- 密码：`bcrypt.compare(plain, hash)`。
- 会话：HttpOnly + Secure + SameSite Cookie；JWT 短过期 + 刷新。
- 中间件统一鉴权：无效 token → 401。

!!! danger "鉴权实战红线"
    - **JWT 存 localStorage 易被 XSS 偷走**；存 HttpOnly Cookie 更安全（前端 JS 读不到）。
    - **JWT 无法主动吊销**：用户改密码/登出后旧 token 仍有效，直到过期。需要服务端维护黑名单或短过期 + refresh 轮转。
    - **401 vs 403 分清**：未登录 401，已登录但无权限 403；别把所有拒绝都返回 401。
    - **越权（IDOR）比没登录更危险**：`/api/order/:id` 必须校验"这条订单属于当前用户"，否则 A 能看 B 的订单。

---

## 5. 输入校验（管道/中间件）

```ts
// Nest 用 class-validator + ValidationPipe（见 Nest 高级）
// Express 用 zod / joi
const { z } = require('zod')
const schema = z.object({ email: z.string().email(), age: z.number().int().min(0) })
schema.parse(req.body)   // 失败抛错
```
- 永远**不信任前端输入**：后端用 zod/joi/class-validator 再校验一遍。

!!! danger "输入校验是安全最后一道门"
    - 前端校验只是体验，**后端校验才是安全**。攻击者用 curl/Postman 直接发请求，前端校验形同虚设。
    - 校验要覆盖：类型、范围、长度、格式、枚举白名单。例如 `age` 必须 `@Min(0)`，`role` 必须是白名单值，防止越权提权（传 `role:admin`）。
    - 用 `class-validator` 的 `whitelist:true` 自动剔除 DTO 外的多余字段，防"批量赋值"漏洞（如用户 POST 里塞 `isAdmin:true`）。

---

## 6. 日志与配置

```js
// 配置：用环境变量（12-Factor），dotenv 加载 .env
require('dotenv').config()
const PORT = process.env.PORT || 3000
// 日志：winston / pino（结构化 + 分级 + 脱敏）
const pino = require('pino')()
pino.info({ user: id }, 'login')   // 生产勿打明文密码/token
```
- 配置从环境变量读，不写死；日志分级 + 脱敏 + 不进入控制台明文敏感信息。

!!! warning "配置与日志的隐形事故"
    - **`.env` 入库**：把数据库密码/密钥提交到 git = 永久泄露（即使后来删了历史里还有）。`.env` 必须进 `.gitignore`。
    - **日志打明文密码/token**：日志平台可能权限更宽松，敏感信息落日志等于二次泄露。用 `pino` / `winston` 的脱敏或只打 ID。
    - **生产用开发默认值**：如开发关了鉴权 `disableAuth=true`，上线忘了改，直接裸奔。多环境用 `NODE_ENV` 严格区分。

---

## 7. 测试

- 单测：`jest` / `vitest`；HTTP 集成测试：`supertest`。
```js
const request = require('supertest')
await request(app).get('/api/users/1').expect(200)
```
- 覆盖率、mock 数据库、CI 中跑测试门禁。

---

## 8. 限流 / 防护 / 部署

```js
const rateLimit = require('express-rate-limit')
app.use('/api', rateLimit({ windowMs: 60_000, max: 100 }))   // 防爆破/刷接口
```
- HTTPS（反代终止 TLS）、`helmet` 加安全响应头、CORS 白名单、PM2/容器编排、健康检查 `/healthz`、优雅退出（`SIGTERM` 时停止接新请求、排空后再退出）。

!!! danger "上线前的防护清单"
    - **CORS 别写 `*` + Credentials**：浏览器会拒绝，且等于任何网站都能带用户 Cookie 调你接口。用明确白名单。
    - **`helmet` 必须上**：自动加 `X-Content-Type-Options`、`X-Frame-Options`、CSP 等安全头，防点击劫持/MIME 嗅探。
    - **限流别基于代理 IP**：反代后 `req.ip` 是代理地址，要配 `trust proxy` 读 `X-Forwarded-For`，否则要么误伤要么被绕过。
    - **优雅退出不可省**：K8s/Docker 发 `SIGTERM` 后若立刻杀进程，正在处理的请求直接 500。要停止接新请求、排空存量再退。

---

## 9. 性能与可观测

- 用 `perf_hooks` 测耗时；`clinic.js` 做火焰图；`prom-client` 暴露指标；链路追踪（OpenTelemetry）。
- 避免同步 API、大对象常驻、未关闭的监听/定时器（内存泄漏）。

---

## 10. 下一步

- 框架深入看 [NestJS 基础/高级/进阶](nestjs-basic.md)。
- 安全细节看 [前端安全全集](../security/index.md)。
