# 🔥 前端高频面试题

> 近 1~2 年大厂（字节/阿里/腾讯/美团/拼多多）**真实出现频率最高**的场景题与原理题。相比「经典题」更偏**应用 + 原理深挖 + 场景设计**。答案依据 **[MDN](https://developer.mozilla.org/zh-CN/)**、**[V8 官方博客](https://v8.dev/blog)**、**[React 官方文档](https://react.dev/)**、**[Vue 官方文档](https://vuejs.org/)**。

---

## 1. 渲染与性能高频题

#### Q1：首屏加载慢怎么排查与优化？
- **排查**：Chrome DevTools → Network（看谁最慢）、Coverage（未使用 JS 比例）、Lighthouse（评分）、Performance（长任务）。
- **优化链路**：
  - 网络：CDN、HTTP2、开启 gzip/brotli、强缓存 + 协商缓存、预连接 `dns-prefetch`/`preconnect`。
  - 体积：路由级**代码分割**（`import()`）、Tree Shaking、拆 vendor、图片 WebP/AVIF + `loading=lazy`。
  - 渲染：SSR/流式渲染（Next.js）、骨架屏防 CLS、`defer/async` 拆主线程。
  - 指标：关注 **LCP / CLS / TBT**，用 Web Vitals 埋点监控。

#### Q2：重排（Reflow）和重绘（Repaint）区别？如何减少？
- **重排**：几何变化（尺寸/位置），成本最高；**重绘**：外观变化（颜色），不涉及布局。
- 减少：批量 DOM 操作（DocumentFragment / `requestAnimationFrame`）、用 `transform/opacity`（走合成层、不重排重绘）、`will-change` 提示、避免频繁读写 offset 触发强制同步布局。

#### Q3：Web Vitals 核心指标及优化方向？
- **LCP**（最大内容绘制，≤2.5s）：优化主资源、SSR、图片优先加载。
- **INP**（交互到下一次绘制，取代 FID，≤200ms）：拆长任务、减少主线程阻塞。
- **CLS**（累计布局偏移，≤0.1）：图片/广告预留尺寸、用 `aspect-ratio`。

## 2. JS 原理高频题

#### Q4：JS 是单线程为什么能处理异步？宏任务微任务再讲细？
- 单线程指**执行线程单**，但浏览器有**多进程/多线程**（网络、渲染、定时器各司其职），结果通过**消息队列**通知主线程。
- 见经典题 Q10：宏任务与微任务执行顺序，**微任务优先于渲染**，故连续 await 不会触发渲染（卡 UI 隐患）。

#### Q5：this 指向规则（4 条 + 箭头函数）？
- 默认（非严格 `window`、严格 `undefined`）→ 隐式（调用者）→ 显式（`call/apply/bind`）→ `new`（构造时绑定实例）。
- **箭头函数**无自身 this，取定义时外层 this（不能 bind），适合回调/定时器。

#### Q6：async/await 本质是？错误处理？
- `async` 函数返回 Promise；`await` 是 `then` 的语法糖（编译器拆成状态机/Generator 风格）。
- 错误用 `try/catch` 包 `await`；或 `await p.catch(...)` 兜底；多个独立请求要 `Promise.all` 并发而非串行 await。

#### Q7：0.1 + 0.2 !== 0.3 为什么？怎么解决？
- IEEE754 双精度浮点，二进制无法精确表示 0.1/0.2，相加有精度误差。
- 解法：转整数运算（`(0.1*10+0.2*10)/10`）、`Number.EPSILON` 比较、`toFixed` 注意四舍五入坑、用 `decimal.js` 做金额。

## 3. 框架高频场景题

#### Q8：Vue 中 key 的作用？为什么列表必须加 key？
- Diff 时以 key 作为节点**唯一标识**复用，避免原地复用导致的状态错乱（如输入框内容错位）。
- 不能用数组 index 作 key（删除中间项会错位），用稳定 id。

#### Q9：React 受控组件与非受控组件？
- 受控：value 由 state 驱动，`onChange` 同步（`value + onChange`）；数据流单一、易校验。
- 非受控：`ref` 直接读 DOM（`<input defaultValue>`）；适合文件上传、第三方集成。

#### Q10：Vue3 和 React 响应式/更新机制对比？
- Vue3：`Proxy` 自动依赖收集，细粒度更新（组件级 + 侦听器），编译时静态标记优化。
- React：不可变数据 + 调度，默认**整棵组件子树**重渲染（靠 `memo/useMemo/useCallback` 剪枝）；并发模式用 Fiber 可中断。

#### Q11：说一个你用 Hooks 踩过的坑？
- `useEffect` 依赖写不全导致闭包拿到旧值；`useState` 批量更新异步拿到旧值；自定义 Hook 状态不共享（每次调用独立）；`useCallback` 依赖变化反而更慢。

## 4. 工程化高频题

#### Q12：Vite 为什么比 Webpack 快？
- 开发态基于**原生 ESM**，按需编译（浏览器请求哪个模块编译哪个），无需全量打包；用 esbuild（Go）做依赖预构建。
- 生产态仍用 Rollup 打包（保证产物质量）。Webpack 是 Bundle 全量分析，冷启动慢。

#### Q13：Tree Shaking 原理与前提？
- 依赖 **ESM 静态结构**（import/export 可静态分析），删除未使用导出。
- 前提：用 ESM（`"sideEffects": false` 标记无副作用）、不用 `require` 动态、避免 `eval` 等阻断分析。

## 5. 浏览器/网络高频题

#### Q14：强缓存命中了但资源更新了怎么办？
- 生产发版给静态资源加 **content-hash 文件名**（如 `app.a1b2c3.js`），内容变则文件名变，HTML 永远走协商缓存拉最新。
- 或改 `Cache-Control: no-cache`（每次校验），避免用户长期拿旧包。

#### Q15：localStorage / sessionStorage / cookie 区别？
- cookie：随请求自动带（有大小 4KB 限制、可设 HttpOnly/SameSite 防 XSS/CSRF）、可跨标签页。
- localStorage：持久、同源共享、~5MB、需手动清理。
- sessionStorage：仅当前标签页生命周期。

## 6. 下一步

- 地基看 [前端经典面试题](frontend-classic.md)；底层深挖看 [前端核心面试题](frontend-core.md)。
- 实战翻车看 [前端踩坑经验面试题](frontend-pitfalls.md)；框架深入看 [框架面试题（深化）](frontend-framework-deep.md)。
