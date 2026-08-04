# 🟨 JavaScript 核心术语与语言基础

> 本篇系统梳理 JavaScript 的**专业术语**与**语言基础核心用法**，并给出每个特性的**注意事项**与**兼容性方案**。所有解释依据 **ECMA-262（ECMAScript 官方标准，由 Ecma International TC39 制定）**、**MDN Web Docs** 与 **web.dev** 等权威来源。
>
> 适用对象：所有前端岗位。无论你用 Vue / React / 原生，JS 的底层机制都不变——它最终运行在浏览器的 JS 引擎（V8 / SpiderMonkey / JavaScriptCore）里。

---

## 一、专业术语速查（先对齐概念）

| 术语 | 英文 | 一句话定义 | 规范来源 |
|------|------|-----------|---------|
| 执行上下文 | Execution Context | 代码执行的"环境容器"，保存变量与作用域信息 | ECMA-262 |
| 词法环境 | Lexical Environment | 存储变量/函数绑定（声明）的复合结构，含外部环境引用 | ECMA-262 |
| 作用域 | Scope | 变量可被访问的代码区域（全局/函数/块级） | ECMA-262 |
| 作用域链 | Scope Chain | 查找变量时沿词法环境逐级向上的链条 | ECMA-262 |
| 闭包 | Closure | 函数捕获其定义时的词法环境，使外部变量可长期存活 | ECMA-262 |
| 变量提升 | Hoisting | `var`/`function` 声明在编译阶段被提升到作用域顶部 | ECMA-262 |
| 暂时性死区 | TDZ | `let`/`const` 声明前访问会抛 `ReferenceError` 的窗口期 | ECMA-262 |
| `this` 绑定 | This Binding | 函数调用时动态确定的上下文对象，遵循 5 条规则 | ECMA-262 |
| 原型 | Prototype | 每个对象内置的 `[[Prototype]]`，用于属性查找 | ECMA-262 |
| 原型链 | Prototype Chain | 沿 `[[Prototype]]` 逐级向上查找属性的链条 | ECMA-262 |
| 事件循环 | Event Loop | 协调调用栈与任务队列、实现非阻塞异步的机制 | HTML/ECMA 事件模型 |
| 调用栈 | Call Stack | 记录函数调用次序的栈结构（LIFO） | 引擎实现 |
| 宏任务 | Macro-task | `setTimeout`/`setInterval`/I/O/UI 渲染等粗粒度任务 | HTML 规范 |
| 微任务 | Micro-task | `Promise.then`/`queueMicrotask`/`MutationObserver` | HTML 规范 |
| 单线程 | Single-threaded | JS 主线程同一时间只执行一段代码 | 引擎实现 |
| 一等公民函数 | First-class Function | 函数可作变量、参数、返回值被对待 | — |
| 高阶函数 | Higher-order Function | 接收或返回函数的函数 | — |
| 纯函数 | Pure Function | 同输入同输出、无副作用的函数 | — |
| 柯里化 | Currying | 把多参函数转为依次接收单参的函数链 | — |
| 防抖 | Debounce | 事件停止触发 N 毫秒后才执行 | — |
| 节流 | Throttle | 每隔 N 毫秒最多执行一次 | — |
| 浅拷贝 | Shallow Copy | 只复制第一层引用，嵌套对象仍共享 | — |
| 深拷贝 | Deep Copy | 递归复制所有层级，与原对象完全独立 | — |
| 值类型 | Primitive | `string`/`number`/`boolean`/`null`/`undefined`/`symbol`/`bigint`，按值存储 | ECMA-262 |
| 引用类型 | Reference | `object`/`array`/`function`，按引用（堆地址）存储 | ECMA-262 |
| 类型转换 | Type Coercion | 不同数据类型间的自动/手动转换 | ECMA-262 |

!!! tip "怎么用这张表"
    看到不懂的词先在这里查；遇到"样式/逻辑不生效"优先怀疑**闭包、`this`、事件循环、类型转换**这四类。

---

## 二、语言基础核心用法 + 注意事项 + 兼容方案

### 1. 变量声明：`var` / `let` / `const`

```js
var a = 1;        // 函数作用域、可重复声明、可提升（初始化为 undefined）
let b = 2;        // 块级作用域、不可重复声明、存在 TDZ
const c = 3;      // 块级作用域、必须初始化、绑定不可重新赋值（≠ 对象内部不可改）
```

| 维度 | `var` | `let` | `const` |
|------|-------|-------|---------|
| 作用域 | 函数级 | 块级 | 块级 |
| 重复声明 | 允许 | 禁止 | 禁止 |
| 提升 | 提升且初始化 `undefined` | 提升但 TDZ | 提升但 TDZ |
| 重新赋值 | 允许 | 允许 | 禁止 |

!!! danger "常见坑"
    - `const` 只保证**绑定不变**，对象/数组内部仍可修改：`const o = {x:1}` → `o.x = 2` 合法；要冻结用 `Object.freeze`（浅冻结）。
    - **永远优先用 `const`，需要重新赋值才用 `let`，禁止 `var`**（ESLint `no-var`）。
    - `for` 循环里用 `let` 才能让每次迭代拿到独立绑定（闭包经典题）。

**兼容性**：`let`/`const` 属 **ES2015 (ES6)**，现代浏览器全支持；IE 完全不支持 → 用 Babel 降级为 `var` + IIFE。

### 2. 解构赋值（Destructuring）

```js
const [x, , z] = [1, 2, 3];            // x=1, z=3（跳过中间）
const { name, age = 18 } = user;      // 带默认值
const { profile: { avatar } } = user; // 嵌套解构
const { id: userId } = user;          // 重命名
function fn({ a, b = 0 } = {}) {}     // 函数参数解构 + 默认
```

!!! warning "注意事项"
    - 解构 `undefined`/`null` 会抛 `TypeError`：`const {a} = null` ❌。
    - 解构数组对"类数组"需先转数组（`Array.from` / 扩展运算符）。
    - 过度嵌套解构可读性差，建议嵌套不超过 2 层。

**兼容**：ES2015，IE 不支持 → Babel 降级。

### 3. 模板字符串（Template Literals）

```js
const msg = `Hello ${name}, age=${age}`;     // 插值
const html = `<div class="${cls}">${text}</div>`;
const multi = `line1
line2`;                                       // 多行字符串
const tag = (strings, ...vals) => vals;      // 标签模板（styled-components 原理）
```

!!! warning "注意事项"
    - 拼接 HTML 时必须转义插值变量，防止 **XSS**（见安全章节）。
    - 标签模板的 `strings` 是"静态片段数组"，`vals` 是插值数组。

**兼容**：ES2015，IE 不支持 → Babel；标签模板同样需降级。

### 4. 展开 / 剩余运算符（Spread / Rest）

```js
const arr = [...a, ...b];          // 展开数组（浅拷贝）
const obj = { ...o1, ...o2 };      // 展开对象（ES2018，后者覆盖前者）
const merged = { ...o, x: 1 };     // 覆盖/新增字段
function sum(...args) {}           // 剩余参数收集为数组
const [first, ...rest] = arr;      // 剩余解构
```

!!! warning "注意事项"
    - 对象展开是**浅拷贝**，`{...o}` 只复制自身可枚举属性，不复制原型方法、`getter` 注意触发。
    - 展开大量数据性能差（O(n) 复制），超大数组别滥用。
    - 剩余参数必须放在参数列表**最后**。

**兼容**：数组展开 ES2015；对象展开 **ES2018** → Babel `@babel/plugin-proposal-object-rest-spread`；剩余参数 IE 不支持。

### 5. 默认参数（Default Parameters）

```js
function greet(name = 'Guest', opts = {}) {}
```

!!! warning "注意"
    - 默认参数在执行时求值（每次调用重新计算），`function f(x = [])` 每次得到新数组。
    - 默认参数会创建独立作用域，且会**改变 `arguments` 与形参的关联行为**（严格模式下 `arguments` 不再随形参变化）。

**兼容**：ES2015 → Babel。

### 6. 箭头函数（Arrow Function）

```js
const add = (a, b) => a + b;          // 单表达式隐式返回
const fn = x => ({ key: x });         // 返回对象需加括号
const noop = () => {};                // 无参
```

| 特性 | 普通函数 | 箭头函数 |
|------|---------|---------|
| `this` | 动态绑定（调用时决定） | **词法捕获**外层 `this` |
| `arguments` | 有 | **无**（用剩余参数替代） |
| `new` | 可作构造函数 | **不能** `new`（无 `[[Construct]]`） |
| `prototype` | 有 | 无 |
| 用作方法 | 需注意 `this` | 适合回调，不适合对象方法 |

!!! danger "致命坑"
    - **箭头函数不能用 `new`**，否则 `TypeError: not a constructor`。
    - **不要用箭头函数定义对象方法**，因为 `this` 会捕获外层（常是 `undefined` 或 `window`），导致 `this` 错乱；对象方法用普通函数或类。
    - DOM 事件回调若需在回调里用 `this` 指向元素，用普通函数或 `e.currentTarget`。

**兼容**：ES2015 → Babel。

### 7. 数组高阶方法（必会）

```js
[1,2,3].map(x => x*2);                 // 映射（返回新数组）
.filter(x => x>1);                     // 过滤
.reduce((sum, x) => sum + x, 0);       // 累积
.forEach(x => {});                     // 遍历（无返回，仅副作用）
.find(x => x>1);                       // 首个匹配元素
.findIndex(x => x>1);                  // 首个匹配索引
.some(x => x>1);                       // 存在即 true
.every(x => x>1);                      // 全部满足
.flat(Infinity);                       // 扁平化（ES2019）
.flatMap(x => [x, x*2]);               // map + 一层 flat（ES2019）
.includes(2);                          // 是否包含（ES2016，替代 indexOf）
.at(-1);                               // 倒数第 1 个（ES2022）
```

!!! warning "注意事项"
    - `map` 必须 return，否则得到 `[undefined,...]`；也要用 `map` 别用 `forEach` 做转换。
    - `reduce` 不传初始值会对空数组抛错，且首轮 `acc` 为第一项——**始终传初始值**更安全。
    - `flat`/`flatMap`/`at` 是较新特性，老浏览器需 polyfill（`core-js`）。

**兼容**：`map/filter/reduce/forEach` ES5（全支持）；`flat/flatMap` ES2019、`includes` ES2016、`at` ES2022 → `core-js`。

### 8. 对象方法与静态方法

```js
Object.keys(o); Object.values(o); Object.entries(o);   // 键/值/键值对（ES2015/2017）
Object.assign({}, a, b);                                // 浅合并（ES2015）
Object.freeze(o); Object.seal(o);                       // 冻结/密封
Object.hasOwn(o, 'x');                                  // 自有属性判断（ES2022，替代 hasOwnProperty）
Object.is(NaN, NaN);                                    // 严格相等修正（ES2015，区分 +0/-0）
```

!!! warning "注意"
    - `Object.assign` 是**浅拷贝**，且会触发 `setter`。
    - `Object.freeze` 只浅冻结；深层冻结需递归。
    - 用 `Object.hasOwn` 替代 `obj.hasOwnProperty`（避免对象自身覆盖 `hasOwnProperty` 方法）。

**兼容**：`assign/freeze` ES2015；`values/entries` ES2017；`hasOwn` ES2022 → `core-js`。

### 9. 可选链 `?.` 与空值合并 `??`

```js
const city = user?.address?.city;        // 任一环节为 null/undefined 短路返回 undefined
const n = value ?? 10;                    // 仅 null/undefined 时用默认值（区别于 ||）
const fn = obj.method?.();               // 方法存在才调用
```

!!! danger "关键区别 `??` vs `||`"
    - `||` 把 `0`、`''`、`false` 都当假值；`??` **只**在 `null`/`undefined` 时兜底。
    - `0 ?? 10` → `0`；`0 || 10` → `10` —— 数字/字符串字段必须用 `??`。
    - `??` 不能和 `||`/`&&` 直接混用（语法错误），需加括号：`a ?? (b || c)`。

**兼容**：`?.`/`??` 属 **ES2020** → Babel `@babel/plugin-proposal-optional-chaining` / `nullish-coalescing`，现代浏览器（Chrome 80+/）支持。

### 10. 类（Class）

```js
class Animal {
  #secret = 1;                 // 私有字段（ES2022，外部访问报错）
  static count = 0;            // 静态字段
  constructor(name) { this.name = name; }
  speak() { return `${this.name}...`; }
}
class Dog extends Animal {
  constructor(name) { super(name); }   // 必须先 super 才能用 this
  speak() { return super.speak() + ' wang'; }
}
```

!!! warning "注意事项"
    - `super()` 必须在访问 `this` 前调用（extends 子类强制）。
    - `class` 本质是**原型继承的语法糖**，方法在原型上、非枚举；`typeof Class === 'function'`。
    - 类声明**不会提升**（TDZ），不能在定义前 `new`。
    - 私有字段 `#x` 在类外完全不可见，也不可被 JSON 序列化。

**兼容**：class ES2015（含 extends）→ Babel（含私有字段需 `@babel/plugin-proposal-class-properties`）；`#私有字段` ES2022 较新需 polyfill。

### 11. 模块化（ESM）

```js
// math.js
export const add = (a,b) => a+b;
export default function() {}
// app.js
import def, { add } from './math.js';   // 默认 + 命名导入
import * as mod from './math.js';        // 命名空间导入
import('lodash.js').then(m => {});       // 动态 import（返回 Promise，代码分割）
export { add as plus };                  // 重导出
```

!!! danger "ESM vs CommonJS 关键差异"
    - ESM 是**静态**的（编译期确定依赖，`import` 必须顶层）；CJS `require` 是动态的。
    - ESM `export` 是**绑定（活引用）**，CJS 导出的是值的拷贝。
    - 浏览器原生 ESM 必须加文件后缀 `.js` 且服务器返回正确 MIME（`text/javascript`）。
    - 不可混用：`import` 不能用在 `if` 里；动态 `import()` 可以。

**兼容**：原生 ESM 需 Chrome 61+/Safari 11+ 等现代浏览器；IE 不支持 → 用打包器（Vite/Webpack/Rollup）或 `@babel/preset-env`。

---

## 三、兼容性总方案（基础特性）

| 特性 | ES 版本 | IE | 现代浏览器 | 降级手段 |
|------|---------|----|-----------|---------|
| `let`/`const`/`=>`/解构/类/模板/默认参数 | ES2015 | ❌ | ✅ | Babel + `@babel/preset-env` |
| `Object.values/entries` | ES2017 | ❌ | ✅ | `core-js` |
| `Array.includes`/`**` | ES2016 | ❌ | ✅ | `core-js` |
| `Object spread`/`async` | ES2018 | ❌ | ✅ | Babel |
| `flat`/`flatMap`/`fromEntries` | ES2019 | ❌ | ✅ | `core-js` |
| `??`/`?.`/`Promise.allSettled` | ES2020 | ❌ | ✅(80+) | Babel |
| `Object.hasOwn`/`Array.at`/`#私有` | ES2022 | ❌ | ✅(很新) | `core-js` + Babel |

**工程化标准做法**（详见 JS-2 进阶兼容章节）：

```js
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: '> 0.5%, last 2 versions, not dead',
      useBuiltIns: 'usage',   // 按需引入 polyfill
      corejs: 3,
    }],
  ],
};
```

!!! tip "前端兼容三件套"
    1. **语法降级**：Babel / esbuild / SWC 把新语法编译成 ES5。
    2. **API 补全**：`core-js` 提供 `Promise`/`Array.prototype.flat` 等 polyfill。
    3. **查询依据**：动手前查 [Can I Use](https://caniuse.com)，不凭记忆。
