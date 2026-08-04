# 🗃️ 移动端状态管理与数据流

> 应用变大后，"状态放哪、怎么流转"决定可维护性。本篇讲：状态分类、单向数据流、Pinia(Zustand) 用法、服务端状态(React Query/SWR)、持久化、跨页面通信、状态恢复。依据 **Pinia 官方**、**Zustand 官方**、**TanStack Query 官方**、**Vue/React 官方理念**。前置：[Vue3 移动端 0-1](vue3-mobile.md) / [React 移动端 0-1](react-mobile.md)。

---

## 一、先分类：状态不是一锅煮

| 类型 | 例子 | 存哪 | 工具 |
|------|------|------|------|
| **UI 状态** | 弹窗开关、Tab 选中 | 组件内 `ref`/`useState` | 框架原生 |
| **全局客户端状态** | 用户信息、主题、登录态 | 全局 store | Pinia / Zustand |
| **服务端状态** | 接口数据、列表 | 服务端为真相源 | React Query / SWR |
| **跨页瞬时** | 路由参数、分享数据 | URL / 路由 state | 路由 |
| **持久化** | token、草稿、设置 | 本地存储 | 持久化插件 + IndexedDB |

!!! tip "核心原则：服务端状态别进全局 store"
    接口数据是"服务端的状态"，用 React Query/SWR 管理（自动缓存/重试/失效），**不要**手动塞进 Pinia/Zustand，否则缓存失效、重复请求、一致性崩（详见 [网络层](network-data.md) §三）。

---

## 二、单向数据流（铁律）

```
UI 事件 → action(改 store) → state 变 → 视图重渲染
```

- Vue：`ref/reactive` 单向，改 state 只通过 action（Pinia `actions`）。
- React：state 不可直接改，`setState`/reducer 是唯一入口。
- **禁止**在视图里直接 `store.xxx = 1` 绕过 action（难追踪）。

---

## 三、Pinia（Vue3 全局状态）

```ts
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({ token: '', profile: null as Profile | null }),
  getters: { isLogin: (s) => !!s.token },
  actions: {
    setToken(t: string) { this.token = t; localStorage.setItem('token', t) },
    async fetchProfile() { this.profile = await request('/api/profile') }
  }
})
```

```vue
<script setup>
const user = useUserStore()
user.setToken('xxx')   // 只经 action
</script>
```

!!! danger "坑 1：store 里直接发请求却不用 SWR"
    列表/详情等服务端数据用 Pinia 手管 → 重复请求、缓存失效。服务端状态交给 [React Query/SWR](network-data.md) §三。

---

## 四、Zustand（React 全局状态）

```ts
import { create } from 'zustand'
const useUser = create<{ token: string; setToken: (t: string) => void }>((set) => ({
  token: '',
  setToken: (t) => { localStorage.setItem('token', t); set({ token: t }) }
}))
// 组件：const token = useUser(s => s.token)  // 精准订阅，避免无关重渲染
```

!!! tip "精准订阅防过度渲染"
    `useUser(s => s.token)` 只订阅 token，token 不变不重渲染——移动端低端机性能关键（见 [性能·React](react-mobile.md) §六）。

---

## 五、服务端状态：React Query / SWR

```ts
// React Query：缓存/重试/失效/乐观更新一体
const { data } = useQuery({ queryKey: ['profile'], queryFn: () => request('/api/profile') })
const mut = useMutation({
  mutationFn: like,
  onMutate: async (id) => { /* 乐观更新 */ },
  onError: (_, __, ctx) => { /* 回滚 */ }
})
```

> Vue 侧用 `swrv`（SWR 的 Vue 版）或 Pinia + 自封装（见 [网络层 §三](network-data.md)）。

---

## 六、持久化与状态恢复

```ts
// Pinia 持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
pinia.use(piniaPluginPersistedstate)
// store 里加 persist: true 即自动存 localStorage
```

- **敏感信息别持久化**：token 用 HttpOnly Cookie 或内存，勿明文 localStorage 长期存（见 [安全专项](security.md) §一）。
- **页面被杀恢复**：App 切后台被杀 → 重开时从持久化恢复登录态/草稿，避免用户重来。

---

## 七、跨页面通信

| 场景 | 方式 |
|------|------|
| 父子/兄弟 | props / emits（Vue）、props / 回调（React） |
| 跨路由全局 | 全局 store（Pinia/Zustand） |
| 页面参数 | 路由 query/params、路由 state |
| WebView 跨端 | Bridge（见 [H5+WebView](h5-webview.md) §四） |
| 全局事件 | 谨慎用 EventBus，易内存泄漏（记得 off） |

!!! danger "坑 2：EventBus 不销毁泄漏"
    全局事件总线监听未在卸载时 `off` → 多次挂载重复触发、内存泄漏。优先用 store/路由，少用 EventBus。

---

## 八、速查：状态问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| 数据不同步 | 服务端状态手管 store | 改用 React Query/SWR |
| 无关组件重渲染 | 订阅过宽 | 精准订阅（Zustand selector） |
| 刷新丢登录 | 未持久化 | persist + 恢复 |
| 内存泄漏 | EventBus 未 off | 卸载清理 / 改用 store |
| 敏感泄露 | token 明文持久化 | HttpOnly Cookie/内存 |

---

## 九、章节关联

- 服务端状态缓存 → [网络层与数据一致性](network-data.md)
- 登录态/持久化 → [H5+WebView 登录态](h5-webview.md) §五、[安全专项](security.md)
- Vue3/React 落地 → [vue3-mobile.md](vue3-mobile.md) / [react-mobile.md](react-mobile.md)
