# 🚀 高级模式与性能优化

> 当应用变复杂，比的是"逻辑如何复用""渲染如何不浪费"。本节对比 **逻辑复用范式**、**虚拟 DOM Diff**、**性能优化手段** 与 **源码级优化原理**。

---

## 一、逻辑复用：组合式函数 vs 自定义 Hook vs Mixin

### 1.1 Vue 3：组合式函数（Composition Function）

把"状态 + 方法"抽成普通函数，在 `setup` 里调用即复用。

```js
// useCounter.js
import { ref } from 'vue'
export function useCounter(initial = 0) {
  const count = ref(initial)
  const inc = () => count.value++
  const dec = () => count.value--
  return { count, inc, dec }
}
// 使用
const { count, inc, dec } = useCounter()
```

### 1.2 React：自定义 Hook

约定 `use` 开头，内部可调用其他 Hook，返回状态/方法。

```js
// useCounter.js
import { useState } from 'react'
export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial)
  const inc = () => setCount(c => c + 1)
  const dec = () => setCount(c => c - 1)
  return { count, inc, dec }
}
// 使用
const { count, inc, dec } = useCounter()
```

### 1.3 Vue 2：mixin（不推荐）

```js
// counterMixin.js
export default {
  data() { return { count: 0 } },
  methods: { inc() { this.count++ } }
}
// 使用：mixins: [counterMixin]  → 属性来源不透明、易命名冲突
```

!!! danger "为什么 Vue 3 用组合式函数取代 mixin"
    - `mixin` 属性**来源不透明**，多个 mixin 同名属性会**静默覆盖**；
    - 组合式函数来源清晰、可传参、可命名冲突时随手改名；
    - React 的自定义 Hook 与组合式函数**思路完全一致**——都是"把可复用逻辑抽成函数"。

---

## 二、虚拟 DOM 与 Diff（原理补充）

三框架最终都用"虚拟 DOM + Diff"最小化真实 DOM 操作，但策略不同：

=== "Vue 3（编译时优化）"
    ```js
    // Vue 3 在编译模板时打"静态标记"
    // 静态节点只创建一次，动态节点精确比对
    // _hoisted / PatchFlag 让 Diff 跳过静态内容
    createElementVNode("div", null, [
      _createVNode(_component_Child, { count: count }, null, 8 /* PROPS */)
    ])
    ```

=== "React（运行时 Diff）"
    ```js
    // React 在运行时做"同层比较 + key 复用"
    // 没有编译期静态分析，全靠 Fiber 协调阶段的启发式算法
    function reconcileChildren(fiber, elements) { /* ... */ }
    ```

!!! info "关键差异"
    - **Vue 3**：编译期就知道哪些节点是动态的（`PatchFlag`），Diff 时**只比动态部分**，性能更优。
    - **React**：运行时全量比对 + `key` 复用，灵活但对大型列表更吃算力。
    - **Vue 2**：无编译期优化，全量 Diff，性能弱于 Vue 3。

---

## 三、性能优化手段对照

| 优化点 | Vue 2 | Vue 3 | React |
|--------|-------|-------|-------|
| 跳过深层代理 | — | `shallowRef` / `shallowReactive` | — |
| 计算缓存 | `computed` | `computed` | `useMemo` |
| 组件缓存 | `<keep-alive>` | `<KeepAlive>` | `React.memo` + `useMemo` |
| 列表稳定 | `:key` | `:key` | `key` |
| 事件稳定 | 模板自动 | 模板自动 | `useCallback` |
| 大列表 | 分页 / 虚拟滚动 | 虚拟滚动 | 虚拟滚动（`react-window`） |

### 3.1 React：`React.memo` / `useMemo` / `useCallback` 三件套

```jsx
const Child = React.memo(function Child({ user, onSelect }) {
  return <li onClick={() => onSelect(user.id)}>{user.name}</li>
})
function List({ users }) {
  const onSelect = useCallback(id => api.select(id), [])
  const rendered = useMemo(
    () => users.map(u => <Child key={u.id} user={u} onSelect={onSelect} />),
    [users, onSelect]
  )
  return <ul>{rendered}</ul>
}
```

### 3.2 Vue 3：精准依赖天然高效 + 大对象用 `shallowRef`

```js
import { shallowRef } from 'vue'
// 只追踪 .value 替换，不递归代理内部（适合大表格/大 JSON）
const table = shallowRef({ rows: [...] })
function refresh() { table.value = loadNewRows() } // 整体替换才触发
```

!!! warning "React 优化反模式"
    - **不要无脑包 `React.memo`**：props 含内联对象/函数时，memo 永远失效（引用每次都变）。先稳定引用（`useMemo`/`useCallback`）。
    - **`useMemo` 不是语义保证**：它只是性能提示，React 可能重算；不要拿它做"业务必须缓存"的逻辑。

---

## 四、源码补充：Vue 3 的 `effect` 调度（异步批量）

Vue 3 的更新是**异步队列 + 去重**的，避免同一事件里多次改状态导致多次渲染：

```js
// Vue 3 scheduler 简化模型
let queue = new Set()
let flushing = false
function queueJob(job) {
  queue.add(job)
  if (!flushing) { flushing = true; Promise.resolve().then(flushJobs) }
}
function flushJobs() {
  queue.forEach(job => job())  // 同一 tick 内多次修改，组件只渲染一次
  queue.clear(); flushing = false
}
```

> 这与 React 18 的 **Automatic Batching** 异曲同工：都追求"一个事件 → 一次渲染"。

---

## 五、真实业务场景

!!! question "场景：请求数据 + 加载态 + 错误态（逻辑复用）"
    - Vue：抽 `useFetch(url)` 组合式函数，返回 `{ data, loading, error }`。
    - React：抽 `useFetch(url)` 自定义 Hook，返回同样结构。
    - 两者组件内用法**几乎一模一样**，再次印证"组合式函数 ≈ 自定义 Hook"。

!!! question "场景：超长列表（万级数据）"
    - 三框架都**不该一次性渲染**，用虚拟滚动（只渲染视口内的若干项）。
    - Vue：`vue-virtual-scroller`；React：`react-window` / `react-virtuoso`。

!!! danger "踩坑清单"
    - **Vue3**：在 `setup` 里写 `await` 要用 `<script setup>` 的顶层 `await` + `Suspense`，否则报错。
    - **React**：`useEffect` 依赖数组漏写 → 闭包拿到旧值（stale closure）；用 ESLint `exhaustive-deps` 校验。
    - **通用**：大对象频繁更新用浅响应/不可变结构，避免无谓的深对比。

---

[← 上一节：组件·通信·生命周期](../components/index.md)  ·  [下一节：实战场景集 →](../scenarios/index.md)
