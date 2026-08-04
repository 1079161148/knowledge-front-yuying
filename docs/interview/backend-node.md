# 🟢 Node.js 面试题

> 前端转全栈 / Node 服务端岗必问。覆盖 **事件循环、单线程模型、Stream、Cluster、内存、安全、性能**。答案依据 **[Node.js 官方文档](https://nodejs.org/docs/latest/api/)**、**[Node.js Design Patterns](https://www.nodejsdesignpatterns.com/)**。

---

## 1. 运行机制

#### Q1：Node 为什么适合 IO 密集型？
- 单线程 + **事件循环** + **libuv 线程池**：主线程只处理非阻塞 IO 调度，文件/网络/DNS 等交给底层线程池，IO 完成再回调。
- 所以**高并发 IO 场景**吞吐高、资源占用低；但 CPU 密集型会阻塞事件循环。

#### Q2：Node 事件循环阶段（宏任务顺序）？
- 顺序：timers（`setTimeout/setInterval`）→ pending callbacks → **idle/prepare** → **poll**（取 IO 回调）→ **check**（`setImmediate`）→ close callbacks。
- `process.nextTick` 在**当前阶段结束后、下一阶段前**立即执行（微任务级别，优先级高于 `setImmediate`）。`Promise.then` 属微任务，在主阶段切换时清空。

#### Q3：setImmediate 与 setTimeout(0) 谁先？**
- 同层调用时顺序不定；若在外层脚本：timer 阶段早于 check，`setTimeout(0)` 先；若在 I/O 回调（poll 阶段）内：`setImmediate` 在 check 阶段（紧随 poll）先执行。

## 2. 异步与错误

#### Q4：回调地狱怎么解决？
- Promise 链式 → `async/await`；错误用 `try/catch`；统一用 `util.promisify` 包装回调 API。
- 注意 `async` 函数里未 catch 的 rejection 会变 `unhandledRejection`。

#### Q5：为什么必须处理 unhandledRejection / uncaughtException？**
- `uncaughtException` 若不打日志退出，进程处于不稳定状态（内存可能已损坏）。
- 生产：监听并**记录 + 优雅退出 + 重启**（PM2/容器自愈）；不要用它做正常流程恢复。

## 3. 模块与运行时

#### Q6：CommonJS 与 ESM 在 Node 的区别？
- CJS：`require/module.exports`，运行时加载、值拷贝、同步。
- ESM：`.mjs` 或 `package.json` 设 `"type":"module"`，静态、`import/export`、值引用、支持 Top-level await。
- 混用：可用 `import { createRequire }` 在 ESM 里 require；或 `module.exports` + 动态 `import()`。

#### Q7：Node 的 require 缓存？**
- 模块首次加载后缓存到 `require.cache`，再次 require 走缓存（同一实例）。
- 热更新/多实例场景可删 `require.cache[id]` 强制重载（谨慎，易内存泄漏）。

## 4. 数据流与性能

#### Q8：Stream（流）的作用与类型？**
- 大文件/大数据不一次性读内存，分块处理；类型：Readable / Writable / Duplex / Transform。
- 用 `pipe` 串联；背压（backpressure）自动调速，防止消费慢撑爆内存。
- 场景：文件上传、代理转发、大文件导出（见 [大文件断点续传](../practice/pc/pc-resume-upload.md)）。

#### Q9：Cluster 模式怎么做多进程？**
- `cluster` 模块 fork 多个 worker 共享端口，利用多核；master 分发连接（round-robin）。
- 进程守护用 PM2（重启、0 停机、日志聚合）。

#### Q10：怎么排查 CPU 高 / 内存泄漏？**
- CPU：`node --prof` 生成火焰图、 Clinic.js、`0x`。
- 内存：`--inspect` + Chrome DevTools Heap Snapshot；看闭包/全局变量/未清定时器。
- 注意：大对象、EventEmitter 监听器累加（用 `once` 或 `removeListener`）。

## 5. 安全与工程

#### Q11：Node 常见安全风险？**
- 依赖漏洞（供应链）：`npm audit`、锁定版本、SCA 扫描。
- 原型链污染（如 `lodash` 老版本、`merge` 用户数据）：避免深合并不可信对象。
- RCE：`eval` / `child_process` 拼接用户输入；`vm` 非沙箱不可信。
- 详见 [依赖与供应链安全](../security/supply-chain.md)。

#### Q12：Node 怎么做优雅关闭？**
- 监听 `SIGTERM/SIGINT` → 停止接收新请求 → 等待在途请求 + 关闭 DB/Redis → 退出。
- 容器化部署时这决定滚动发布是否丢请求。

#### Q13：JWT 在 Node 怎么鉴权？**
- 登录发 `accessToken`（短时效）+ `refreshToken`（存 HttpOnly cookie）；守卫校验签名；无感刷新见 [前端插件面试题](frontend-plugins.md) 的 Axios 拦截器思路。

## 6. 框架对比

#### Q14：Express / Koa / Fastify / NestJS 怎么选？**
- Express：生态最老、最稳，但偏「裸」。Koa：中间件洋葱模型、更轻。Fastify：性能极高（schema 校验+序列化快）。NestJS：企业级架构（DI/模块），适合中大型。
- 选框架看团队与规模；性能敏感网关可选 Fastify（NestJS 也可切 Fastify 适配层）。

## 7. 下一步

- NestJS 深入看 [NestJS 面试题](backend-nestjs.md)；Java 对照看 [Java 面试题](backend-java.md)。
- 后端架构看 [后端/服务端](../backend/index.md)；实战看 [NestJS 真实业务实战](../practice/backend-nest.md)。
