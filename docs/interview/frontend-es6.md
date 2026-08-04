# ✨ ES6+ 面试题

> ES6（ES2015）到最新 ES 特性的面试全集。这是「现代 JS 功底」的核心考察点。答案依据 **[ECMA-262](https://tc39.es/ecma262/)**、**[MDN ES6](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/New_in_JavaScript/ECMAScript_2015)**、**[TC39 提案](https://github.com/tc39/proposals)**。

---

## 1. ES6 核心语法

#### Q1：let / const / var 区别？（含 TDZ）
- `var`：函数作用域、提升（初始化 undefined）、可重复声明。
- `let/const`：块级作用域、暂时性死区（TDZ）、`const` 绑定不可重赋（对象内部可改）。全局 `let/const` 不挂 `window`。

#### Q2：箭头函数 vs 普通函数的 5 个区别？
- 没有自己的 `this`（取外层词法 this）；不能做构造函数（`new` 报错）；没有 `arguments`（用 rest）；没有 `prototype`；不能作为 generator（除非 `function*` 普通函数）。

#### Q3：模板字符串与标签模板？
- `` `hello ${name}` `` 支持多行、插值。
- 标签模板：`tag\`a${x}b\`\`` 可拦截字符串拼接（用于 i18n、SQL 防注入、styled-components）。

#### Q4：解构赋值（数组/对象/默认值/剩余）？
```js
const { a, b = 1, ...rest } = obj;     // 对象解构 + 默认值 + 剩余
const [first, , third, ...tail] = arr; // 数组解构（跳过/剩余）
```

#### Q5：扩展运算符 `...` 与 rest 参数？
- 函数参数：`function f(...args)` 收集为数组（替代 arguments）。
- 数组/对象展开：`[...a, ...b]`、`{ ...a, b: 1 }`（浅拷贝）。

## 2. 模块化

#### Q6：ES Module 与 CommonJS 区别？
- ESM：`import/export`，**静态**（编译期确定依赖）、值**实时绑定**（只读引用）、浏览器原生、支持 Tree Shaking。
- CJS：`require/module.exports`，**动态**、值拷贝（缓存）、Node 早期默认。
- 注意：ESM 里 `import` 的变量是「活绑定」，改了能同步看到；CJS 是快照拷贝。

#### Q7：import 与 require 的执行时机差异？
- ESM 先全部解析依赖再执行（循环依赖更安全，用 live binding 兜底）。
- CJS `require` 是运行时执行，循环依赖会拿到未初始化完的半截对象。

## 3. 异步演进

#### Q8：Promise 的三种状态与常用静态方法？
- `pending/fulfilled/rejected`；一旦落定不可变。
- `Promise.all`（一败全败）、`allSettled`（都要结果）、`race`（谁先）、`any`（谁先成功）、`resolve/reject`。

#### Q9：async/await 错误处理最佳实践？
- `try/catch` 包 `await`；或 `await p.catch(err => ...)` 兜底。
- 多个独立请求用 `Promise.all` 并发，别串行 `await` 拖慢。

#### Q10：Generator 与 async 的关系？
- `async/await` = Generator + 自动执行器(co) + Promise 的语法糖；Generator 需手动 `next()` 驱动。

## 4. ES2017+ 新特性

#### Q11：Object 新方法（entries / values / fromEntries / 可选链 / 空值合并）？
- `Object.entries(obj)` → `[[k,v]]`；`Object.fromEntries()` 逆操作。
- **可选链 `?.`**：`a?.b?.c` 短路防报错。
- **空值合并 `??`**：仅 `null/undefined` 时取右值（区别于 `||` 把 `0/''/false` 也当假）。

#### Q12：Nullish 合并 `??` 与 `||` 的区别？（高频坑）
- `0 || 5` → 5（0 被当假）；`0 ?? 5` → 0（只有 null/undefined 才回退）。
- 配置默认值用 `??` 更安全。

#### Q13：BigInt 与 Number 边界？
- `Number` 安全整数 `[-2^53, 2^53]`；超出用 `BigInt`（`123n`），订单号/雪花 ID 推荐用。

#### Q14：动态 import() 与代码分割？
- `const mod = await import('./mod.js')` 运行时按需加载，是路由级懒加载的基础；返回 Promise。

#### Q15：数组新方法（flat / flatMap / at / Array.from / includes）？
- `flat(depth)` 扁平化、`flatMap` 映射+扁平、`at(-1)` 倒数、`Array.from({length})` 造数组、`includes` 替代 `indexOf>-1`。

## 5. 元编程与进阶

#### Q16：Proxy 与 Reflect 的用法？
- `Proxy` 拦截对象操作（get/set/apply 等），Vue3 响应式基石。
- `Reflect` 提供默认行为的函数式调用，与 Proxy 陷阱一一对应，避免 `this` 问题。

#### Q17：Symbol 的用途？
- 唯一 key（防属性冲突）；内置 Symbol（`Symbol.iterator`、`Symbol.asyncIterator`、`Symbol.toStringTag`）；可定义元操作（如自定义 `for...of`）。

## 6. 下一步

- 手写题看 [前端经典面试题](frontend-classic.md)；原理看 [前端核心面试题](frontend-core.md)。
- 异步与事件循环深入看 [前端高频面试题](frontend-high-freq.md)。
