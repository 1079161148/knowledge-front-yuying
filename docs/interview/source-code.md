# 🔬 源码原理面试题

> Vue/React 响应式、虚拟 DOM、Fiber、Event Loop 底层、浏览器渲染。依据 **[Vue core 源码](https://github.com/vuejs/core)**、**[React reconciler 源码](https://github.com/facebook/react)**、**[ECMA-262](https://tc39.es/ecma262/)**、**[HTML 规范渲染](https://html.spec.whatwg.org/)**。覆盖大厂深度考点。

---

## 1. 响应式原理

#### Q1：Vue3 响应式是怎么追踪依赖的？
- `reactive` 用 `Proxy` 包裹对象；**读取**属性时（active effect 执行期间）由 `track()` 把当前 effect 收集进该属性对应的 `Dep`（依赖集合）。
- **写入**属性时由 `trigger()` 取出 Dep 中的 effect 重新执行。
- 依赖关系：`对象属性 → Set<effect>`。是细粒度、按需、懒代理。

#### Q2：Vue2 `Object.defineProperty` 的局限？
- 只能劫持**已存在**属性，新增/删除检测不到（需 `Vue.set`）；数组下标/`length` 变化检测不到；需递归遍历初始化，性能开销大。

#### Q3：React 为什么需要不可变数据？
- React 靠"引用是否变化"判断更新；直接改原对象引用不变，浅比较（`Object.is`）认为"没变"而不重渲染。必须用展开/Immutable 返回**新引用**。

#### Q4：Vue 的 nextTick 与 React 的批处理，本质一样吗？
- 都利用**微任务队列**把多次更新合并到一次 DOM 操作。Vue 用 `Promise.then` 等；React 18 自动批处理 state 更新。目的都是减少 DOM 操作、避免抖动。

---

## 2. 虚拟 DOM 与 Diff

#### Q5：虚拟 DOM（vdom）的作用？一定比直接操作 DOM 快吗？
- 不是"一定更快"，而是提供**声明式 + 跨平台 + 最小化真实 DOM 操作**的抽象：先在内存 Diff，再批量更新。
- 极端场景（精确操作单个节点）直接 DOM 反而更快，但工程上 vdom 的可维护性与跨平台收益更大。

#### Q6：React Diff 的核心策略？
- **同层比较**：不跨层移动节点。
- **类型不同**：直接销毁旧子树、建新子树。
- **列表**：用 `key` 复用，避免错误 diff。
- 时间复杂度从 O(n³)（树编辑距离）优化到 O(n)。

#### Q7：Vue3 Patch 与 key 的关系？
- 双端 diff + key 复用；`key` 相同则尽量复用并 patch 属性，避免重建，减少 DOM 操作。

---

## 3. Fiber 与并发

#### Q8：Fiber 是什么？解决什么问题？
- Fiber 是 React 的**可中断渲染单元**。把渲染拆成小任务，浏览器空闲时执行，被高优任务（输入/动画）打断后可恢复，避免长任务卡死主线程。

#### Q9：React 的更新流程（两阶段）？
- **Render 阶段**（可中断）：生成 Fiber 树、Diff、打标记。
- **Commit 阶段**（不可中断）：把变更一次性写入真实 DOM、执行生命周期/副作用。
- 中断只发生在 Render 阶段；Commit 必须一气呵成。

---

## 4. Event Loop 底层

#### Q10：浏览器事件循环调度顺序？
- 宏任务（一个）→ 清空所有微任务 → 渲染（如需）→ 下一个宏任务。
- 微任务：`Promise.then` / `queueMicrotask` / `MutationObserver`；宏任务：`setTimeout` / `setInterval` / I/O / UI 事件。

#### Q11：Node 事件循环与浏览器有何不同？
- Node 分多阶段：`timers` → `pending` → `poll` → `check` → `close`；微任务（Promise / `process.nextTick`）穿插在阶段之间，`nextTick` 队列**先于** Promise 微任务。

#### Q12：requestAnimationFrame 在哪个时机执行？
- 在**渲染前、每一帧**执行，适合做动画/布局读取，优于 `setTimeout` 做动画（与刷新率对齐）。

---

## 5. 浏览器渲染底层

#### Q13：浏览器渲染进程与渲染流程？
- 多进程架构：浏览器/渲染/GPU/网络/插件进程隔离。
- 渲染主线程：解析 HTML→DOM、CSS→CSSOM→渲染树→Layout→Paint→Composite（合成线程）。
- JS 阻塞解析/渲染，长任务会掉帧。

#### Q14：为什么 transform/opacity 性能好？
- 走 **合成层（compositor）**，由 GPU 线程处理，**不触发重排/重绘**，只做位移/透明度合成，最流畅。

---

## 6. 下一步

- 框架实践看 [框架面试题](framework.md)。
- JS 运行逻辑看 [JavaScript 面试题](js.md)。
- 浏览器底层看 [浏览器原理深化：网络通识](../advanced/browser-network.md)。
