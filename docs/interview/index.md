# 💼 面试与综合

> 高频真题 + 核心答案，按主题归类。答案依据 **ECMA-262 / MDN / W3C / 官方文档 / JavaGuide** 等权威来源。覆盖 **前端（经典·高频·核心·踩坑·框架·插件）** 与 **后端（Java/通用服务端 高频·经典·踩坑）** 两大板块，并与市面求职常问、大厂真题对标。

---

## 🎯 前端面试题（按方向划分）

- **[前端经典面试题](frontend-classic.md)**：逢面必问的地基八股——URL 渲染流程、HTTP/HTTPS、跨域缓存、闭包原型、BFC、Vue/React 经典原理、手写防抖/Promise.all。
- **[前端高频面试题](frontend-high-freq.md)**：近 1~2 年大厂真实高频场景题——首屏优化、重排重绘、Web Vitals、event loop 深挖、Vue/React 场景题、Vite/Tree Shaking。
- **[前端核心面试题（底层原理）](frontend-core.md)**：区分「背八股」与「真懂」的底层题——V8 执行、TDZ、Promise 微任务、渲染流水线、Fiber、Vue 依赖收集、XSS/CSRF。
- **[前端踩坑经验面试题](frontend-pitfalls.md)**：真实项目翻车复盘——prop 引用污染、闭包旧值、内存泄漏、缓存陷阱、iOS 兼容，附 STAR 答法。
- **[浏览器与网络面试题](frontend-browser-network.md)**：多进程架构、渲染流水线、HTTP/1.1→2→3、HTTPS/TLS、DNS/CDN、Cookie 安全、WebSocket/SSE。
- **[ES6+ 面试题](frontend-es6.md)**：let/const、箭头函数、解构、模块化、Promise/async、Proxy/Reflect、可选链/空值合并、BigInt、动态 import。
- **[前端性能优化面试题](frontend-performance.md)**：Web Vitals、首屏优化、Tree Shaking、长任务拆分、虚拟滚动、内存泄漏排查、监控闭环，含量化话术。
- **[框架面试题（深化）](frontend-framework-deep.md)**：Vue2/3、React、状态管理、路由、SSR/SSG/ISR、 hydration 等原理 + 大厂追问。
- **[常用插件 / 第三方库面试题](frontend-plugins.md)**：Axios、Pinia、Vue Router、Vite/Webpack、Tailwind、ECharts、Lodash、Day.js 等生态工具链。
- **[HTML / CSS 面试题](html-css.md)**：语义化、盒模型、BFC、Flex/Grid、层叠上下文、响应式。
- **[JavaScript 面试题](js.md)**：作用域、事件循环、深浅拷贝、防抖节流、原型链、继承。
- **[TypeScript 面试题](ts.md)**：类型系统、泛型、类型体操、编译时 vs 运行时。
- **[框架面试题](framework.md)**：Vue 响应式、React Hooks、Diff、更新机制对比。
- **[工程化面试题](engineering.md)**：pnpm、Vite、Webpack、缓存、构建优化、CI/CD。
- **[AI 时代面试题](ai-era.md)**：前端 + AI 的岗位变化、Copilot 协作、AI 应用架构。
- **[源码原理面试题](source-code.md)**：Vue/React 响应式、虚拟 DOM、Fiber、Event Loop 底层。
- **[面试难点与亮点](highlights.md)**：拉开差距的实战章——STAR 讲难点、6 类亮点素材、避坑与项目拆解模板。

## ☕ 后端面试题

- **[后端高频 / 经典 / 踩坑](backend-high-freq.md)**：Java 基础、JVM、并发、MySQL、Redis、Spring、分布式、场景设计，以及慢查询/Full GC/超卖等线上踩坑。
- **[Java 面试题（多章节）](backend-java.md)**：集合、并发、JVM、MySQL、Redis、Spring/MyBatis、消息队列、微服务、场景设计，按主题深挖。
- **[Node.js 面试题](backend-node.md)**：事件循环、单线程模型、Stream、Cluster、内存泄漏排查、安全、优雅关闭、框架对比。
- **[NestJS 面试题](backend-nestjs.md)**：依赖注入、模块系统、管道/守卫/拦截器/过滤器、生命周期、微服务、接口安全。
- **[Java 面试算法速览](java-algo.md)**：复杂度、数组/字符串、链表、哈希、二叉树、二分、DP、回溯、堆/栈、并查集、刷题策略（后端/AI 岗）。

---

## 高频考点速览

| 板块 | 方向 | 必背考点 |
|------|------|----------|
| 前端 | 经典 | URL 渲染、HTTPS、跨域、闭包、原型、BFC、手写题 |
| 前端 | 高频 | 首屏优化、重排重绘、Web Vitals、Event Loop、Vue/React 场景 |
| 前端 | 核心 | V8、TDZ、微任务、渲染流水线、Fiber、依赖收集、XSS/CSRF |
| 前端 | 踩坑 | 引用污染、闭包旧值、内存泄漏、缓存陷阱、iOS 兼容 |
| 前端 | 框架 | Vue3 Proxy、React Fiber、Hooks、SSR、状态管理 |
| 前端 | 插件 | Axios 拦截、Pinia、Vite 预构建、Tailwind、ECharts、Lodash |
| 前端 | 浏览器/网络 | 多进程、渲染流水线、HTTP/2/3、TLS、DNS/CDN、Cookie |
| 前端 | ES6+ | let/const、箭头函数、模块化、Promise/async、Proxy、?? |
| 前端 | 性能优化 | Web Vitals、代码分割、长任务、虚拟滚动、内存、监控 |
| 后端 | 基础 | ==/equals、String、HashMap、JVM、GC、线程池、volatile |
| 后端 | 存储 | MySQL 索引/B+树/事务、Redis 缓存三兄弟/一致性 |
| 后端 | 框架 | Spring 生命周期、循环依赖、自动配置、MyBatis |
| 后端 | 分布式 | 分布式锁、雪花、幂等、超卖、慢查询/GC 排查 |
| 后端 | Node | 事件循环、Stream、Cluster、内存泄漏、安全、优雅关闭 |
| 后端 | NestJS | DI、模块、管道/守卫/拦截器、生命周期、微服务 |

> 下一步建议：把本仓库 **部署到 GitHub Pages**（用 `mkdocs gh-deploy`）对外公开访问。
