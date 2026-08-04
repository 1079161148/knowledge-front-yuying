# 仓库管理（状态管理）三框架对比

> 本章对比 **Vue 3（Pinia / Vuex 4）/ Vue 2（Vuex 3）/ React（内置 Hooks + Redux Toolkit / Zustand）** 的状态管理方案。每个框架按 **安装 → 基础 → 进阶 → 高级 → 注意事项 → 使用场景 → 踩坑点 → 原理与源码实现** 展开，API 均依据对应官方文档（Vue 3 最新、Vue 2 末版 2.7、React 最新 19）。

---

## 版本与框架对应关系

!!! important "版本速查表：Vue / Vuex / Pinia 版本对应"
    | Vue 版本 | 状态管理库 | 库版本 | 创建方式 | API 风格 | 是否官方推荐 |
    |---------|----------|--------|---------|---------|------------|
    | **Vue 3.x** | **Pinia** | **v2.x** | `createPinia()` | Options Store / Setup Store | **是（首推）** |
    | **Vue 3.x** | Vuex | **v4.x** | `createStore()` | 与 Vuex 3 几乎一致 | 否（维护模式） |
    | **Vue 2.x** | Vuex | **v3.x** | `new Vuex.Store()` | `state`/`getters`/`mutations`/`actions` + `mapXxx` | 是（唯一选择） |
    | **Vue 2.7+** | Pinia | **v2.x** | `createPinia()` + `@vue/composition-api` | 同 Vue 3 Pinia | 兼容但非主力 |
    | **React 18/19** | Redux Toolkit | **v2.x** | `configureStore()` | `createSlice` + `useSelector`/`useDispatch` | Redux 团队推荐 |
    | **React 18/19** | Zustand | **v4/v5** | `create()` | `useStore(selector)` | 社区热门 |
    | **React 18/19** | 内置 | — | `useState`/`useReducer`/`Context` | Hooks | 轻量场景首选 |

!!! warning "关键结论：Vuex 版本严格绑定 Vue 版本"
    - **Vue 2** → 只能安装 `vuex@3`（`npm i vuex@3`），Vuex 4 不兼容 Vue 2。
    - **Vue 3** → 官方首推 Pinia，但仍可安装 `vuex@4`（`npm i vuex@4`）作为过渡方案。
    - **Vuex 3 和 Vuex 4** API 几乎一致（仅创建方式不同：`new Vuex.Store()` vs `createStore()`）。
    - **Pinia 不是 Vuex 的主版本升级**，是全新设计的独立库，Vuex 3/4 项目不能直接"升级"到 Pinia。

---

## Pinia vs Vuex：核心差异一览

> 本节列出 **Pinia（Vue 3 首推）vs Vuex 3/4** 的 API 差别，方便对比与迁移。

| 功能 | Vuex 3（Vue 2）/ Vuex 4（Vue 3） | Pinia（Vue 3） | 说明 |
|------|----------------------------------|---------------|------|
| **安装方式** | `npm i vuex@3`（Vue 2） / `npm i vuex@4`（Vue 3） | `npm i pinia` | Pinia 不区隔 Vue 版本 |
| **创建实例** | `new Vuex.Store({…})`（v3）/ `createStore({…})`（v4） | `createPinia()` | Pinia 只创建一个容器，store 通过 `defineStore` 定义 |
| **注册到 Vue** | `Vue.use(Vuex)` → `new Vue({store})`（v3）/ `app.use(store)`（v4） | `app.use(createPinia())` | — |
| **定义 store** | 单一巨型 store 对象或拆分为 `modules` | 多个 `defineStore`，每个是独立函数 | Pinia 天然模块化，无需 `namespaced` |
| **状态 (state)** | `state: { count: 0 }`（直接返回对象） | `state: () => ({ count: 0 })`（必须返回函数，类似 `data`） | Pinia 的 `state` 必须是工厂函数 |
| **派生 (getters)** | `getters: { double: s => s.count * 2 }`（接收 `state`，可选 `getters`） | `getters: { double: s => s.count * 2 }`（签名一致，多 `this` 访问其他 getter） | 用法几乎相同 |
| **修改状态 (mutation)** | **必须通过 `commit('mutation')`**，mutation 必须同步 | **无 mutation 概念**，直接 `store.count++` 或在 `actions` 中改 | Pinia 去掉了 mutation 限制，心智负担大幅降低 |
| **异步操作 (action)** | `actions: { async fetch({ commit }) { commit('set') } }` | `actions: { async fetch() { this.data = … } }` | Pinia 的 action 可以直接改状态（`this.xxx = …`），无需 commit |
| **在组件中使用** | `this.$store.state.xxx` / `mapState(['x'])` / `mapActions(['y'])` | `const store = useXxxStore(); store.count` / `storeToRefs(store)` | Pinia 不需要 `mapXxx` 辅助函数 |
| **解构响应式** | `mapState` 自动保持响应式 | 直接用 `storeToRefs(store)` 保持响应式 | `const { count } = store` 会丢失响应式！ |
| **模块化** | `modules: { user: { namespaced: true, … } }`，通过 `mapState('user', […])` 访问 | 每个 `defineStore` 天然隔离开，store 之间可直接 `useOtherStore()` | Pinia 彻底消除"命名空间"问题 |
| **TypeScript** | 类型支持弱，需额外声明 | 原生完善，无需额外类型定义 | Pinia 从设计之初就考虑 TS |
| **DevTools** | 需 `Vue DevTools` + 配置 | 原生支持，按 store id 分面板 | — |
| **动态模块** | `store.registerModule('name', module)` | 无，所有 store 在调用时懒加载，天然按需 | Pinia 不需要手动注册模块 |
| **插件/中间件** | `plugins: [fn]`，`store.subscribe((mutation, state) => {})` | `pinia.use(fn)`，`store.$subscribe((mutation, state) => {})` | Pinia 另有 `$onAction` 订阅 action 执行 |
| **SSR 支持** | 手动为每个请求创建 store 实例 | 一等支持（`createPinia()` + `runWithContext`），Nuxt 内置 | — |
| **组合式 API（Setup Store）** | 不支持 | 支持：`defineStore('id', () => { const x = ref(0); return { x } })` | Pinia 可以像写 composable 一样写 store |

---

## 一、Vue 3 · Pinia（官方推荐）

### 0. 安装与启动

```bash
npm install pinia
```

```js
// main.js / main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.mount('#app')
```

```js
// stores/counter.js —— 每个 store 一个文件
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, name: 'Eduardo' }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++ // 直接 this.xxx 修改，不需要 mutation
    },
  },
})
```

!!! info "Vue 3 也支持 Vuex 4（过渡方案）"
    如果你从 Vue 2 + Vuex 3 迁移到 Vue 3，可以先用 `npm i vuex@4` 过渡（API 几乎不变），再逐步迁移到 Pinia。
    ```bash
    npm install vuex@4
    ```
    ```js
    import { createStore } from 'vuex'
    const store = createStore({
      state: { count: 0 },
      mutations: { increment(s) { s.count++ } },
      actions: { async inc({ commit }) { commit('increment') } },
    })
    app.use(store)
    ```

### 1.1 基础用法

安装后通过 `app.use(createPinia())` 启用；用 `defineStore` 定义 store，返回的函数约定以 `use…Store` 命名。

!!! example "定义 store（两种写法）"
    === "Options 写法（推荐入门）"
        ```js
        import { defineStore } from 'pinia'
        export const useCounterStore = defineStore('counter', {
          state: () => ({ count: 0, name: 'Eduardo' }),
          getters: {
            doubleCount: (state) => state.count * 2,
          },
          actions: {
            increment() { this.count++ },
          },
        })
        ```
    === "Setup 写法（更接近 Composition API）"
        ```js
        import { ref, computed } from 'vue'
        import { defineStore } from 'pinia'
        export const useCounterStore = defineStore('counter', () => {
          const count = ref(0)
          const name = ref('Eduardo')
          const doubleCount = computed(() => count.value * 2)
          function increment() { count.value++ }
          return { count, name, doubleCount, increment } // 必须 return 出去
        })
        ```

在组件中使用：

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'
const store = useCounterStore()
// state / getter 用 storeToRefs 解构以保持响应式
const { count, doubleCount } = storeToRefs(store)
// action 可直接解构（已自动绑定 store）
const { increment } = store
</script>
```

- `state` 是**函数**（返回初始对象），`getters` 是计算属性，`actions` 内通过 `this` 改状态。
- store 本身是一个 **reactive 对象**，直接 `store.count++` 即可改状态（Pinia 不强调 mutation 概念）。

### 1.2 进阶用法

- **批量改状态**：`store.$patch({ count: store.count + 1 })` 或 `store.$patch((s) => { s.count++ })`。
- **订阅状态变化**：`store.$subscribe((mutation, state) => {…})`，适合做持久化。
- **订阅 action**：`store.$onAction(({ name, after, onError }) => {…})`。
- **store 互相调用**：在一个 store 的 action 里直接 `useOtherStore()` 即可（Pinia 会处理初始化顺序）。
- **插件**：`pinia.use(myPiniaPlugin)` 给所有 store 扩展（如持久化、devtools 标注）。
- **devtools**：Pinia 原生支持 Vue DevTools，每个 store 按 `id` 分组。

!!! example "持久化插件（官方示例写法）"
    ```js
    export function persistPlugin({ store }) {
      const saved = localStorage.getItem(store.$id)
      if (saved) store.$patch(JSON.parse(saved))
      store.$subscribe((_, state) => {
        localStorage.setItem(store.$id, JSON.stringify(state))
      })
    }
    // pinia.use(persistPlugin)
    ```

### 1.3 高级用法

- **SSR（Nuxt）**：Pinia 对 SSR 一等支持，需在服务端为每个请求新建 `pinia` 实例并通过 `app.runWithContext` 注入，避免跨请求状态污染。
- **测试**：官方 `@pinia/testing` 提供 `createTestingPinia({ stubActions: true })` 做单测打桩。
- **HMR**：开发时用 `import.meta.hot` 热更新 store 定义（官方有示例）。
- **跨 store 组合**：在 Setup store 里组合多个 store 与 composables（如 `useRoute`、`useTheme`），实现逻辑复用。

### 1.4 注意事项

1. **不要**从 Setup store `return` 外部注入对象（如 `route`），否则 Pinia 会把它当成状态，影响 SSR/devtools。
2. **解构会丢失响应式**：直接 `const { count } = store` 拿到的不是响应式的，必须用 `storeToRefs`。
3. store 是**单例**（按 `id` 缓存），首次调用 `useXxxStore()` 才真正实例化。

### 1.5 使用场景

- 跨多个组件共享的全局状态（用户信息、UI 主题、购物车）。
- 需要 devtools 时间旅行调试、状态快照的复杂应用。
- 服务端数据缓存（配合 `$subscribe` 持久化）。

### 1.6 踩坑点

- 在 Setup store 里**忘记 `return`** 某个 `ref`/`computed` → 该状态不纳入 Pinia 管理，SSR/devtools 异常。
- 把异步请求写在 getter 里（getter 必须是纯同步计算）。
- 在 `action` 之外直接改 state 本身没问题（Pinia 不像 Vuex 有严格模式），但多人协作时建议统一走 action 以便追踪。

### 1.7 原理与源码实现

- Pinia **没有独立的响应式系统**，直接建立在 Vue 的 `reactive()/ref()` 之上：store 内部状态就是一个 `reactive` 对象；`getters` 用 `computed`；`$subscribe` 用 `watch`。
- `defineStore(id, …)` 返回一个工厂函数，内部用 `Map` 按 `id` 缓存已创建的 store 实例（单例）。
- `action` 被包了一层，调用时会先触发 `$onAction` 订阅器再执行真实逻辑——这也是为什么 Pinia 能天然支持 action 订阅与 devtools。
- 对比 Vuex：去掉了「mutation 必须同步」的限制，state 变更统一走 action（或直接改），降低了心智负担。

---

## 二、Vue 2 · Vuex 3（生态事实标准）

> 适用版本：Vue 2.7 末版，搭配 **Vuex 3**（最新小版本 3.6.x）。Vuex 4 API 与 3 基本一致，但只兼容 Vue 3。

### 0. 安装与启动

```bash
npm install vuex@3
```

```js
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production', // 严格模式：仅开发期开启
  state: {
    count: 0,
    user: null,
  },
  getters: {
    double: (state) => state.count * 2,
    triple: (state, getters) => state.count * 3,  // getters 第二个参数可访问其他 getter
  },
  mutations: {
    // mutation 必须同步
    increment(state, payload = 1) { state.count += payload },
    setUser(state, user) { state.user = user },
  },
  actions: {
    // action 可以异步，但不能直接改 state，必须 commit mutation
    async incrementAsync({ commit }, payload) {
      await new Promise(r => setTimeout(r, 1000))
      commit('increment', payload)
    },
    async fetchUser({ commit }) {
      const res = await fetch('/api/user')
      commit('setUser', await res.json())
    },
  },
  modules: {}, // 模块配置见进阶用法
})

export default store
```

```js
// main.js —— 将 store 注入 Vue 根实例
import Vue from 'vue'
import store from './store'
import App from './App.vue'

new Vue({
  store,             // 注入后所有组件可通过 this.$store 访问
  render: h => h(App),
}).$mount('#app')
```

!!! info "Vuex 严格模式 `strict`"
    开启 `strict: true` 后，任何在 mutation 之外修改 state 的操作都会抛出错误。
    **必须仅在开发环境开启**，否则生产环境下深度 watch 会严重影响性能。
    标准写法：`strict: process.env.NODE_ENV !== 'production'`

!!! info "Vue 2.7 可以使用 Pinia 吗？"
    可以，但需要安装 `@vue/composition-api`。这是过渡方案，官方推荐 Vue 2 项目继续使用 Vuex 3，待迁移 Vue 3 后再切 Pinia。
    ```bash
    npm install pinia @vue/composition-api
    ```

### 2.1 基础用法

组件中使用：

```js
// 计算属性映射状态/派生
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
export default {
  computed: { ...mapState(['count']), ...mapGetters(['double']) },
  methods: { ...mapMutations(['increment']), ...mapActions(['incrementAsync']) },
  // 也可直接 this.$store.state / this.$store.dispatch('incrementAsync', 1)
}
```

- **唯一改状态途径是 mutation**（`commit`），且 mutation **必须同步**。
- **异步逻辑放在 action**（`dispatch`），action 内部再 `commit` mutation。

### 2.2 进阶用法

- **模块化**：`modules: { user: { namespaced: true, state, getters, mutations, actions } }`；开启命名空间后用 `mapXxx('user', […])` 或 `dispatch('user/login')`。
- **根状态访问**：模块内 getter/action 可拿到 `rootState`、`rootGetters`。
- **严格模式**：`strict: true` —— 任何在 mutation 之外修改 state 都会抛错（生产环境务必关闭以保性能）。
- **插件**：`plugins: [myPlugin]`，插件接收 `store` 并通过 `store.subscribe((mutation, state) => {…})` 监听 mutation（典型用途：持久化、日志）。

### 2.3 高级用法

- **动态模块**：`store.registerModule('admin', adminModule)` / `store.unregisterModule('admin')`，适合按需加载权限模块。
- **SSR**：在服务端用 `store.subscribe` 收集 state，注入到客户端做 hydration。
- **插件范式**：`const myPlugin = (store) => { store.subscribe((m, s) => {…}) }`。

### 2.4 注意事项

1. **mutation 必须同步**，否则 devtools 时间线错乱、状态不可追踪。
2. **严格模式仅开发期开启**（`strict: process.env.NODE_ENV !== 'production'`）。
3. 命名空间模块里提交根 mutation/action 需 `commit('increment', payload, { root: true })`。

### 2.5 使用场景

- Vue 2 中大型单页应用的集中式状态管理。
- 需要严格状态变更追踪、时间旅行调试（配合 mutation 同步约束）。

### 2.6 踩坑点

- **在非严格模式下绕过 mutation 直接 `state.x = …`**：不会报错，但 devtools 追踪不到，后期难以排查。
- **mapXxx 必须放在 `computed`/`methods` 中**，放到 `data` 里会失效。
- getter 返回**新对象/数组**每次调用都新建引用，可能引发不必要的重渲染（用 `memoize` 或缓存）。
- 滥用单一巨型 store，导致任意改动触发大量组件更新（应按业务拆 module）。

### 2.7 原理与源码实现

- Vuex 维护一棵**单一状态树** `state`，并通过 `new Vue({ data: { $$state } })`（内部 `Vue.observable`）把 state 变成响应式对象。
- `commit(mutation)` 调用对应 handler 同步改 state；`dispatch(action)` 调用 handler 并返回 Promise，handler 内再 `commit`。
- `subscribe` 在每次 mutation 提交后触发，是 devtools 与插件的钩子来源。
- 模块在注册时会被「命名空间 + 局部 state」包裹，getter/action 默认拿到局部状态，需显式声明根访问。

---

## 三、React · 状态管理（内置 + 生态）

> 适用版本：**React 19（最新）**。React 官方主张「先用内置 `useState/useReducer/Context`，遇到真正跨应用共享再引入库」。

### 0. 安装与启动

React 内置状态管理**无需额外安装**，开箱即用：

```jsx
// 内置：useState / useReducer / Context —— 无需安装
import { useState, useReducer, createContext, useContext } from 'react'
```

如需引入外部状态管理库：

```bash
# Redux Toolkit（Redux 官方推荐）
npm install @reduxjs/toolkit react-redux

# Zustand（轻量，社区热门）
npm install zustand

# TanStack Query（服务端状态管理）
npm install @tanstack/react-query
```

```jsx
// main.jsx —— Redux Toolkit 注入示例
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './store'

const store = configureStore({ reducer: rootReducer })

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
```

!!! tip "React 状态管理分层建议"
    | 层级 | 方案 | 适用场景 |
    |------|------|---------|
    | 组件内部局部状态 | `useState` / `useReducer` | 表单输入、开关、计数器等 |
    | 跨组件共享（低频变更） | `Context` + `useReducer` | 主题、语言、认证信息 |
    | 全局复杂状态 | Redux Toolkit / Zustand | 购物车、多模块联动 |
    | 服务端数据缓存 | RTK Query / TanStack Query | 接口请求、缓存、轮询 |

### 3.1 基础用法（内置）

!!! example "useState / useReducer / Context"
    ```jsx
    // 局部状态
    const [count, setCount] = useState(0)

    // 复杂状态逻辑用 reducer
    const [state, dispatch] = useReducer(reducer, { count: 0 })
    dispatch({ type: 'increment' }) // reducer(state, action) 必须是纯函数

    // 跨组件共享
    const Ctx = createContext(defaultValue)
    <Ctx.Provider value={state}><Child /></Ctx.Provider>
    const value = useContext(Ctx) // 消费
    ```

- `useState` 的更新函数支持「函数式更新」`setCount(c => c + 1)`，避免闭包拿到旧值。
- `useReducer` 适合「同一 state 有多种操作、且相互关联」的场景。
- `Context` 用于跨层级传递，避免 prop drilling。

### 3.2 进阶用法

- **拆分 Context**：把「频繁变化」与「很少变化」的 value 拆成多个 Provider，避免一个 value 变动导致所有消费者重渲染。
- **`useSyncExternalStore`**（React 18+ 官方 API）：让组件订阅**外部可变 store**（如 Zustand / Redux 原生订阅），保证并发渲染下不读到不一致快照。
- **Redux Toolkit（Redux 官方推荐写法）**：

!!! example "Redux Toolkit 基础"
    ```js
    import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
    import { useSelector, useDispatch } from 'react-redux'

    const counter = createSlice({
      name: 'counter',
      initialState: { value: 0 },
      reducers: { inc: (s) => { s.value++ } }, // 借助 Immer 可直接「修改」草稿
    })
    const store = configureStore({ reducer: { counter: counter.reducer } })
    // 组件中：
    const value = useSelector((s) => s.counter.value)
    const dispatch = useDispatch()
    dispatch(counter.actions.inc())
    ```
- **`useMemo` / `useCallback`**：缓存计算结果与函数引用，配合 `React.memo` 减少不必要重渲染（注意依赖数组正确）。

### 3.3 高级用法

- **RTK Query / TanStack Query**：集中管理服务端数据获取、缓存、失效、轮询（React 生态做「服务端状态」的主流，和「客户端状态」分开管理）。
- **Zustand**：极简外部 store，`create((set) => ({ count: 0, inc: () => set(s => ({ count: s.count + 1 })) }))`，组件用 `useStore(s => s.count)` 订阅，内部正是基于 `useSyncExternalStore`。
- **并发特性（React 18/19）**：`useTransition`（把非紧急更新标记为过渡，保持输入响应）、`useDeferredValue`（延后某值）。
- **中间件 / store enhancer**：Redux 的 `redux-thunk`（RTK 已内置）、`redux-saga`；RTK 的 `createListenerMiddleware` 替代 sagas 写法。

### 3.4 注意事项

1. `useState`/`useReducer` 的 reducer/更新函数必须是**纯函数**，不能在其中发请求或改外部变量。
2. **Context 不是为「高频更新」设计的**：value 一变，所有 `useContext` 消费者都重渲染，宜拆分或换外部 store。
3. `useSelector` 返回对象/数组时要保证引用稳定（用 `shallow` 比较或返回原始值），否则会无限渲染。
4. 不要「过度状态化」：能算出来的就别存（派生状态用 `useMemo`）。

### 3.5 使用场景

- 组件内部 / 父子：`useState`、`useReducer`。
- 跨多层共享、且不常变：Context。
- 全局复杂状态、需要中间件/DevTools/时间旅行：Redux Toolkit。
- 轻量全局 store、不想引 Redux 模板代码：Zustand。
- 服务端数据缓存：RTK Query / TanStack Query。

### 3.6 踩坑点

- **陈旧闭包**：在 `setTimeout`/`useEffect` 里直接读 `count` 拿到旧值 → 用函数式更新 `setCount(c => c+1)`。
- **渲染期间调用 setState**：导致额外渲染或死循环 → 用 `useEffect` 处理副作用。
- **Effect 依赖是对象/数组字面量**：每次渲染都是新引用 → 提取依赖或用 `useMemo`。
- **Zustand 选择器返回新对象** `useStore(s => ({ a: s.a, b: s.b }))` → 每次渲染新引用触发重渲染，需 `useShallow`。
- **把整个 store 通过单个 Context 下传**：任何字段变化全树重渲染。

### 3.7 原理与源码实现

- **Hooks 链表**：每个函数组件在内部维护一条 memoized state 链表；`useState/useReducer` 按**调用顺序**对应链表中对应节点。这就是为什么「Hooks 不能在条件/循环里调用」——顺序一变，状态错位。
- **`useReducer`**：与 `useState` 同机制，只是更新逻辑走 `reducer(state, action)` 纯函数。
- **`Context`**：Provider 把 `value` 存入 context 对象；消费组件订阅该 context，当 `value` 引用变化（用 `Object.is` 比较）才重渲染。
- **`useSyncExternalStore(subscribe, getSnapshot)`**：React 在渲染时调用 `getSnapshot` 读当前值，并注册 `subscribe` 回调；外部 store 变化时通知 React 重渲染，且并发下用 `getServerSnapshot` 保证一致性——这是 Redux/Zustand 接入 React 的官方桥梁。
- **Redux**：`reducer(state, action)` 纯函数 + `dispatch` 生成新 state（`combineReducers` 切片合并）；RTK 用 **Immer**（`produce`）把「看起来像修改」的草稿在底层转成不可变新对象，所以你能写 `s.value++`。

---

## 四、三框架对比小结

| 维度 | Vue 3 · Pinia | Vue 2 · Vuex 3 | React · 内置 + RTK/Zustand |
|------|------|------|------|
| 响应式底座 | Vue `reactive/ref` | Vue 2 `Vue.observable` | React 内置（无响应式系统，靠重渲染） |
| 改状态方式 | 直接改 / action | mutation（同步）+ action（异步） | `setState` / `dispatch(action)`（纯函数） |
| 是否强制同步 mutation | 否 | 是（mutation 必须同步） | reducer 必须纯 |
| 全局 store 单例 | 是（按 id 缓存） | 是（单例 store） | 可多个 context / store |
| DevTools 时间旅行 | 原生支持 | 依赖 mutation 同步 | Redux DevTools（RTK 原生） |
| 跨 store/模块调用 | 直接 `useOtherStore()` | 命名空间 + root 访问 | Context / store 组合 |
| 服务端状态 | `$subscribe` 自行持久化 | `subscribe` + SSR | RTK Query / TanStack Query |
| 学习曲线 | 低 | 中（mutation/action 区分） | 中~高（Hooks 规则 + 库选型） |

**结论**：Vue 3 用 Pinia 心智最轻；Vue 2 受历史约束需严格区分 mutation/action；React 灵活度最高但选型成本也最高（内置 vs Redux vs Zustand vs Query），建议「能内置就内置，跨应用共享再上库」。
