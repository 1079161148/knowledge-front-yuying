# 🧱 框架基础核心 API（新人入口）

> 本篇是"框架与进阶"的**地基**。如果你刚接触 Vue/React，先读这篇，把每个核心 API 的**最小用法**吃透，再去读后面的响应式原理、组件、路由、状态管理——那些篇会假设你已经会写基本的"数据 → 视图"。
>
> 权威来源：[Vue 官方文档](https://vuejs.org/guide/introduction.html)、[Vue 3 响应式 API](https://vuejs.org/api/reactivity-core.html)、[React 官方文档](https://react.dev/learn)、[React Hooks 参考](https://react.dev/reference/react)。

---

## 一、先搞懂：框架到底解决什么

纯 JS 写页面，数据变了要**手动**去 DOM 里改文字、加节点、绑事件。应用一大，手动同步「数据 ↔ 视图」会到处是 `document.getElementById(...).textContent = ...`，又乱又容易漏。

框架做的事就是一句话：

> **你只声明"数据是什么、视图长什么样"，数据变了，框架自动把视图更新到对的样子。**

- **Vue**：模板语法（HTML 里写 `{{ }}`、`v-if`）声明式，框架编译成更新函数。
- **React**：用 JS 写 JSX 描述视图，框架（Fiber 调度）对比前后虚拟 DOM 来更新真实 DOM。

!!! danger "新手第一个坑：别再手动操作 DOM"
    用了框架就**尽量不写** `document.querySelector(...).innerHTML = ...`。数据变了改「数据」本身，让框架去更新视图。混用原生 DOM 操作和框架，会出现"我改了数据视图没变 / 我改了 DOM 框架又给我盖掉"的诡异 bug。

---

## 二、Vue 基础模板语法（核心指令）

Vue 模板是"增强的 HTML"，下面 5 个指令覆盖了 90% 的日常写法。

| 指令 | 作用 | 等价语义 |
|------|------|----------|
| `{{ msg }}` | 文本插值 | 把数据渲染成文字 |
| `v-bind:` 或 `:` | 动态绑定属性 | `:src="url"` 数据变 → 属性变 |
| `v-on:` 或 `@` | 绑定事件 | `@click="fn"` 点击触发 |
| `v-if` / `v-else` | 条件渲染 | 真就渲染、假就移除节点 |
| `v-for` | 列表渲染 | 遍历数组生成多个节点 |

### 2.1 最小示例（Vue 3 `<script setup>`）

```html
<script setup>
import { ref } from 'vue'
const title = ref('你好 Vue')      // 响应式数据：用 ref 包裹
const count = ref(0)
const list = ref(['Apple', 'Banana'])
const add = () => count.value++    // 改值要 .value（ref 的套路）
</script>

<template>
  <h1>{{ title }}</h1>                         <!-- 文本插值 -->
  <button @click="add">点了 {{ count }} 次</button>   <!-- 事件 + 插值 -->
  <ul>
    <li v-for="item in list" :key="item">{{ item }}</li>  <!-- 列表 + 动态属性 -->
  </ul>
  <p v-if="count > 3">点超过 3 次啦</p>          <!-- 条件渲染 -->
</template>
```

!!! danger "v-for 必须写 :key"
    不写 `:key` 在列表增删/排序时会导致**状态错乱**（比如输入框内容串位）。`key` 用稳定且唯一的值，别用数组下标。

!!! danger "ref 在 JS 里要 .value，在模板里不用"
    这是 Vue 3 新人最高频错误：`count.value++` 才对；模板里写 `{{ count }}`（自动解包）不要写成 `{{ count.value }}`。

---

## 三、Vue 响应式核心 API（基础）

权威来源：[Vue 3 响应式核心 API](https://vuejs.org/api/reactivity-core.html)。

### 3.1 `ref` —— 任意类型的响应式值

```js
import { ref } from 'vue'
const n = ref(0)
n.value++            // 改要 .value
console.log(n.value) // 读要 .value
```

### 3.2 `reactive` —— 对象/数组的响应式（不用 .value）

```js
import { reactive } from 'vue'
const state = reactive({ name: 'Tom', age: 18 })
state.age = 19       // 直接改属性即可
```

!!! danger "reactive 的坑：不能直接整体替换"
    `state = reactive({...})` 这样重新赋值会**丢失响应性**。要换对象就改属性：`Object.assign(state, newObj)`；或者干脆用 `ref` 包对象：`const state = ref({...})`，改值用 `state.value = newObj`。

### 3.3 `computed` —— 派生状态（自动缓存）

```js
import { ref, computed } from 'vue'
const price = ref(10)
const count = ref(2)
const total = computed(() => price.value * count.value)  // 只读派生
```

### 3.4 `watch` —— 监听变化做副作用

```js
import { ref, watch } from 'vue'
const keyword = ref('')
watch(keyword, (newVal, oldVal) => {
  console.log('搜索词变了：', newVal)
})
```

!!! danger "computed vs watch 别用反"
    - 想要"一个值跟着另一个值算出来" → 用 `computed`（声明式，可读可缓存）。
    - 想要"值变了去发请求 / 存 localStorage" → 用 `watch`（命令式副作用）。
    新人常把本该 `computed` 的逻辑写进 `watch` 再手动赋值，既冗余又易漏更新。

---

## 四、React 基础语法（JSX + Hooks）

权威来源：[React 官方文档](https://react.dev/learn)、[useState](https://react.dev/reference/react/useState)、[useEffect](https://react.dev/reference/react/useEffect)。

React 没有"模板指令"，视图用 **JSX**（长得像 HTML 的 JS 表达式）描述，逻辑用 **Hooks**（以 `use` 开头的函数）管理。

### 4.1 最小示例

```jsx
import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)   // [值, 改值的函数]
  const list = ['Apple', 'Banana']
  return (
    <>
      <h1>你好 React</h1>
      <button onClick={() => setCount(c => c + 1)}>点了 {count} 次</button>
      <ul>
        {list.map(item => <li key={item}>{item}</li>)}   {/* 列表用 map + key */}
      </ul>
      {count > 3 && <p>点超过 3 次啦</p>}                  {/* 条件用 && */}
    </>
  )
}
```

### 4.2 `useState` —— 响应式状态

```js
const [name, setName] = useState('Tom')
setName('Jerry')        // 改状态必须调 setter，不能直接 name = 'Jerry'
```

!!! danger "React 状态是不可变的（最重要的一条）"
    - 数组：`setList([...list, 'new'])`，**不能** `list.push('new')`。
    - 对象：`setUser({ ...user, age: 19 })`，**不能** `user.age = 19`。
    直接改原值，React **检测不到变化**，视图不更新。这是 React 新人第一大坑。

### 4.3 `useEffect` —— 副作用（发请求、订阅、定时）

```js
import { useState, useEffect } from 'react'
useEffect(() => {
  const id = setInterval(() => console.log('tick'), 1000)
  return () => clearInterval(id)   // 清理函数：组件卸载/下次执行前调用
}, [])                             // 空依赖 → 只跑一次
```

!!! danger "useEffect 依赖数组写错 = 死循环或陈旧数据"
    - 空 `[]`：挂载时跑一次。
    - 不写依赖：每次渲染都跑（容易触发无限更新）。
    - 漏写依赖（effect 里用到的变量没列进数组）：拿到的是**旧值**，且 ESLint 会警告。
    需要"某个值变了才重跑"就把那个值放进数组：`useEffect(() => {...}, [keyword])`。

---

## 五、Vue 与 React 基础写法对照表

| 需求 | Vue 3 | React |
|------|-------|-------|
| 声明状态 | `const n = ref(0)` / `reactive({})` | `const [n, setN] = useState(0)` |
| 改状态 | `n.value++` / 直接改属性 | `setN(n + 1)`（必须走 setter） |
| 派生值 | `computed(() => ...)` | 直接函数 / `useMemo` |
| 条件渲染 | `v-if` / `v-else` | `{cond && <X/>}` 或 `{cond ? <A/> : <B/>}` |
| 列表渲染 | `v-for="x in list" :key` | `list.map(x => <li key>)` |
| 绑定事件 | `@click="fn"` | `onClick={fn}` |
| 监听变化 | `watch(fn, cb)` | `useEffect(cb, [deps])` |

---

## 六、自检清单

- [ ] 我能用 Vue 写 `ref`/`reactive` 声明状态，并正确用 `.value` 改值
- [ ] 我知道 `v-for` 必须配 `:key`，且 `key` 不用下标
- [ ] 我能区分 `computed`（派生）和 `watch`（副作用）的使用场景
- [ ] 我知道 React 状态不可变，数组/对象要用展开运算符生成新值
- [ ] 我会用 `useState` 的 setter 改状态，而不是给变量直接赋值
- [ ] 我理解 `useEffect` 依赖数组的三种写法（空 / 不写 / 列依赖）的区别
- [ ] 我没在框架里手动 `document.querySelector(...).innerHTML` 改视图

---

## 七、下一步往哪走

- 想懂"为什么数据变了视图会自动更新" → [响应式原理对比](../reactivity/index.md)
- 想写可复用的界面单元 → [组件化对比](../components/index.md)
- 想做多页跳转 → [路由对比](../routing/index.md)
- 想管跨组件共享状态 → [状态管理对比](../state-management/index.md)
- 想看真实业务怎么写 → [实战场景集](../scenarios/index.md)
