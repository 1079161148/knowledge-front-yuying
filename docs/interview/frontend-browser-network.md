# 🌐 浏览器与网络面试题

> 前端面试「硬通货」——浏览器原理 + 计算机网络。这是大厂必问、且最能区分基础扎实度的板块。答案依据 **[MDN](https://developer.mozilla.org/zh-CN/)**、**[HTML Living Standard](https://html.spec.whatwg.org/)**、**[HTTP 官方规范](https://httpwg.org/specs/)**、**[Chrome Developers](https://developer.chrome.com/)**。

---

## 1. 浏览器原理

#### Q1：浏览器多进程架构？
- 多进程：浏览器主进程（UI/管理）、渲染进程（每个 tab 一个，隔离崩溃）、网络进程、GPU 进程、插件进程。
- 优点：一个 tab 崩溃不影响其他；安全沙箱隔离。
- 缺点：内存占用高（同站多个 tab 可复用渲染进程，site-isolation 策略）。

#### Q2：渲染进程里有哪些线程？
- **GUI 渲染线程**：布局/绘制（与 JS 互斥）。
- **JS 引擎线程**：执行 JS（单线程）。
- **事件触发 / 定时器 / 异步 HTTP** 线程：各自独立，结果入任务队列。
- 所以 JS 执行会阻塞渲染；长任务导致页面卡顿。

#### Q3：重排、重绘、合成的关系与成本？
- **重排（Layout）**：几何变化 → 触发 Layout + Paint + Composite，最贵。
- **重绘（Paint）**：外观变化（颜色等）→ Paint + Composite。
- **合成（Composite）**：`transform/opacity` 只走 Composite，最便宜（GPU）。
- 最佳实践：动画用 `transform/opacity`，避免频繁读写会触发强制同步布局的属性（`offsetTop` 等）。

#### Q4：浏览器怎么做输入 URL 的缓存查找？
- 强缓存（`Cache-Control`/`Expires`）→ 命中直接 200(from cache)。
- 未命中 → 协商缓存（`ETag`/`If-None-Match`，`Last-Modified`/`If-Modified-Since`）→ 304。
- 都没 → 重新请求。Service Worker 可在网络前拦截（离线缓存）。

## 2. HTTP / HTTPS

#### Q5：HTTP/1.1、HTTP/2、HTTP/3 的核心区别？
- **1.1**：持久连接 `keep-alive`、管线化（基本不用）、队头阻塞（同连接请求串行）。
- **2**：多路复用（一个连接并发多个流，解决队头阻塞）、头部压缩（HPACK）、服务端推送、二进制分帧。
- **3**：基于 **QUIC（UDP）**，解决 TCP 队头阻塞、0-RTT 建连、连接迁移（切 WiFi 不断线）。

#### Q6：HTTPS 握手过程（TLS 1.2 / 1.3）？
- 1.2：客户端 Hello + 服务端 Hello + 证书 + 密钥交换 → 对称密钥协商（2 RTT）。
- 1.3：精简为 1 RTT，支持 **0-RTT**（恢复连接时首批数据不等待握手，但有重放风险）。

#### Q7：Cookie 的属性与安全？
- `HttpOnly`（JS 读不到，防 XSS 窃取）、`Secure`（仅 HTTPS）、`SameSite`（Strict/Lax/None 防 CSRF）、`Path/Domain` 限定作用域、`Max-Age` 有效期。
- 第三方 cookie 被 Safari ITP / Chrome Privacy Sandbox 逐步淘汰。

#### Q8：状态码分类与常见值？
- 1xx 信息；2xx 成功（200/201/204）；3xx 重定向（301 永久/302 临时/304 协商缓存/307 保留方法）；4xx 客户端（400 参数错/401 未认证/403 禁止/404 不存在/429 限流）；5xx 服务端（500/502 网关坏/503 过载/504 超时）。

## 3. 网络安全

#### Q9：对称加密 vs 非对称加密？HTTPS 怎么组合？
- 对称：快，密钥需安全分发；非对称：慢，可公开公钥。
- HTTPS：非对称加密**协商**出对称密钥，之后用对称加密传数据（兼顾安全与性能）。

#### Q10：DNS 解析过程与优化？
- 顺序：浏览器缓存 → 系统缓存（hosts）→ 本地 DNS（递归）→ 根 → 顶级 → 权威。
- 优化：减少域名数（连接复用）、`dns-prefetch`/`preconnect`、`HTTPDNS`（移动端防劫持/提速）。

#### Q11：CDN 工作原理？
- 用户就近访问边缘节点，命中缓存直接返回；未命中回源拉取并缓存。
- 适用静态资源；动态内容可用边缘计算/路由优化。

## 4. 浏览器 API 与存储

#### Q12：localStorage / sessionStorage / cookie / IndexedDB 区别？
- cookie：请求自动带，4KB，可设 HttpOnly/SameSite。
- localStorage：持久，~5MB，同源共享。
- sessionStorage：仅当前 tab。
- IndexedDB：结构化大容量（数百 MB），异步，适合离线/PWA。

#### Q13：Service Worker 是什么？和 PWA 关系？
- 浏览器后台脚本，可拦截请求、做**离线缓存**、推送通知；是 PWA 的核心。
- 注意：作用域限制、HTTPS 才可用、`skipWaiting`/`clients.claim` 控制更新时机。

## 5. 其他高频

#### Q14：什么是队头阻塞（Head-of-Line Blocking）？
- HTTP/1.1：同一 TCP 连接请求串行，前一个慢阻塞后面。
- TCP 层：丢包后后续包即使到达也需等待重传。
- HTTP/2 解决应用层队头阻塞；HTTP/3（QUIC）解决传输层。

#### Q15：WebSocket 与 SSE 区别？
- WebSocket：全双工、需独立协议、可服务端主动推、适合聊天/游戏。
- SSE：基于 HTTP、仅服务端→客户端单向、自动重连、简单，适合通知/直播流。

## 6. 下一步

- 性能落地看 [前端性能优化面试题](frontend-performance.md)；底层原理看 [前端核心面试题](frontend-core.md)。
- 前端高频场景看 [前端高频面试题](frontend-high-freq.md)。
