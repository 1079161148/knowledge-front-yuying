# 🧩 框架面试题（深化）

> 在 `framework.md` 基础上**深入原理 + 大厂追问 + 对比**。覆盖 Vue2/3、React、状态管理、路由、服务端渲染。答案依据 **[Vue 官方文档](https://vuejs.org/)**、**[React 官方文档](https://react.dev/)**、**[Vue Router](https://router.vuejs.org/)**、**[Redux](https://redux.js.org/)**。

---

## 1. Vue 深入

#### Q1：Vue3 相比 Vue2 的性能优化点？
- **Proxy 响应式**：懒代理、可监听新增/删除/数组索引，绕过 `Object.defineProperty` 的递归劫持。
- **编译期优化**：静态提升（hoist 静态节点）、PatchFlag（标记动态内容，diff 只比动态）、Block Tree（跳过静态子树）。
- **Tree Shaking**：Composition API 按需引入，体积更小。

#### Q2：setup / Composition API 解决了什么？
- Options API 中同一逻辑散落在 `data/methods/computed`，大组件难维护。
- Composition API 把**同一业务逻辑**聚到一个函数（`useXxx`），复用靠组合而非 mixin（mixin 易命名冲突/来源不清）。

#### Q3：Vue 的 nextTick 原理？
- 数据变更后 DOM 不是立即更新，而是**异步批量**（微任务队列）更新，避免频繁重渲染。
- `nextTick(cb)` 把回调推到「DOM 更新后」的微任务里（优先 `Promise.then`，降级 `MutationObserver`/`setTimeout`）。
- 源码见 `src/runtime-core` 的 `queueJob`。

#### Q4：Vue Router 的 hash 与 history 区别？
- **hash**：`#/path`，不刷新服务端、兼容性最好、URL 丑；不依赖服务端配置。
- **history**：`/path`，美观、需服务端**兜底到 index.html**（否则刷新 404）；依赖 `pushState`。
- 内存路由（abstract）用于 SSR/测试。

## 2. React 深入

#### Q5：类组件 vs 函数组件 + Hooks？为什么官方推 Hooks？
- 类组件 this 复杂、逻辑复用靠 HOC/render props（嵌套地狱）。
- Hooks 让函数组件有状态；复用靠自定义 Hook；但规则（`只在顶层调用`）需 lint 约束。

#### Q6：useState 是同步还是异步？批量更新？
- React 18 起**默认自动批处理**（事件、Promise、setTimeout 内都批），多次 `setState` 合并一次渲染。
- 想退出批处理用 `flushSync`。

#### Q7：useLayoutEffect 与 useEffect 区别？
- `useEffect`：**异步**（浏览器绘制后）执行，不阻塞渲染。
- `useLayoutEffect`：**同步**（DOM 变更后、绘制前）执行，适合读取布局并同步改样式（避免闪烁）；SSR 中告警。

#### Q8：React 并发特性（Concurrent）？
- `createRoot` + `startTransition` / `useDeferredValue` / `Suspense`：把低优先级更新标记为可中断，高优先级（输入）先响应，避免卡顿。

## 3. 状态管理

#### Q9：Redux 数据流？为什么要有 reducer 纯函数？
- 单向：`View → dispatch(action) → reducer(纯函数) → 新 state → 订阅更新`。
- reducer 纯函数保证**可预测、可复现、可时间旅行调试**；副作用放 `redux-thunk` / `redux-saga`。

#### Q10：Pinia 相比 Vuex 改进？
- 去 `mutations`（直接 `state.x=`）更简洁；TypeScript 推导好；无模块嵌套地狱；API 更轻。

#### Q11：什么时候用全局状态，什么时候用局部/服务端状态？
- 真正跨页共享（用户、主题、权限）才放全局。
- 服务器数据用 **React Query / SWR / VueQuery**，自带缓存/重试/失效，别全塞进 Redux/Pinia。

## 4. 渲染模式

#### Q12：SSR / SSG / CSR / ISR 区别？
- **CSR**：纯前端渲染，首屏慢、SEO 差。
- **SSR**：服务端渲染 HTML，首屏快、SEO 好，但有 TTFB/服务器压力。
- **SSG**：构建时预渲染，最快，适合静态内容。
- **ISR**：SSG + 增量再生成（按需/定时重渲染单页）。

#### Q13：SSR 中的坑（hydration 不匹配）？
- 服务端/客户端渲染结果不一致导致 hydration 失败（如 `Math.random`、Date、未同步的用户态）。
- 解法：避免在 render 用非确定性值；用 `useEffect` 处理客户端专属逻辑；`suppressHydrationWarning` 仅应急。

#### Q14：Vue 和 React 你怎么选（面试压轴）？
- 团队熟悉度、生态、招聘优先；新项目 Vue3 上手快、React 灵活性/生态更大厂常用；中后台 Vue 多、复杂应用 React 表达力强。

## 5. 下一步

- 原理深挖看 [前端核心面试题](frontend-core.md)；踩坑看 [前端踩坑经验面试题](frontend-pitfalls.md)。
- 工具链看 [常用插件 / 第三方库面试题](frontend-plugins.md)；原题汇总看 [框架面试题](framework.md)。
