# 🔋 响应式与状态管理

> 编程语言的"状态"就是"会变化的数据"。三大框架对"状态如何被追踪、如何触发视图更新"给出了三种答案。本节按 **基础 → 核心 → 高级** 展开。

---

## 一、基础：如何声明一个状态

=== "Vue 3（组合式）"
    ```html
    <script setup>
    import { ref, reactive } from 'vue'
    // 基本类型用 ref（通过 .value 访问）
    const count = ref(0)
    // 对象/数组用 reactive（直接访问属性）
    const user = reactive({ name: 'Tom', age: 18 })
    </script>

    <template>
      <p>{{ count }} / {{ user.name }}</p>
    </template>
    ```

=== "Vue 2（选项式）"
    ```html
    <script>
    export default {
      data() {
        return {
          count: 0,
          user: { name: 'Tom', age: 18 }
        }
      }
    }
    </script>

    <template>
      <p>{{ count }} / {{ user.name }}</p>
    </template>
    ```

=== "React（Hooks）"
    ```jsx
    import { useState } from 'react'
    export function Profile() {
      // 基本类型
      const [count, setCount] = useState(0)
      // 对象：必须整体替换（不可变）
      const [user, setUser] = useState({ name: 'Tom', age: 18 })
      return <p>{count} / {user.name}</p>
    }
    ```

!!! abstract "核心差异（基础层）"
    - **Vue2/3**：状态是"响应式对象"，直接改属性即可触发更新。
    - **React**：状态是"快照"，必须调用 `setXxx(新值)` 才能更新；**直接改 `user.name` 不会刷新视图**。

!!! warning "React 新手第一坑"
    ```jsx
    // ❌ 直接改原对象，视图不更新
    user.name = 'Jerry'
    // ✅ 返回新对象
    setUser({ ...user, name: 'Jerry' })
    ```

---

## 二、核心：派生状态与依赖追踪

=== "Vue（computed）"
    ```html
    <script setup>
    import { ref, computed } from 'vue'
    const list = ref([1, 2, 3, 4])
    // 自动追踪 list，list 不变则不重算（带缓存）
    const even = computed(() => list.value.filter(n => n % 2 === 0))
    </script>
    ```

=== "React（useMemo）"
    ```jsx
    import { useState, useMemo } from 'react'
    export function App() {
      const [list, setList] = useState([1, 2, 3, 4])
      // 依赖 [list] 变化才重算
      const even = useMemo(() => list.filter(n => n % 2 === 0), [list])
      return <span>偶数：{even.join(',')}</span>
    }
    ```

!!! info "computed vs useMemo"
    - 两者都做"缓存计算"。但 **Vue 的 `computed` 是惰性 + 精准依赖追踪**（访问时才算，依赖变才重算）；
    - **React 的 `useMemo` 是"依赖数组比对"**，且**不是语义保证**（React 可能在极端情况下重算），仅用于性能优化，不能当"响应式派生"的语义依赖。

### 原理补充：Vue `computed` 是怎么做到"精准 + 缓存"的

`computed` 本质是一个带 `dirty` 标记的 `effect`：

```js
// Vue 3 computed 简化模型
function computed(getter) {
  let value, dirty = true
  const effect = new ReactiveEffect(getter, () => { dirty = true /* 依赖变 → 标记脏 */ })
  return {
    get value() {
      if (dirty) { value = effect.run(); dirty = false } // 懒计算 + 缓存
      track(self, 'value')                                // 自身也被收集
      return value
    }
  }
}
```

---

## 三、核心：修改状态的"正确姿势"

=== "Vue 2 / 3"
    ```js
    // Vue3
    count.value++            // ref
    user.age = 19            // reactive 直接改属性
    // Vue2 新增属性要用 Vue.set（见下方坑）
    ```

=== "React（函数式更新）"
    ```jsx
    // ✅ 基于旧值更新必须用"函数式更新"
    setCount(c => c + 1)
    // ❌ 连续两次不会累加（批处理下基于同一快照）
    setCount(count + 1); setCount(count + 1) // 只 +1
    ```

!!! warning "React 批处理（Batch）"
    在**事件回调**中，多次 `setCount` 会被合并成一次重渲染；但若依赖"上一次的值"，务必用函数式更新 `setCount(c => c + 1)`，否则会基于同一旧快照计算，导致累加失效。

---

## 四、高级：深层响应式 / 批量更新 / 大对象优化

### Vue 3：`shallowRef` / `shallowReactive`（跳过深层代理，提升性能）

```js
import { shallowReactive } from 'vue'
const big = shallowReactive({ items: /* 巨大数组 */ })
// 只追踪顶层属性；深层变更需手动 triggerRef
```

### React：`useReducer`（复杂状态机）

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'add': return { ...state, list: [...state.list, action.payload] }
    case 'del': return { ...state, list: state.list.filter(i => i !== action.payload) }
    default: return state
  }
}
const [state, dispatch] = useReducer(reducer, { list: [] })
dispatch({ type: 'add', payload: 'x' })
```

### 原理补充：React 的"批量更新"演进

- React 17 及之前：**只有事件回调内**自动批量；`Promise`/`setTimeout` 内不会。
- React 18 起：引入 **Automatic Batching**，所有场景（包括 `await`、Promise、原生事件）默认批量，避免不必要的多次渲染。

---

## 五、高级：状态管理（跨组件共享）

| 方案 | Vue 2 | Vue 3 | React |
|------|-------|-------|-------|
| 官方推荐 | Vuex | **Pinia** | **Redux Toolkit / Zustand** |
| 跨层直传 | `provide/inject` | `provide/inject` | `Context` |
| 轻量共享 | EventBus | 组合式函数 + `reactive` 单例 | 自定义 Hook + `useSyncExternalStore` |

!!! example "Pinia / Zustand 共通思想"
    两者都倡导"把状态抽成独立 store，组件只读取与调用 action"，避免 `props` 层层透传（prop drilling）。

---

## 六、可运行 Demo（代码 + 实时预览）

<iframe src="../../demos/compare-counter.html" width="100%" height="480" style="border:1px solid #2c5364;border-radius:8px"></iframe>

---

## 七、真实业务场景：计数器 / 购物车数量

!!! question "场景：电商商品数量加减"
    - Vue：`ref` 包裹数量，`@click="count--"` 直接改；库存判断写在 `computed` 里。
    - React：用 `setCount(c => Math.max(1, c - 1))` 做下限保护（函数式更新 + 边界）。
    - Vue2：注意 `v-model.number` 修饰符，避免拿到字符串 `'1'`。

!!! danger "踩坑清单"
    - **Vue2**：新增对象属性不响应 → `this.$set(this.obj, 'k', v)`。
    - **Vue3**：`reactive` 解构会丢失响应性 → 用 `toRefs()` 或保持 `ref`。
    - **React**：在 `render` 里直接 `setState` 会死循环 → 放 `useEffect`；`useState` 初始值是"惰性"的，传函数 `useState(() => heavyInit())` 才只算一次。

---

[← 返回总览](../index.md)  ·  [下一节：组件·通信·生命周期 →](../components/index.md)
