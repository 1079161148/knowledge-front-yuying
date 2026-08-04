# 🔬 框架语法全对比 · 总览与原理

> 本专栏用 **「同一需求 × 三种写法（Vue2 / Vue3 / React Hooks）」** 的对照方式，从 **基础语法 → 核心语法 → 高级语法**，逐层拆解 API、注意事项、底层原理与源码实现，并配套 **「代码 + 实时预览」** 可运行 Demo 与真实业务场景。

!!! tip "怎么读最快"
    固定一个需求（如计数器 / 待办列表），用三框架各写一遍，差异一目了然。每一节都先给 **Tab 代码对比**，再给 **原理/源码补充**，最后给 **踩坑与实战**。

!!! tip "新人先读这篇"
    如果你是**第一次接触框架**，建议先读 [框架基础核心 API（新人入口）](essentials/index.md)，把 `ref`/`reactive`/`computed`/`useState`/`useEffect`、模板指令等**每个核心 API 的最小用法**吃透，再回到本篇看"响应式原理对比"——本篇默认你已经会写基本的"数据 → 视图"。

---

## 0. 三框架心智模型（先建立直觉）

| 维度 | Vue 2 | Vue 3 | React (Hooks) |
|------|-------|-------|---------------|
| 响应式核心 | `Object.defineProperty` 劫持 `data` | `Proxy` 代理整个对象 | 不可变状态 + 调度重渲染 |
| 状态位置 | `this.xxx`（Options API） | `ref` / `reactive`（Composition API） | `useState` 返回值 |
| 视图更新 | 自动（依赖收集触发） | 自动（依赖收集触发） | 手动调用 `setState` 触发 |
| 心智负担 | 低（模板即视图） | 低（模板 + 组合式） | 中（JSX 即视图，需理解调度） |
| 适合人群 | 老项目维护 | 新项目首选 | 大型应用 / 跨端 |

**一句话记忆**：Vue 帮你"自动更新视图"，React 要你"显式告诉它更新"。

---

## 1. 响应式原理（源码级拆解）

### 1.1 Vue 2：`Object.defineProperty` + 发布订阅

Vue 2 在初始化时对 `data` 的每个属性做 `Object.defineProperty`，把"读"和"写"拦截下来，分别做 **依赖收集** 与 **派发更新**。

```js
// Vue 2 源码简化版：defineReactive
function defineReactive(obj, key, val) {
  const dep = new Dep()              // 每个属性一个"依赖收集器"
  Object.defineProperty(obj, key, {
    get() {
      if (Dep.target) dep.depend()   // 当前正在求值的Watcher收集此依赖
      return val
    },
    set(newVal) {
      if (newVal === val) return
      val = newVal
      dep.notify()                   // 通知所有依赖者重新渲染
    }
  })
}
```

!!! warning "Vue 2 的根本限制（源码层面）"
    - `Object.defineProperty` **无法监听属性的新增/删除** → 必须用 `Vue.set(obj, key, val)`。
    - **无法监听数组下标/长度的变更** → 数组走的是重写过的 7 个方法（`push/pop/...`）。
    - 对深层对象要**递归遍历**每个属性，初始化成本高。

### 1.2 Vue 3：`Proxy` + `effect`

Vue 3 用 `Proxy` 代理整个对象，读写时才懒拦截，且天然支持新增/删除/数组下标。

```js
// Vue 3 源码简化版：reactive
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key)             // 收集依赖（副作用函数）
      const res = Reflect.get(target, key, receiver)
      return typeof res === 'object' && res !== null ? reactive(res) : res // 懒代理
    },
    set(target, key, value, receiver) {
      const old = target[key]
      const res = Reflect.set(target, key, value, receiver)
      if (old !== value) trigger(target, key) // 派发更新
      return res
    }
  })
}
```

- `track`：当前正在执行的 `effect`（组件渲染函数）被记录到 `target.key` 对应的依赖集。
- `trigger`：当 `key` 变化，取出依赖集并重新执行 `effect` → 组件重渲染。

### 1.3 React：不可变 + 调度（Fiber 调度）

React 没有"劫持数据"，而是 **状态不可变**：你调用 `setState`/`setCount` 产生新值，React 标记组件"需要更新"，由 **调度器（Scheduler）** 在合适时机批处理并重渲染。

```js
// React 调度简化理解（并非真实源码，用于建立心智模型）
function useState(initial) {
  const fiber = currentFiber
  const hook = fiber.memoizedState ?? { state: initial, queue: [] }
  const setState = (action) => {
    hook.queue.push(action)          // 把更新入队
    scheduleUpdate(fiber)            // 调度一次重渲染（会做批量合并）
  }
  // 渲染时按队列顺序计算最终 state
  return [hook.state, setState]
}
```

!!! info "三框架"更新通道"对比"
    - **Vue**：数据变 → 精准找到依赖该数据的组件 → 更新（细粒度，按需）。
    - **React**：状态变 → 组件函数重新执行 → 得到新虚拟 DOM → Diff → 更新真实 DOM（组件级，整体）。

---

## 2. 上手即跑：计数器（代码 + 实时预览）

下面这个 Demo **左侧是源码、右侧是实时运行效果**，点击顶部标签可在 Vue2 / Vue3 / React 之间切换对比：

<iframe src="../demos/compare-counter.html" width="100%" height="480" style="border:1px solid #2c5364;border-radius:8px"></iframe>

> 看不出差异？注意三者在"状态怎么声明、怎么修改、视图怎么绑定"上的三种不同哲学——这正是后续所有章节的基石。

---

## 3. 本专栏目录

- **响应式与状态管理**：`ref`/`reactive` vs `data` vs `useState`、`computed`/`useMemo`、深层响应、批量更新、状态管理库。
- **组件·通信·生命周期**：Props/emit、`v-model`/受控、插槽/children、`provide`/Context、生命周期对照。
- **高级模式与性能**：组合式函数 vs 自定义 Hook、虚拟 DOM Diff、Memo/`shallowRef`、列表 `key`。
- **实战场景集**：搜索过滤、表单校验、模态框、`Todo` 应用、请求缓存等真实业务，全部 Tab 对比 + 可运行 Demo。
- **JS vs TS 全方位**：类型系统、接口/泛型、Vue/React 中的 TS、迁移策略与踩坑。

---

## 4. 速查表（先存下来）

| 能力 | Vue 2 | Vue 3 | React |
|------|-------|-------|-------|
| 声明状态 | `data(){return{}}` | `ref()` / `reactive()` | `useState()` |
| 派生状态 | `computed` | `computed` | `useMemo` |
| 副作用 | `watch` / `watch` | `watch` / `watchEffect` | `useEffect` |
| 挂载完成 | `mounted` | `onMounted` | `useEffect(()=>{},[])` |
| 子传父 | `this.$emit` | `defineEmits` | `props.onXxx` |
| 双向绑定 | `v-model` | `v-model` | 受控组件 |
| 跨层传递 | `provide/inject` | `provide/inject` | `Context` |
| 复用逻辑 | `mixin` | 组合式函数 | 自定义 Hook |

下一节：[响应式与状态管理 →](reactivity/index.md)
