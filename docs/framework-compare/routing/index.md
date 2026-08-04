# 路由用法三框架对比

> 本章对比 **Vue 3（Vue Router 4）/ Vue 2（Vue Router 3）/ React（React Router v6/v7）** 的路由方案。同样按 **安装 → 基础 → 进阶 → 高级 → 注意事项 → 使用场景 → 踩坑点 → 原理与源码实现** 展开，API 均依据对应官方文档（Vue Router 4 / Vue Router 3 / React Router v6·v7）。

---

## 版本与框架对应关系

!!! important "版本速查表：Vue / Router / React 版本对应"
    | Vue 版本 | 路由库 | 路由版本 | 创建方式 | API 风格 | 守卫风格 |
    |---------|--------|---------|---------|---------|---------|
    | **Vue 3.x** | vue-router | **v4.x** | `createRouter()` | `useRoute()` / `useRouter()`（组合式） | 返回 false / 路由对象（函数式） |
    | **Vue 2.x** | vue-router | **v3.x** | `new VueRouter()` | `this.$route` / `this.$router`（选项式） | `next()` 回调式 |
    | **Vue 2.7+** | vue-router | **v3.6.x** | `new VueRouter()` | 支持 `useRoute`/`useRouter`（需 `@vue/composition-api`） | `next()` 回调式 |
    | **React 18/19** | react-router-dom | **v6/v7** | `createBrowserRouter()` | `useParams`/`useNavigate`/`useLocation`（Hooks） | `loader`/`action` + `redirect`/`errorElement` |

!!! warning "Vue 2 不能直接用 Vue Router 4"
    - Vue Router 4 依赖 Vue 3 的 Composition API（`reactive`、`ref` 等），**不兼容 Vue 2**。
    - Vue 2 项目必须使用 `vue-router@3`（最新 3.6.x）。
    - Vue 2.7 末版内置了 Composition API 回退支持，但仍**不能**安装 Vue Router 4（适配层不完整）。

!!! tip "一句话选型"
    - **Vue 3** → `vue-router@4`（组合式 API：`useRoute`/`useRouter`）。
    - **Vue 2** → `vue-router@3`（选项式：`this.$route`/`this.$router`，守卫用 `next()`）。
    - **React** → `react-router` v6/v7（数据路由：`<Routes>/<Route>` + `loaders/actions`）。

---

## Vue Router v3 vs v4：核心 API 差异速览

> 本节专门列出从 **Vue Router 3（Vue 2）→ Vue Router 4（Vue 3）** 的**每一个** API 变化，方便升级或对比。

| 功能 | Vue Router 3（Vue 2） | Vue Router 4（Vue 3） | 说明 |
|------|----------------------|----------------------|------|
| **安装方式** | `npm i vue-router@3` | `npm i vue-router@4` | 主版本不同，安装时必须指定 |
| **创建实例** | `new VueRouter({ mode, routes })` | `createRouter({ history, routes })` | v4 用工厂函数替代 `new` 构造函数 |
| **历史模式** | `mode: 'history'` / `'hash'` / `'abstract'` | `history: createWebHistory()` / `createWebHashHistory()` / `createMemoryHistory()` | v4 模式改为函数调用，不再用字符串配置 |
| **注册到 Vue** | `Vue.use(VueRouter)` → `new Vue({ router })` | `app.use(router)` | v4 通过 `createApp` 链式调用 |
| **读取路由参数** | `this.$route.params.id` / `this.$route.query` | `const route = useRoute(); route.params.id` | v4 组合式 API，`route` 是响应式 `ref` |
| **编程式导航** | `this.$router.push('/')` / `this.$router.replace('/')` / `this.$router.go(-1)` | `const router = useRouter(); router.push('/')` / `router.replace('/')` / `router.go(-1)` | v4 从 `useRouter()` 获取 router 实例，`push` 返回 Promise |
| **全局守卫** | `router.beforeEach((to, from, next) => { next() })` | `router.beforeEach((to, from) => { return true })` | v3 必须调用 `next()`；v4 改为返回 `true`/`false`/路由对象 |
| **组件内守卫（选项式）** | `beforeRouteEnter(to, from, next)` 需 `next(vm=>{})` | `beforeRouteEnter(to, from)` 无 `next`，但组合式推荐用 `onBeforeRouteEnter` | v4 选项式守卫也去掉了 `next`，但 `beforeRouteEnter` 中无 `this` 仍需注意 |
| **组件内守卫（组合式）** | 不支持（v3 无组合式 API） | `onBeforeRouteUpdate(guard)` / `onBeforeRouteLeave(guard)` | v4 新增，在 `setup` 内直接注册守卫 |
| **动态添加路由** | `router.addRoutes(routes)` （复数！） | `router.addRoute('parent', route)` （单数） | v3 用复数且只能追加一组路由；v4 用单数，可指定父路由名称 |
| **删除路由** | 无直接 API，需重建路由表 | `router.removeRoute('name')` | v4 新增 |
| **动态路由匹配** | `path: '/user/:id?'` 可选参数 | `path: '/user/:id?'` 支持，另新增 `path: '/user/:id(\\d+)'` 正则约束 | v4 参数可用正则校验 |
| **路由级守卫** | `beforeEnter(to, from, next)` | `beforeEnter(to, from)` | 同样去掉 `next` |
| **路由元信息解析** | 需手动遍历 `$route.matched` 获取完整 meta | `route.meta` 自动合并所有匹配路由的 meta | v4 对嵌套路由的 meta 做了合并，读取更方便 |
| **scrollBehavior** | `scrollBehavior(to, from, savedPosition)` | `scrollBehavior(to, from, savedPosition)` 额外支持返回 Promise 与 `el` 选择器延迟滚动 | v4 增强 |
| **路由懒加载** | `component: () => import('./X.vue')` | `component: () => import('./X.vue')` | 语法一致 |
| **`<router-link>`** | `tag` 属性可改标签名、`append` 属性、`event` 属性 | 移除 `tag`/`append`/`event`；改用 `v-slot` 自定义、`custom` 属性 | v4 通过作用域插槽实现完全自定义 |
| **`<router-view>`** | 基本使用 | 新增 `v-slot="{ Component, route }"` + `<Transition>` / `<KeepAlive>` 控制 | v4 支持作用域插槽，方便包裹动画与缓存 |
| **TypeScript** | 基础类型声明 | 完整类型支持（`RouteRecordRaw`、`RouteLocationNormalized` 等） | v4 原生完善 |

---

## 一、Vue 3 · Vue Router 4

### 0. 安装与启动

```bash
npm install vue-router@4
```

```js
// main.js / main.ts
import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue'
import App from './App.vue'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/Home.vue') },
  { path: '/user/:id', name: 'user', component: () => import('./views/User.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')
```

### 1.1 基础用法

```js
import { createWebHistory, createWebHashHistory, createMemoryHistory, create Router } from 'vue-router'
import { createApp } from 'vue'

const router = create Router({
  history: createWebHistory(import.meta.env.BASE_URL), // 或 createWebHashHistory()
  routes: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue') }, // 懒加载
    { path: '/user/:id', name: 'user', component: () => import('./views/User.vue') },
  ],
})
createApp(App).use(router).mount('#app')
```

模板中用 `<router-link to="/user/1">` 与 `<router-view />`；组合式 API 中：

```js
import { useRoute, use Router } from 'vue-router'
const route = useRoute()      // 响应式：route.params.id / route.query / route.path
const router = use Router()
router.push({ name: 'user', params: { id: 1 } })
router.replace('/')   // 替换不记录历史
router.go(-1)         // 后退
```

- `history` 可选 `createWebHistory`（HTML5，需服务端 fallback）、`createWebHashHistory`（哈希）、`createMemoryHistory`（SSR/测试）。
- `route` 是响应式对象，模板里直接 `{{ route.params.id }}` 即可。

### 1.2 进阶用法

- **动态路由**：`path: '/user/:id'`，可选 `:id?`；多段 `/user/:id/post/:pid`。
- **嵌套路由**：父路由 `component` 内放 `<router-view/>`，子路由写在 `children: [{ path: 'profile', component: … }]`。
- **命名视图**：`components: { default, sidebar }` 配合 `<router-view name="sidebar"/>`。
- **`props: true`**：把 `params` 作为组件 props 注入（解耦路由耦合）。
- **重定向 / 别名**：`redirect: { name: 'home' }`、`alias: '/u/:id'`。
- **懒加载**：`component: () => import('./X.vue')`（路由级代码分割，配合 Vite 自动拆包）。

### 1.3 高级用法

- **全局守卫**：`router.beforeEach((to, from) => { /* 返回 false 取消 / 返回路由对象重定向 */ })`、`router.beforeResolve`、`router.afterEach`。
- **路由级守卫**：`beforeEnter: (to, from) => {…}`，写在路由配置里。
- **组件内守卫（组合式）**：`onBeforeRouteUpdate`、`onBeforeRouteLeave`（在 `setup` 内使用）。
- **组件内守卫（选项式）**：`beforeRouteEnter`（此时无 `this`，用 `next(vm => …)` 拿实例）、`beforeRouteUpdate`、`beforeRouteLeave`。
- **登录鉴权**：在 `beforeEach` 里读 `to.meta.requiresAuth` 与全局状态决定放行/重定向。
- **`scrollBehavior`**：返回 `{ top: 0 }` 或 `el` 锚点，控制导航后滚动位置。
- **动态增删路由**：`router.addRoute('admin', {…})` / `router.removeRoute('admin')`。

!!! example "全局鉴权守卫"
    ```js
    router.beforeEach((to) => {
      if (to.meta.requiresAuth && !store.isAuthenticated) {
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    })
    ```

### 1.4 注意事项

1. `history` 模式（HTML5）**需要服务端配置 fallback**（所有路径返回 `index.html`），否则刷新 404；本地开发 Vite 已处理。
2. `router.push` 返回 Promise，重复导航可 `catch`（`NavigationDuplicated`）。
3. `useRoute()` 必须在 `setup` 或 `computed` 等 Vue 上下文里调用。

### 1.5 使用场景

- SPA 页面跳转、嵌套布局、按权限控制可访问路由。
- 路由级懒加载做首屏体积优化。

### 1.6 踩坑点

- **`history` 模式部署后刷新 404** → 服务端加 SPA fallback（Nginx `try_files $uri /index.html`）。
- **动态参数变化组件不刷新**：`/user/1` → `/user/2` 复用同组件，需 `watch(() => route.params.id, …)` 或用 `onBeforeRouteUpdate`。
- **`query` 变化不重渲染**：`?page=1` → `?page=2` 需监听 `route.query`。
- 选项式 `beforeRouteEnter` 里用 `this` 为 `undefined` → 通过 `next(vm => …)` 获取实例。

### 1.7 原理与源码实现

- 路由表经 **matcher**（`path-to-regexp` 编译）生成可匹配的路由记录；`currentRoute` 是一个 `ref`，因此 `useRoute()` 能响应式更新。
- `router.push` 流程：`resolve` 目标路由 → 依次执行 `beforeEach` → `beforeEnter` → 组件内 `beforeRouteUpdate/Leave` → `beforeResolve` → 更新 `currentRoute` → 组件切换 → `afterEach`。
- 历史模式差异只在「如何读写 URL」：HTML5 用 `pushState`，哈希用 `hashchange`，memory 仅存于内存。

---

## 二、Vue 2 · Vue Router 3

> 适用版本：Vue 2.7 末版，搭配 **vue-router@3**（最新小版本 3.6.x）。

### 0. 安装与启动

```bash
npm install vue-router@3
```

```js
// main.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'

// Vue 2 插件机制：必须先 Vue.use()
Vue.use(VueRouter)

const routes = [
  { path: '/', component: () => import('./views/Home.vue') },
  { path: '/user/:id', component: () => import('./views/User.vue') },
]

const router = new VueRouter({
  mode: 'history', // 'hash'（默认）| 'history' | 'abstract'
  routes,
})

// Vue 2 通过配置对象传入 router
new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
```

!!! info "Vue 2.7 注意"
    Vue 2.7 末版内置了部分 Composition API 支持，但仍**只能使用 vue-router@3**。
    可以在 Vue 2.7 中安装 `@vue/composition-api` 获得有限的 `useRoute`/`useRouter` 能力，但官方不推荐在生产环境依赖此路径。

### 2.1 基础用法

```js
import Vue from 'vue'
import Vue Router from 'vue-router'
Vue.use(Vue Router)

const router = new Vue Router({
  mode: 'history', // 'hash' | 'abstract'
  base: '/',
  routes: [
    { path: '/', component: () => import('./Home.vue') },
    { path: '/user/:id', component: () => import('./User.vue') },
  ],
})
new Vue({ router, render: h => h(App) }).$mount('#app')
```

在组件内使用：

```js
// this.$route 响应式：this.$route.params.id / this.$route.query
// this.$router 控制导航
this.$router.push({ path: '/user/1' })
this.$router.replace('/')
this.$router.go(-1)
```

### 2.2 进阶用法

- **动态路由 / 嵌套 / 重定向 / 别名 / 懒加载** 与 Vue Router 4 基本一致（`component: () => import()`）。
- **命名视图**：`components: { default, sidebar }`。
- **`props: true`**：把 `params` 注入组件 `props`。

### 2.3 高级用法

- **全局守卫**：`router.beforeEach((to, from, next) => { …; next() })`、`router.afterEach`、`router.beforeResolve`。
- **路由级**：`beforeEnter(to, from, next)`。
- **组件内守卫**：`beforeRouteEnter(to, from, next)`、`beforeRouteUpdate`、`beforeRouteLeave`（**必须调用 `next()`**）。
- **动态路由**：`router.addRoutes(routes)`（注意是复数 `addRoutes`，Vue Router 4 改为单数 `addRoute`）。
- **`scrollBehavior`**、`meta` 鉴权同 4 代。

### 2.4 注意事项

1. **v3 守卫必须显式调用 `next()`**（或 `next(false)`/`next('/')`），不调用导航会**卡住**；v4 改为「返回 false / 路由对象」的写法，不再强制 `next`。
2. `mode: 'history'` 同样需要服务端 fallback。
3. `beforeRouteEnter` 中**没有 `this`**，需用 `next(vm => {…})` 访问实例。

### 2.5 使用场景

- Vue 2 单页应用的页面导航与权限控制，与 Vue Router 4 场景一致。

### 2.6 踩坑点

- **忘记 `next()`** → 整条导航挂起，页面「点了没反应」。
- **`beforeRouteEnter` 里用 `this`** → `undefined`，改用 `next(vm => …)`。
- **`addRoutes` 拼写**：v3 是复数，v4 改单数 `addRoute`，升级时易踩。
- 同 Vue Router 4 的 history 刷新 404、`params` 变化不刷新问题。

### 2.7 原理与源码实现

- 与 v4 同源，使用 `new Vue({ data: { route } })`（内部 `Vue.observable`）把当前路由变成响应式对象，因此 `this.$route` 响应式。
- 守卫采用 **`next` 回调式** 串行执行链：每个守卫决定是否继续（`next()`）、中止（`next(false)`）或重定向（`next({…})`）；v4 将其重构为「返回 Promise/值」的函数式风格，更易组合与 `async/await`。

---

## 三、React · React Router v6 / v7

> 适用版本：最新稳定 **v7**（v6 的 API 基本沿用；v7 新增并行路由/SSR 增强，下面以 v6/v7 数据路由为准）。

### 0. 安装与启动

```bash
npm install react-router-dom
# 当前安装的是 v7（或 v6），react-router-dom 对等依赖 react-router
```

```jsx
// main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'user/:id', element: <User /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

// 也可以使用声明式写法（无需 createBrowserRouter）：
// <BrowserRouter><Routes>...</Routes></BrowserRouter>
```

### 3.1 基础用法

```jsx
import { createBrowser Router, Router Provider, Routes, Route, Link, useParams, useNavigate, Outlet } from 'react-router-dom'

// 声明式写法
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />               {/* 默认子路由 */}
        <Route path="user/:id" element={<User />} />
      </Route>
    </Routes>
  )
}
// 或数据路由写法：
const router = createBrowser Router([
  { path: '/', element: <Layout />, children: [
    { index: true, element: <Home /> },
    { path: 'user/:id', element: <User /> },
  ]},
])
;< Router Provider router={router} />
```

组件中：

```jsx
<Link to="/user/1">用户</Link>          // 用 Link 而非 <a>，避免整页刷新
const { id } = useParams()              // 读取动态段（均为字符串）
const navigate = useNavigate()
navigate('/user/2')                     // 或 navigate(-1) 后退
```

- `<Outlet/>` 是嵌套路由的「出口」，放在父布局组件里。
- v6 起用 `<Routes>`（取代 v5 的 `<Switch>`），按**路由排名**匹配最具体的一条。

### 3.2 进阶用法

- **动态段**：`path="user/:id"`，`useParams()` 读取。
- **嵌套 + `<Outlet/>`**：父 `element=<Layout/>` 内放 `<Outlet/>` 渲染子路由。
- **`index` 路由**：父路径下的默认子页面。
- **搜索参数**：`const [q, setQ] = useSearch Params(); q.get('page'); setQ({ page: 2 })`。
- **相对导航**：`navigate('profile')`（相对当前路由）；`navigate('../')` 返回上一级。
- **`NavLink`**：自动带 `active` 样式（`className` 回调判断 `isActive`）。

### 3.3 高级用法（数据路由）

v6.4+ / v7 引入**数据路由**，把「数据加载 / 提交」也纳入路由配置：

!!! example "loader / action"
    ```jsx
    const router = createBrowser Router([
      { path: 'user/:id',
        loader: async ({ params }) => fetchUser(params.id),
        action: async ({ request }) => { /* 处理表单提交 */ },
        element: <User />,
        errorElement: <ErrorPage />,
      },
    ])
    // 组件中：
    const user = useLoaderData()            // 读取 loader 返回的数据
    const navigation = useNavigation()      // 判断 loading / submitting 状态
    ```
- **`loader`**：进入路由前并行加载数据；`action`：处理 `<Form>` 提交。
- **`errorElement`**：loader/action 抛错或组件渲染出错时的兜底 UI。
- **`Form` 组件**：原生表单提交走 `action`，自动管理 pending 状态。
- **路由懒加载**：`route.lazy(() => import('./User'))` 动态加载路由模块。
- **导航拦截**：`useBlocker` 在离开带未保存数据的页面前确认。
- **并行路由（v7）/ SSR**：v7 增强布局并行加载与流式 SSR。

### 3.4 注意事项

1. **始终用 `<Link>`/`navigate`** 而非 `<a href>`，否则整页刷新丢失状态。
2. `useNavigate` / `useParams` 等必须在 `<Routes>`（或 `createBrowser Router`）**上下文内**调用。
3. v6 匹配是**排名制**（最具体优先），无需写 `exact`；但太泛的父路由可能意外抢匹配。
4. `loader`/`action` 必须定义在对应 `Route` 上，且需返回（不要再包一层非 Promise）。

### 3.5 使用场景

- SPA 页面导航、嵌套布局、面包屑。
- 配合 `loader/action` 做「路由即数据接口」的约定式数据加载与表单提交。
- 需要离开确认、loading 状态、错误边界的复杂应用。

### 3.6 踩坑点

- **误用 `<a>`** → 整页刷新、状态丢失。
- **`useParams()` 返回值全是字符串** → 数字需 `Number(id)`。
- **路由排名困惑**：`/user/new` 与 `/user/:id` 谁先匹配？v6 按静态段优先，更具体的胜出（注意 `/user/:id` 不会吃掉 `/user/new`）。
- **`loader/action` 没挂到正确路由**：组件里 `useLoaderData()` 拿到 `undefined`。
- v5 老代码用 `<Switch>` → v6 必须改成 `<Routes>`。
- 相对路径 `navigate('user')` 是基于当前 URL 还是路由层级易混 → 显式写全路径更稳。

### 3.7 原理与源码实现

- React Router 基于 **`history` 库**监听 URL 变化，并提供 `useLocation` 等 hook 让组件订阅。
- **匹配算法**：把路由表编译成带「得分」的正则，`<Routes>` 渲染**匹配得分最高**的那条（排名制，取代 v5 的顺序匹配 + `exact`）。
- **数据路由**：`createBrowser Router` 在内部维护一个 router 上下文；导航时并行执行匹配路由的 `loader`，结果经 `useLoaderData` 下发；`action` 处理 `<Form>` 提交后用 `redirect` 跳转；`useNavigation` 暴露 `state: 'idle' | 'loading' | 'submitting'` 驱动 UI。
- 与 Vue Router 的「守卫拦截」不同，React Router 用 **`loader` 抛错误 / `redirect` 返回值 / `errorElement`** 来表达加载失败与重定向，更函数式。

---

## 四、三框架路由对比小结

| 维度 | Vue 3 · Vue Router 4 | Vue 2 · Vue Router 3 | React · React Router v6/v7 |
|------|------|------|------|
| 路由定义 | `routes` 数组 + `create Router` | `routes` 数组 + `new Vue Router` | `<Routes>/<Route>` JSX 或 `createBrowser Router(routes)` |
| 历史模式 | `createWebHistory/Hash/Memory` | `mode: 'history'/'hash'/'abstract'` | 由 router 类型决定（Browser/Hash/Memory） |
| 取路由信息 | `useRoute()`（组合式）/ `this.$route` | `this.$route` | `useParams`/`useLocation`/`useSearch Params` |
| 跳转 | `router.push/replace/go` | `this.$router.push/…` | `navigate` / `<Link>` |
| 嵌套 | `children` + `<router-view>` | `children` + `<router-view>` | 嵌套 `<Route>` + `<Outlet/>` |
| 守卫风格 | 返回 false / 路由对象（函数式） | `next()` 回调式 | `loader` 抛错/`redirect` + `errorElement` |
| 动态增删 | `addRoute`/`removeRoute` | `addRoutes`（复数） | 路由树静态（v7 可并行/懒加载） |
| 数据加载 | 组件内 `onMounted` 自己取 | 同左 | `loader` 内取，随路由并行 |
| SSR | 官方支持（Nuxt） | 支持（需配置） | v7 流式 SSR / `createStaticHandler` |

**结论**：Vue 3 与 Vue 2 的路由心智几乎一致（仅守卫写法与 `addRoute` 命名不同）；React Router v6/v7 范式差异最大——用 JSX 声明路由、排名匹配、并把数据加载（`loader/action`）纳管进路由，适合「路由即数据」的现代 SPA。
