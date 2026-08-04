# 🧩 框架面试题

> Vue 响应式、React Hooks、Diff、更新机制对比。依据 **[Vue 官方文档](https://cn.vuejs.org/)**、**[React 官方文档](https://react.dev/)**、**[Vue 响应式源码](https://github.com/vuejs/core)**。覆盖大厂高频核心题。

---

## 1. Vue 专题

#### Q1：Vue2 与 Vue3 响应式原理区别？
- Vue2：`Object.defineProperty` 劫持**已有**属性，无法检测新增/删除属性、数组下标变化，需 `Vue.set`/`Vue.delete`。
- Vue3：`Proxy` 代理整个对象，天然支持增删、数组、懒代理（用才劫持），性能与完备性更优。

#### Q2：Vue 组件间通信方式？
- `props` / `emit`（父子）、`v-model` / `defineModel`、provide/inject（跨层）、`pinia`/`vuex`（全局）、`ref` 模板引用、事件总线（已不推荐）。
- Vue3 透传：`$attrs`、多 `v-model`、`defineExpose` 暴露。

#### Q3：v-for 为什么要 key？
- Diff 以 key 标识节点身份，避免复用错误导致状态错乱；不用 key 按索引复用，增删/排序时易错。

#### Q4：computed 与 watch 区别？
- `computed`：依赖驱动、带缓存（依赖不变不重算），适合"派生值"，必须 return。
- `watch`：侦听变化执行副作用，适合"数据变了要做某事"，可深度/立即。

#### Q5：Vue3 组合式 API vs 选项式 API？
- 组合式（`setup` / `<script setup>`）：逻辑按功能聚合、复用靠 `composable`、TS 友好。
- 选项式：结构清晰但逻辑分散、复用靠 mixin（易命名冲突、来源不明）。

#### Q6：Vue 的 nextTick 原理？
- 数据变更后 DOM 异步更新；`nextTick` 把回调放进**微任务队列**（Promise.then），待 DOM 更新后执行，用于获取更新后的 DOM。

#### Q7：Vue 生命周期？
- 创建 `beforeCreate` / `created`、挂载 `beforeMount` / `mounted`、更新 `beforeUpdate` / `updated`、卸载 `beforeUnmount` / `unmounted`。Vue3 中 `destroyed` 改为 `unmounted`。

---

## 2. React 专题

#### Q1：类组件 vs 函数组件 + Hooks？
- 现在推荐函数组件 + Hooks：更简洁、逻辑复用靠自定义 Hook、无 `this` 困惑、易于测试。

#### Q2：useEffect 依赖数组的作用？
- `[]`：仅挂载执行一次；省略：每次渲染执行；有依赖：依赖变化才执行。遗漏依赖会捕获旧闭包值（用 ESLint `exhaustive-deps` 检查）。

#### Q3：useState 的更新是合并还是替换？
- 是**替换**（不像 class 的 `setState` 合并）；对象需手动 `{...state, ...}` 合并。函数式更新 `setCount(c => c+1)` 避免依赖旧值。

#### Q4：受控组件 vs 非受控组件？
- 受控：`value` 由 state 控制，单向数据流，便于校验/联动。
- 非受控：用 `ref` 读 DOM（如文件上传），少重渲染。

#### Q5：React 如何做性能优化？
- `React.memo`（props 浅比较）、`useMemo`/`useCallback`（避免重复计算/创建）、列表 `key`、`useDeferredValue`/`useTransition`（并发）、代码分割 `React.lazy`。

#### Q6：React 18 并发特性？
- `createRoot` + `startTransition` + `useDeferredValue`：把非紧急更新降级，保持输入/交互流畅，可中断渲染。

#### Q7：StrictMode 有什么用？
- 开发期故意**双调用**某些函数（如 render/useEffect），帮助暴露不纯/副作用未清理的问题，仅开发环境。

---

## 3. Vue vs React 对比

=== "Vue vs React 更新机制对比"
    ```
    Vue3：Proxy 自动精确追踪依赖 → 只更新用到该数据的组件，细粒度
    React：状态不可变 → 触发组件（及子树）reconcile → Fiber 增量比对
    ```

=== "心智模型对比"
    ```
    Vue：框架帮你追踪"谁用了这个数据"，自动更新
    React：你负责用不可变数据声明"新状态"，框架去比对哪里变了
    ```

---

## 4. 下一步

- 响应式底层看 [源码原理面试题](source-code.md)。
- 工程化构建看 [工程化面试题](engineering.md)。
