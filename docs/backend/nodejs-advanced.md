# 🟢 Node.js 高级

> HTTP 服务、事件循环、异步模型、进程与集群、错误处理、性能。依据 **[Node.js 官方文档](https://nodejs.org/docs/latest/api/)**。本页讲**高级 API 与机制**：http、事件循环、错误处理、cluster、child_process、worker_threads、net、dns、crypto 入门。

---

## 1. 搭建 HTTP 服务 `http`

```js
const http = require('http')
const server = http.createServer((req, res) => {
  const { method, url } = req
  if (url === '/api' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }
  res.writeHead(404); res.end('Not Found')
})
server.listen(3000, () => console.log('on 3000'))
```

| 关键 API | 说明 |
|----------|------|
| `http.createServer` | 返回 Server（本质 EventEmitter） |
| `req` (IncomingMessage) | 请求：`method` `url` `headers` `on('data')` `on('end')` |
| `res` (ServerResponse) | 响应：`writeHead` `setHeader` `write` `end` `statusCode` |
| `server.listen` | 监听端口/Unix socket |
| `req.on('data', chunk)` | 收集请求体（Buffer 流） |
| `res.setHeader` | 设响应头（须在 writeHead 前或自动合并） |

!!! warning "请求体读取"
    POST 体是流：`let body=''; req.on('data',c=>body+=c); req.on('end',()=>{JSON.parse(body)})`。生产用成熟框架（Express/Nest）自动解析。

!!! danger "手写 HTTP 服务的三个必踩坑"
    - **忘记 `res.end()`**：客户端会一直等待，连接挂起直到超时。每个分支都必须 `end`（或 `return` 后 `end`）。
    - **`setHeader` / `writeHead` 顺序**：响应头必须在 `write`/`end` 之前设置，否则报 `ERR_HTTP_HEADERS_SENT`（头已发送，不能再加）。
    - **状态码默认 200**：异常分支要显式 `writeHead(4xx/5xx)`，否则前端拿不到失败信号。生产请直接用框架（Express/Nest），别裸写 `http`。

---

## 2. 事件循环（Event Loop）

- 阶段：`timers`（setTimeout/setInterval）→ `pending` → `poll`（I/O 回调）→ `check`（setImmediate）→ `close`。
- `process.nextTick` 队列在**每个阶段之间**优先执行（先于微任务）。
- `setImmediate` 在 `check` 阶段；`setTimeout(fn,0)` 在 `timers`；同轮中顺序取决于代码位置。

```js
setTimeout(() => console.log('timeout'), 0)
setImmediate(() => console.log('immediate'))
// 主模块中顺序不确定；I/O 回调内 setImmediate 先于 setTimeout
```

!!! tip "宏任务 vs 微任务回顾（见面试/JS）"
    Promise 微任务在阶段切换（poll→check→timers 前）清空；`nextTick` 更早。

!!! danger "事件循环引发顺序错乱（面试+实战高频）"
    - `Promise.then` 是**微任务**，会在当前阶段结束后、下一阶段前**全部清空**；`process.nextTick` 比微任务还早（每个阶段之间立即执行）。
    - 后果：在 I/O 回调里同时写 `setTimeout(0)` 和 `setImmediate`，`setImmediate` 先执行；但在主模块顶层两者顺序**不确定**。
    - CPU 重活（大循环、同步计算）会卡住整个循环，所有请求都变慢——这是 Node "不适合 CPU 密集" 的根因。

---

## 3. 异步与错误处理

- 异步错误**不会**被外层 try/catch 捕获（回调已脱离调用栈），要在回调内处理或用 `async` + `await` + `try/catch`。
- `process.on('uncaughtException')` / `unhandledRejection` 做兜底日志，**之后应重启进程**（状态可能已损坏）。

```js
process.on('uncaughtException', (err) => {
  console.error('未捕获异常', err); // 记录后建议退出，由守护进程重启
})
process.on('unhandledRejection', (reason) => console.error('未处理的 Promise 拒绝', reason))
```

!!! danger "异步错误捕获的两个致命误区"
    - **误区一**：以为 `try/catch` 能抓到异步回调里的错。回调已脱离原调用栈，`try/catch` 包不住；必须用 `async/await + try/catch` 或回调内处理。
    - **误区二**：把 `uncaughtException` 当正常错误处理、不退出。官方建议：打印日志后**主动 `process.exit(1)`**，由 PM2/Docker 重启——因为异常后堆/状态可能已损坏，继续跑会出更怪的 bug。
    - 永远给 Promise 链 `.catch`，或用 `await` 配 `try/catch`，避免 `unhandledRejection` 默默吞错。

---

## 4. 多进程：`cluster` 与 `child_process`

**cluster（多核利用）**
```js
const cluster = require('cluster')
const os = require('os')
if (cluster.isPrimary) {
  os.cpus().forEach(() => cluster.fork())   // 每个核一个 worker
} else {
  require('./server')                         // worker 起服务
}
cluster.on('exit', (w) => cluster.fork())     // 崩溃自动拉起
```
- 多个 worker 共享同一端口（master 分发）；一个崩溃不影响其他。

!!! warning "cluster 的共享状态陷阱"
    - cluster 的多个 worker 是**独立进程，内存不共享**。把 Session / 登录状态存进程内存，会导致 A worker 登录、B worker 不认识（请求被轮询分发）。
    - 解决：Session 存 Redis，或粘滞会话（ip_hash）。多进程下**状态必须外置**。
    - `cluster.fork()` 数量一般等于 CPU 核数，过多反而上下文切换 overhead。

**child_process**
```js
const { exec, spawn, fork } = require('child_process')
exec('ls -la', (err, stdout) => {})          // 缓冲全部输出，有大小限制
spawn('node', ['a.js'], { stdio: 'inherit' }) // 流式，无缓冲，适合长进程
fork('./child.js')                            // 专为 Node 子进程，带 IPC 通信
```

---

## 5. 多线程 `worker_threads`

```js
const { Worker } = require('worker_threads')
const w = new Worker('./task.js')            // task.js 用 parentPort 通信
w.on('message', (m) => {})
w.postMessage('start')
```
- 用于 **CPU 密集**（计算/加密/压缩）；与 cluster 区别：worker 共享内存（`SharedArrayBuffer`），而 cluster 是独立进程。

!!! tip "cluster 还是 worker_threads？"
    - I/O 并发 → 不需要多线程，单进程事件循环就够。
    - CPU 密集（加密/压缩/图像处理）→ `worker_threads`（轻量、可共享内存）。
    - 想利用多核跑多个 HTTP 实例 → `cluster`。
    - 别在 worker 里再 `require` 重 IO 库做 HTTP 服务，职责要分清。

---

## 6. 网络底层 `net` / `dns`

```js
const net = require('net')
const socket = net.createConnection(80, 'example.com', () => socket.write('GET / HTTP/1.0\r\n\r\n'))
socket.on('data', (chunk) => {})             // TCP 原始通信（HTTP 底层）
const dns = require('dns')
dns.lookup('example.com', (e, addr) => {})   // 域名解析
```

---

## 7. 加密 `crypto`（基础）

```js
const crypto = require('crypto')
const hash = crypto.createHash('sha256').update('pwd').digest('hex')   // 哈希
const salt = crypto.randomBytes(16).toString('hex')
const pwd = crypto.scryptSync('123456', salt, 64).toString('hex')      // 密码哈希（推荐）
const token = crypto.randomBytes(32).toString('hex')                  // 随机令牌
```
- 密码绝不明文/弱哈希（MD5/SHA1）；用 `scrypt` / `bcrypt` / `argon2`。与 [安全·认证授权](../security/auth.md) 对应。

!!! danger "crypto 安全红线"
    - **绝不用 MD5/SHA1 裸哈希存密码**——秒级可彩虹表反查。必须用带盐、慢哈希：`bcrypt` / `scrypt` / `argon2`。
    - 盐要**随机且每个用户不同**（`crypto.randomBytes`），别用固定盐或用户名当盐。
    - 生成 token / sessionId 用 `crypto.randomBytes`，别用 `Math.random()`（可预测）。
    - 对称加密密钥别硬编码在代码里，走环境变量。

---

## 8. 下一步

- 工程实战看 [Node.js 进阶](nodejs-pro.md)：框架选型、ORM、鉴权、测试、部署。
- 上到框架看 [NestJS 基础](nestjs-basic.md)。
