# 💼 面试专题

> 高频真题 + 核心答案，按主题归类。答案依据 **ECMA-262 / MDN / W3C** 与主流框架官方文档。

---

## 1. JavaScript / TypeScript

**Q1：var / let / const 的区别？**
- `var`：函数作用域、变量提升（初始化为 undefined）、可重复声明。
- `let` / `const`：块级作用域、暂时性死区（TDZ）、`const` 不能重新赋值。

**Q2：事件循环——宏任务与微任务顺序？**
- 一次宏任务执行完 → 清空所有**微任务**（Promise.then / queueMicrotask）→ 渲染 → 取下一个宏任务（setTimeout / I/O）。
- `Promise` 回调先于 `setTimeout` 执行。

**Q3：深拷贝怎么实现？**
- 简单：`JSON.parse(JSON.stringify(obj))`（丢函数、循环引用、Date 等）。
- 严谨：递归 + `WeakMap` 处理循环引用，或用 `structuredClone()`（现代环境原生支持）。

**Q4：防抖与节流？**
- 防抖：停止触发 wait 后才执行（如搜索联想）。
- 节流：每隔 wait 最多执行一次（如滚动/resize）。下方可运行 Demo：

<iframe src="demos/interview-debounce.html" width="100%" height="200" style="border:1px solid #2c5364;border-radius:8px"></iframe>

---

## 2. Vue 专题

**Q1：Vue2 与 Vue3 响应式原理区别？**
- Vue2：`Object.defineProperty` 劫持已有属性，无法检测新增属性/数组下标，需 `Vue.set`。
- Vue3：`Proxy` 代理整个对象，支持新增/删除，性能与完备性更优。

**Q2：v-for 为什么要 key？**
- Diff 时以 key 标识节点身份，避免复用错误导致状态错乱；不用 key 默认按索引，增删/排序时会出问题。

**Q3：computed 与 watch 区别？**
- `computed`：依赖驱动、带缓存，适合"派生值"。
- `watch`：侦听变化执行副作用，适合"数据变了要做某事"。

---

## 3. React 专题

**Q1：类组件 vs 函数组件 + Hooks？**
- 现在推荐函数组件 + Hooks：更简洁、逻辑复用靠自定义 Hook、无 `this` 困扰。

**Q2：useEffect 依赖数组的作用？**
- 空数组 `[]`：仅挂载时执行一次。
- 省略：每次渲染都执行。
- 有依赖：依赖变化才执行。遗漏依赖会拿到旧闭包值。

**Q3：受控组件 vs 非受控组件？**
- 受控：值由 React state 控制（`value={state}`），单向数据流。
- 非受控：用 `ref` 直接读 DOM（如文件上传），更少重渲染。

=== "Vue vs React 更新机制对比"
    ```
    Vue3：Proxy 自动追踪依赖 → 精确更新对应组件
    React：状态不可变 → 触发组件（及子树）reconcile → Fiber 增量比对
    ```

---

## 4. 工程化 / 网络

**Q1：pnpm 为什么又快又省空间？**
- 全局内容寻址存储 + 硬链接；依赖不重复拷贝，且默认严格隔离（无 phantom 依赖）。

**Q2：Vite 为什么快？**
- 开发态用浏览器原生 ESM，按需编译；用 esbuild（Go 编写）做依赖预构建，冷启动远快于 Webpack。

**Q3：输入 URL 到页面展示的过程？**
- DNS 解析 → 建立 TCP/TLS → 发送 HTTP 请求 → 服务器响应 HTML → 解析 DOM/CSSOM → 渲染树 → 布局/绘制 → 关键资源加载与 JS 执行。

**Q4：浏览器缓存策略？**
- 强缓存：`Cache-Control` / `Expires`，命中不发包。
- 协商缓存：`ETag` / `Last-Modified`，命中返回 304。

---

## 5. 算法 / 手写题

**手写节流（throttle）：**
```js
function throttle(fn, wait) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= wait) { last = now; fn.apply(this, args) }
  }
}
```

**数组扁平化：**
```js
const flat = (arr) => arr.reduce((a, c) => a.concat(Array.isArray(c) ? flat(c) : c), [])
// 或用原生 arr.flat(Infinity)
```

**手写 instanceof：**
```js
function myInstanceof(obj, Ctor) {
  let proto = Object.getPrototypeOf(obj)
  while (proto) {
    if (proto === Ctor.prototype) return true
    proto = Object.getPrototypeOf(proto)
  }
  return false
}
```

---

## 6. 总结

| 主题 | 高频考点 |
|------|----------|
| JS/TS | 作用域、事件循环、深浅拷贝、防抖节流 |
| Vue | 响应式原理、key、computed/watch |
| React | Hooks 规则、useEffect 依赖、受控组件 |
| 工程化/网络 | pnpm、Vite 原理、缓存、渲染流程 |
| 算法 | 手写节流/扁平化/instanceof |

> 知识库各板块已齐备。下一步建议：把本仓库 **部署到 GitHub Pages**（用 `mkdocs gh-deploy`）对外公开访问。
