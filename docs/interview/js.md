# ⚙️ JavaScript 面试题

> 作用域、事件循环、深浅拷贝、防抖节流、原型链、闭包、继承、手写题。依据 **[ECMA-262](https://tc39.es/ecma262/)**、**[MDN JS](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)**。覆盖大厂高频核心题。

---

## 1. 基础

#### Q1：var / let / const 的区别？
- `var`：函数作用域、变量提升（初始化为 undefined）、可重复声明。
- `let` / `const`：块级作用域、**暂时性死区（TDZ）**、不可重复声明；`const` 是绑定不可变（对象属性仍可改）。

#### Q2：什么是闭包？有什么用？会引起内存泄漏吗？
- 闭包：内层函数捕获其词法作用域的变量，外层函数返回后仍可访问。
- 三要素：外层嵌套内层、内层引用外层变量、外层返回内层。
- 用途：私有变量、函数工厂、防抖节流、柯里化。
- 内存泄漏：若闭包长期持有大对象/DOM 且不释放，会导致无法回收；常见于**未清除的定时器**、**事件监听未解绑**、**全局缓存**。解除引用即可避免。

#### Q3：事件循环——宏任务与微任务顺序？
- 流程：**同步任务** → 清空所有**微任务**（Promise.then / queueMicrotask / async 后续）→ 渲染 → 取下一个宏任务（setTimeout / setInterval / I/O / UI 事件）。
- `Promise` 回调先于 `setTimeout` 执行。
- 示例输出顺序 `1 → 4 → 3 → 2`：
```js
console.log(1)
setTimeout(() => console.log(2), 0)
Promise.resolve().then(() => console.log(3))
console.log(4)
```

#### Q4：原型链与继承？
- 每个对象有 `__proto__` 指向构造函数的 `prototype`，层层上溯到 `Object.prototype` → null。
- 属性查找沿原型链向上；`instanceof` 基于原型链判断。
- ES6 `class` 是语法糖，底层仍是原型继承；`extends` 通过 `super()` 调父类构造。

#### Q5：`this` 的绑定规则（4 条）？
- 默认绑定（严格模式 undefined，否则 window）→ 隐式绑定（调用对象）→ 显式绑定（call/apply/bind）→ `new` 绑定（新对象）。箭头函数无自身 `this`，取外层。
- 优先级：`new` > 显式 > 隐式 > 默认。

---

## 2. 进阶

#### Q6：深拷贝怎么实现？
- `JSON.parse(JSON.stringify(obj))`：丢函数、undefined、Date、RegExp、循环引用。
- `structuredClone()`：原生、支持更多类型，但不支持函数/DOM。
- 手写递归 + `WeakMap` 处理循环引用最稳妥。

#### Q7：防抖与节流？手写？
- 防抖：`wait` 内再次触发则重置计时，停止 `wait` 后才执行（搜索联想、按钮防重复提交）。
- 节流：每隔 `wait` 最多执行一次（滚动、resize、拖拽）。
```js
function debounce(fn, wait) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait) }
}
function throttle(fn, wait) {
  let last = 0
  return (...args) => {
    const now = Date.now()
    if (now - last >= wait) { last = now; fn.apply(this, args) }
  }
}
```

#### Q8：Promise 与 async/await？
- `Promise` 解决回调地狱；`async` 函数返回 Promise，`await` 暂停等待决议。
- `await` 后面的代码等价于 `.then` 回调（进微任务队列）。
- 错误处理：`try/catch` 捕获 rejected，或 `.catch`。

#### Q9：0.1 + 0.2 !== 0.3 为什么？怎么解决？
- 浮点数按 IEEE 754 二进制存储，0.1/0.2 无法精确表示，相加有精度误差。
- 解决：`Number((a+b).toFixed(2))`、`Math.round((a+b)*100)/100`、或 `BigInt` 处理整数分。

#### Q10：JS 数据类型有哪些？如何判断？
- 基本：`string` `number` `boolean` `null` `undefined` `symbol` `bigint`。
- 引用：`object`（含 array/function/date 等）。
- 判断：`typeof`（基本类型，null 误判 object）、`instanceof`（引用、原型链）、`Array.isArray`、`Object.prototype.toString.call`（最准，得 `[object Type]`）。

#### Q11：ES6+ 高频新特性？
- `let/const`、箭头函数、解构、模板字符串、扩展运算符、默认参数、Promise、模块化、可选链 `?.`、空值合并 `??`、动态 `import()`、顶级 await。

---

## 3. 手写题（大厂必考）

#### 手写 instanceof：
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

**手写 Promise.all：**
```js
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const res = []; let count = 0
    if (promises.length === 0) return resolve(res)
    Promise.all 每个决议按顺序存入，全部完成 resolve，任一 reject 则 reject。
    // 略写：遍历 promise.then(v => { res[i]=v; if(++count===promises.length) resolve(res) }).catch(reject)
  })
}
```

#### 数组去重：
```js
const unique = arr => [...new Set(arr)]
// 对象数组按 key：Map 或 reduce
```

#### 数组扁平化：
```js
const flat = arr => arr.reduce((a, c) => a.concat(Array.isArray(c) ? flat(c) : c), [])
// 或 arr.flat(Infinity)
```

#### 实现 `new`：
```js
function myNew(Ctor, ...args) {
  const obj = Object.create(Ctor.prototype)
  const ret = Ctor.apply(obj, args)
  return ret instanceof Object ? ret : obj
}
```

---

## 4. 下一步

- 类型相关看 [TypeScript 面试题](ts.md)。
- 底层机制看 [源码原理面试题](source-code.md)。
