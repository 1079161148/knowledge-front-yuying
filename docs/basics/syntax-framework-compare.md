# 🧩 基础语法 · 框架对比

> 以「响应式与数据绑定」为开篇示例，演示 **Vue2 / Vue3 / React / Next.js / Nuxt 3** 的同屏对比写法，并提供**可直接运行的 Demo**（Tab 切换预览）。

---

## 1. 基础：响应式与数据绑定

**概念（依据 ECMA-262 + 各框架官方文档）**：响应式指"数据变化时，视图自动更新"。各框架实现机制不同：

- Vue2：基于 `Object.defineProperty` 劫持 `data` 的属性访问/赋值。
- Vue3：基于 `Proxy` 代理整个对象，性能与完备性更优。
- React：状态不可变，调用 `setState` / `useState` 触发组件重渲染。

=== "Vue 3"
    ```html
    <!-- 组合式 API：ref 创建响应式变量 -->
    <template>
      <button @click="count--">-</button>
      <span>{{ count }}</span>
      <button @click="count++">+</button>
    </template>

    <script setup>
    import { ref, computed } from 'vue'
    const count = ref(0)
    const double = computed(() => count.value * 2)
    </script>
    ```

=== "Vue 2"
    ```html
    <!-- Options API：data 返回响应式对象 -->
    <template>
      <button @click="count--">-</button>
      <span>{{ count }}</span>
      <button @click="count++">+</button>
    </template>

    <script>
    export default {
      data() {
        return { count: 0 }
      },
      computed: {
        double() { return this.count * 2 }
      }
    }
    </script>
    ```

=== "React"
    ```jsx
    // useState 创建状态；setCount 触发重渲染
    import { useState } from 'react'

    export default function Counter() {
      const [count, setCount] = useState(0)
      return (
        <>
          <button onClick={() => setCount(c => c - 1)}>-</button>
          <span>{count}</span>
          <button onClick={() => setCount(c => c + 1)}>+</button>
        </>
      )
    }
    ```

=== "Next.js"
    ```jsx
    // App Router：'use client' 标记客户端组件后用法同 React
    'use client'
    import { useState } from 'react'

    export default function Counter() {
      const [count, setCount] = useState(0)
      return (
        <button onClick={() => setCount(c => c + 1)}>点击 {count}</button>
      )
    }
    ```

=== "Nuxt 3"
    ```html
    <!-- 基于 Vue 3，使用 <script setup> -->
    <template>
      <button @click="count--">-</button>
      <span>{{ count }}</span>
      <button @click="count++">+</button>
    </template>

    <script setup>
    const count = ref(0)
    </script>
    ```

---

## 2. 可运行 Demo（Tab 切换预览）

下面三个 Demo 为**独立 HTML**，使用 CDN 加载框架，**直接在浏览器运行**：

=== "Vue 3 在线演示"
    <iframe src="demos/vue3-counter.html" width="100%" height="200" style="border:1px solid #2c5364;border-radius:8px"></iframe>

=== "Vue 2 在线演示"
    <iframe src="demos/vue2-counter.html" width="100%" height="200" style="border:1px solid #2c5364;border-radius:8px"></iframe>

=== "React 在线演示"
    <iframe src="demos/react-counter.html" width="100%" height="200" style="border:1px solid #2c5364;border-radius:8px"></iframe>

> 说明：Next.js / Nuxt 3 为"元框架"，需要构建环境（Node + 打包），无法以单文件直接运行；其语法已在上方的代码 Tab 中对比展示，实际项目请用 `create-next-app` / `nuxi init` 脚手架。

---

## 3. 进阶：派生状态与不可变更新

- Vue：`computed` 自动追踪依赖并缓存；修改 `ref.value` / `reactive` 属性即可。
- React：状态不可变，必须返回**新值**（`setCount(c => c + 1)`），直接修改原对象不会触发更新。

```js
// ❌ React 错误写法（直接改原值，不触发渲染）
count++

// ✅ 正确写法（返回新值）
setCount(c => c + 1)
```

---

## 4. 实战：抽取为可复用组件

以"计数器"抽成组件为例，三框架写法对比：

=== "Vue 3 组件"
    ```html
    <!-- Counter.vue -->
    <script setup>
    defineProps({ modelValue: Number })
    const emit = defineEmits(['update:modelValue'])
    </script>
    <template>
      <button @click="emit('update:modelValue', modelValue - 1)">-</button>
      <span>{{ modelValue }}</span>
      <button @click="emit('update:modelValue', modelValue + 1)">+</button>
    </template>
    ```

=== "React 组件"
    ```jsx
    export function Counter({ value, onChange }) {
      return (
        <>
          <button onClick={() => onChange(value - 1)}>-</button>
          <span>{value}</span>
          <button onClick={() => onChange(value + 1)}>+</button>
        </>
      )
    }
    ```

=== "Vue 2 组件"
    ```html
    <!-- Counter.vue -->
    <script>
    export default {
      props: ['value'],
      methods: {
        dec() { this.$emit('input', this.value - 1) },
        inc() { this.$emit('input', this.value + 1) }
      }
    }
    </script>
    <template>
      <button @click="dec">-</button><span>{{ value }}</span><button @click="inc">+</button>
    </template>
    ```

---

## 5. 踩坑（注意事项）

!!! warning "常见坑"
    - **Vue2** 无法检测对象新增属性 / 数组下标赋值，需用 `Vue.set`。
    - **Vue3** `reactive` 解构会丢失响应性，应用 `toRefs` 或直接使用 `ref`。
    - **React** 状态是异步合并的，连续 `setCount(c=>c+1)` 多次才能累加；直接基于旧值算新值务必用函数式更新。
    - **Next/Nuxt** 默认服务端渲染，浏览器 API（`window`/`document`）需在 `onMounted` / `useEffect` 或客户端守卫中访问。

---

## 6. 学习经验

!!! tip "经验"
    - 先吃透**原生 JS 响应式原理**（Proxy / 发布订阅），再学框架会非常轻松。
    - 对比学习时，**固定一个需求**（如计数器），用各框架各写一遍，差异一目了然。
    - 不要死记 API，理解"数据 → 视图"的更新通道才是核心。

---

## 7. 总结

| 框架 | 响应式原理 | 状态写法 | 适用场景 |
|------|-----------|----------|----------|
| Vue2 | `Object.defineProperty` | `data()` + `this.x` | 老项目维护 |
| Vue3 | `Proxy` | `ref` / `reactive` | 新项目首选 |
| React | 不可变 + 重渲染 | `useState` | 大型应用、跨端 |
| Next.js | 同 React | 同 React | React 全栈 / SSR |
| Nuxt 3 | 同 Vue3 | 同 Vue3 | Vue 全栈 / SSR |

> 下一板块预告：**进阶篇**（组合式 API vs Hooks、虚拟 DOM 与 Diff、性能优化）。
