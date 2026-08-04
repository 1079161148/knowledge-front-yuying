# 💎 前端核心面试题

> 「核心题」= 决定你技术深度的**底层原理题**。面试官用这类题区分「背八股」和「真懂」。答案依据 **[ECMA-262](https://tc39.es/ecma262/)**、**[V8 官方博客](https://v8.dev/blog)**、**[HTML Living Standard](https://html.spec.whatwg.org/)**、**[React 官方文档](https://react.dev/)**、**[Vue 源码](https://github.com/vuejs/core)**。

---

## 1. 语言引擎核心

#### Q1：JS 执行上下文与作用域链？
- 执行上下文（EC）分**全局 / 函数 / eval** 三种；创建时确立 `VO`（变量对象）、`this`、`[[Scope]]`。
- 作用域链 = 当前 EC 的 VO + 外层 `[[Scope]]`，变量查找沿链向上。
- 函数作用域在**定义时**确定（词法作用域），不是调用时。

#### Q2：V8 怎么执行 JS？（编译 vs 解释）
- 早期：解析 → **Ignition 字节码解释器**执行 → 热点代码由 **TurboFan** JIT 编译为机器码（优化 + 去优化）。
- 隐藏类（Hidden Class / Shape）：对象属性结构固定时 V8 用隐藏类加速属性访问；**动态增删属性/改类型会破坏隐藏类降速**。
- 内联缓存（IC）：缓存属性偏移，重复访问更快。

#### Q3：什么是 TDZ 的工程意义？为什么 let 不能变量提升「用」？
- `let/const` 也有提升，但进入作用域到声明前处于**暂时性死区**，访问抛 `ReferenceError`。
- 意义：避免 `var` 的「先使用后声明」歧义，让块级绑定更可预测，配合 `typeof` 也会报错提醒。

#### Q4：Symbol 和 BigInt 解决了什么？
- `Symbol`：唯一不可变原语，做对象**私有/唯一 key**，避免属性名冲突（如 `Symbol.iterator`）。
- `BigInt`：表示任意精度整数，解决 `Number` 安全整数上限 `2^53` 之外的精度丢失（如订单号/雪花 ID）。

## 2. 异步与并发核心

#### Q5：Promise 的状态机与微任务来源？
- 三态：`pending → fulfilled / rejected`，一旦落定不可变。
- `then/catch/finally` 注册的回调进**微任务队列**，故 Promise 回调总在宏任务后、渲染前执行。
- `Promise.resolve().then` 比 `setTimeout(0)` 先执行（微任务先于宏任务中的下一个）。

#### Q6：Generator 与 async/await 的关系？
- `async/await` 是 **Generator + 自动执行器（co）+ Promise** 的语法糖。
- Generator 用 `function*` + `yield` 手动暂停/恢复；async 由引擎自动驱动，更可读、更易错误冒泡。

#### Q7：requestAnimationFrame / requestIdleCallback 用途？
- `rAF`：下一帧绘制前执行，适合动画（与刷新率对齐，不丢帧）。
- `requestIdleCallback`：浏览器空闲时执行低优先级任务（如埋点、预取）；React 的并发调度即借鉴该思想。

## 3. 渲染与合成核心

#### Q8：浏览器渲染流水线（从 HTML 到像素）？
- 解析 → 样式计算 → **布局 Layout** → **绘制 Paint**（生成绘制记录）→ **合成 Composite**（分图层、生成 GPU 纹理）→ 显示。
- 合成层（GPU 层）通过 `transform/opacity/will-change` 提升，避免触发布局/绘制。

#### Q9：为什么 transform 动画比 left/top 动画快？
- `left/top` 改变触发**重排 → 重绘 → 合成**；`transform: translate` 仅触发**合成**（GPU 直接移动图层），不占主线程，更流畅。

#### Q10：Layer（图层）过多会怎样？如何优化？
- 每个合成层占 GPU 显存；过多导致**内存暴涨、合成变慢、甚至崩溃**。
- 用 DevTools → Layers 面板查看；避免滥用 `will-change`、对大量元素都提层。

## 4. 框架底层核心

#### Q11：Vue3 依赖收集与派发更新全流程？
- `reactive` 用 `Proxy` 拦截 `get`：在 `track()` 中把当前 **activeEffect** 收集进 `target.key → Set<effect>` 的 `WeakMap`。
- `set` 时 `trigger()`：从 `WeakMap` 取出 effects 执行（组件 render effect → 异步队列批量更新，去重避免重复渲染）。
- `ref` 本质 `{ value }` 的 `get/set` 包装；`computed` 是带**懒计算 + 脏标记**的派生 effect。

#### Q12：React Fiber 为什么能「可中断渲染」？
- 旧 Stack Reconciler 递归不可中断；Fiber 把 vdom 拆成**链表节点**，每个 fiber 记录 `child/sibling/return` 指针。
- 配合**时间切片（Time Slicing）**：每帧分配 5ms，超时暂停、让出主线程，空闲再 `requestIdleCallback` 续跑——实现并发渲染（Concurrent Mode）。

#### Q13：Vue 和 React 更新粒度的本质差异？
- Vue：编译期收集依赖，精确到**响应式属性**，更新只跑相关 effect。
- React：状态变更默认触发**组件函数重跑**（整棵子树 vdom diff）；用 `memo/useMemo/useCallback/Suspense` 等做人工剪枝。

## 5. 安全核心

#### Q14：XSS 三种类型与防御？
- 存储型（入库后回显）、反射型（URL 参数）、DOM 型（前端 JS 拼 DOM）。
- 防御：**不信任任何输入**；输出 HTML 转义；`innerText` 替代 `innerHTML`；CSP 白名单；`HttpOnly` cookie 防窃取；富文本用 `DOMPurify` 过滤。

#### Q15：CSRF 原理与防御？
- 借用户已登录身份，诱导其浏览器发非本意请求（如 `<img src="/api/transfer">`）。
- 防御：**SameSite cookie**（Strict/Lax 阻断跨站携带）、**CSRF Token**（请求带服务端下发的一次性 token）、**校验 Referer/Origin**、重要操作二次验证。

## 6. 下一步

- 基础看 [前端经典面试题](frontend-classic.md)、场景看 [前端高频面试题](frontend-high-freq.md)。
- 实战翻车看 [前端踩坑经验面试题](frontend-pitfalls.md)；框架深入看 [框架面试题（深化）](frontend-framework-deep.md)。
