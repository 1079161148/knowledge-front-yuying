# 🔬 响应式原理深入（Vue2 / Vue3 / React）

> 进阶篇的"底层机制"专题。把 [基础语法对比](../basics/syntax-framework-compare.md) 里一笔带过的响应式，拆到底层：Vue2 的 `Object.defineProperty`、Vue3 的 `Proxy`、React 的"不可变 + 重渲染"为何是另一条路。依据 **ECMA-262 / Vue 官方响应式文档 / React 设计理念**。

---

## 1. 响应式的本质问题

框架要解决一件事：**数据变了，怎么自动且高效地更新视图？** 三种方案的"侦测变更"手段完全不同。

---

## 2. Vue2：`Object.defineProperty`

```js
// 简化版响应式：劫持属性的 get/set
function defineReactive(obj, key, val) {
  Object.defineProperty(obj, key, {
    get() {
      // 此处收集依赖：当前正在计算的 Watcher 订阅这个 key
      track(key)
      return val
    },
    set(newVal) {
      if (newVal === val) return
      val = newVal
      trigger(key) // 通知订阅者更新
    },
  })
}
```

!!! warning "Vue2 的三处硬伤（面试高频）"
    - **新增属性不响应**：`obj.newKey = 1` 不会被侦测，必须用 `Vue.set(obj, 'newKey', 1)`。
    - **数组索引/长度变更不响应**：`arr[0] = x`、`arr.length = 0` 监听不到，需重写数组方法（push/pop…）。
    - **全量递归**：初始化就递归遍历所有嵌套属性，对象大时初始化慢。

---

## 3. Vue3：`Proxy` + `Reflect`

```js
// 用 Proxy 代理整个对象，惰性递归（访问到才代理嵌套）
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key)
      const res = Reflect.get(target, key, receiver)
      // 懒代理：只有访问到的对象才继续代理
      return typeof res === 'object' && res !== null ? reactive(res) : res
    },
    set(target, key, value, receiver) {
      const ok = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return ok
    },
  })
}
```

!!! tip "为什么 Vue3 更优"
    - 代理整个对象，**新增/删除属性、数组索引变化全部可侦测**，不再需要 `Vue.set`。
    - **惰性递归**：用到才代理，初始化更快。
    - 可拦截 `in`、`delete`、`ownKeys` 等更多操作。

!!! danger "Proxy 的注意点"
    - `Proxy` 的 `this` 问题：被代理对象的内部方法拿到 `this` 时要用 `Reflect` 透传 `receiver`，否则会丢失响应上下文。
    - 解构会丢失响应性：`const { x } = reactiveObj` 拿到的是普通值。要用 `toRefs()` 转成 ref 再解构。

---

## 4. React：不走"侦测"，走"不可变 + 重渲染"

React 不劫持数据。它假设：**状态一旦变，就返回一个新的对象/值，然后重新执行组件函数**，由 Fiber 比对差异。

```jsx
// 错误：直接改原对象，React 比对新旧引用相等 → 不更新
function Bad() {
  const [user, setUser] = useState({ name: 'A', age: 1 })
  const grow = () => { user.age++ } // ❌ 引用没变，视图不变
}

// 正确：返回新对象（不可变更新）
function Good() {
  const [user, setUser] = useState({ name: 'A', age: 1 })
  const grow = () => setUser(u => ({ ...u, age: u.age + 1 })) // ✅ 新引用
}
```

!!! warning "React 易踩坑"
    - 直接 mutate state → 视图不更新（最常见新手错误）。
    - 依赖数组漏写 → `useEffect` 闭包拿到旧值；用 `eslint-plugin-react-hooks` 兜底。
    - 大对象浅拷贝 `{...u}` 只拷贝一层，嵌套对象仍是同一引用，需深不可变更新（或 `immer`）。

---

## 5. 三种方案对比

| 维度 | Vue2 defineProperty | Vue3 Proxy | React 不可变 |
|------|---------------------|------------|--------------|
| 变更侦测 | 劫持属性 | 代理对象 | 不侦测，重渲染 |
| 新增属性 | 需 `Vue.set` | 原生支持 | 返回新对象即可 |
| 数组 | 重写方法 | 原生支持 | 返回新数组 |
| 心智模型 | 自动跟随 | 自动跟随 | 显式新值 |

> 下一站：**异步与事件循环**（[JS 异步核心](../basics/async-eventloop.md)）。
