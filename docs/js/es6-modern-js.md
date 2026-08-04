# 🚀 ES6+ 现代 JavaScript 特性大全（核心语法 · 新版本 · 兼容性）

> 接续 [数据结构与算法 JS 实现](dsa-js.md)。本篇是 **ES6（ES2015）到 ES2024 所有常用核心语法与 API 的系统清单**——从 `let/const`、箭头函数到 `?.`、`??`、`Array.group`、装饰器，每个特性配**实战代码 + 兼容性标注 + 死角提醒**。依据 **ECMA-262（各 Edition）**、**MDN**、**web.dev**。
>
> 适用：**全等级**——新人照表学语法、中级查漏补缺、高级确认兼容性与降级策略。建议配合 [JS 基础](foundation.md) 与 [JS 高级进阶](advanced-topics.md) 食用。

!!! info "版本速记"
    "ES6 = ES2015"。之后 TC39 改为**逐年发布**（ES2016/2017…），小特性逐年递增。本文按"ES6 核心 → 后续版本增量"组织。

---

## 一、ES6（ES2015）核心语法

### 1.1 let / const 与块级作用域

```js
let x = 1; x = 2;            // 可改，块级作用域
const PI = 3.14;             // 绑定不可重赋值（非内容不可变）
if (true) { let y = 1; }     // y 仅在块内可见
```

!!! danger "死角 1：const 不是 immutable"
    `const obj = {a:1}` 仍可 `obj.a = 2`；要深冻结用 `Object.freeze` + 递归。另：暂存性死区（TDZ）——`let/const` 声明前访问抛 `ReferenceError`。

### 1.2 箭头函数

```js
const add = (a, b) => a + b;
const fn = x => x * 2;        // 单参省括号
const noop = () => {};
```
- **不绑定自身 `this`**（继承外层）、无 `arguments`、不能作构造函数。

!!! danger "死角 2：箭头函数别用在对象方法/类方法需要 this 处"
    对象字面量里 `method: () => this.x` 的 `this` 指向外层而非对象。需要 `this` 用普通函数或类方法。

### 1.3 模板字符串

```js
const hi = `Hello ${name}, age ${age + 1}`;
const multi = `line1
line2`;
```
支持标签模板：`tag\`...\``（国际化/防 XSS 转义场景）。

### 1.4 解构赋值

```js
const { a, b: c } = obj;            // 对象解构 + 改名
const [first, , third] = arr;       // 数组解构
const [head, ...rest] = arr;        // 剩余
function f({ id, name = '匿名' }) {} // 参数解构 + 默认值
```

### 1.5 默认 / 剩余 / 展开

```js
function f(a, b = 1, ...rest) {}
const merged = [...arr1, ...arr2];
const clone = { ...obj };
```

!!! danger "死角 3：展开是浅拷贝"
    `{...obj}` 只复制一层；嵌套对象共享引用。深拷贝用 `structuredClone`（见 2.x）或递归。

### 1.6 类（class）

```js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes sound`; }
  static kind = 'animal';
}
class Dog extends Animal {
  speak() { return `${this.name} barks`; }   // 重写
}
```
语法糖，本质是原型继承。字段声明、私有字段 `#x` 见 ES2022。

### 1.7 模块（ESM）— 完整语法与陷阱见下方"三、模块系统详解"

```js
export const a = 1;
export default function () {};
import a, { b } from './m.js';
import('./lazy.js').then(m => {});   // 动态
```
完整循环依赖/Tree-shaking/互操作见下方"三、模块系统详解"。

### 1.8 Symbol / 迭代器 / Generator

```js
const s = Symbol('desc');                 // 唯一 key，避免属性冲突
const it = { [Symbol.iterator]() { /*...*/ } };
function* gen() { yield 1; yield 2; }     // 可暂停函数
```

### 1.9 Promise

```js
const p = new Promise((resolve, reject) => resolve(1));
p.then(v => v + 1).catch(e => {}).finally(() => {});
Promise.all([p1, p2]); Promise.race([p1, p2]);
```
详见 [JS 高级进阶·异步](advanced-topics.md)。

### 1.10 Proxy / Reflect

```js
const p = new Proxy(obj, { get(t, k) { return t[k]; } });
Reflect.get(obj, k);     // 配套反射 API
```
Vue3 响应式基石（见 [设计模式·代理](design-patterns.md)）。

### 1.11 新数据结构

```js
const set = new Set([1,2,2]);        // 去重，{1,2}
const map = new Map(); map.set(k, v);
const wm = new WeakMap();             // key 为对象，可被回收
const ws = new WeakSet();
```

### 1.12 ES6 新增 API 速查

| API | 作用 |
|-----|------|
| `Array.from(iterable)` | 类数组/可迭代 → 真数组 |
| `Array.of(1,2)` | 避免 `new Array(n)` 歧义 |
| `arr.find / findIndex` | 按条件找 |
| `arr.includes` | 含值判断（ES2016 正式但常归 ES6 讨论） |
| `Object.assign` | 浅合并 |
| `Object.is(a,b)` | 更严等的相等（`NaN`/`+0/-0`） |
| `String.raw / repeat` | 原始字符串 / 重复 |
| `Number.isNaN / isFinite` | 不自动转型的判据 |
| `Math.trunc / sign / hypot` | 数学工具 |
| `RegExp` `u`(unicode)/`y`(sticky) | 正则新修饰符 |

---

## 二、ES2016 – ES2024 新特性（按版本）

> 兼容性图例：✅ 全面支持（现代浏览器+Node 14+）｜⚠️ 需较新环境（标注最低版本）｜🔧 旧环境需 Babel/TS 降级

### ES2016
- **指数运算符 `**`**：`` 2 ** 3 === 8 `` ✅
- **`Array.prototype.includes`**：`[1,2].includes(2)` ✅（替代 `indexOf>-1`）

### ES2017
- **`async` / `await`**：基于 Promise 的同步写法 ⚠️ Node 7.6+/浏览器 2017+，现已 ✅
- **`Object.values / entries`**：`Object.values({a:1})` → `[1]` ✅
- **`Object.getOwnPropertyDescriptors`**：精确拷贝 getter/setter ✅
- **字符串填充 `padStart / padEnd`**：`'5'.padStart(2,'0')` → `'05'` ✅

### ES2018
- **异步迭代 `for await...of`** + **`AsyncIterator`** ⚠️ Node 10+ ✅
- **rest/spread 属性（对象）**：`const {a, ...rest} = obj` ✅
- **`Promise.prototype.finally`** ✅
- **正则 `s`(dotAll) / 命名捕获组 `(?<name>)` / `lookbehind`** ⚠️ 命名组 Node 10+ ✅

### ES2019
- **`Array.prototype.flat / flatMap`**：`[1,[2]].flat()` → `[1,2]` ✅
- **`Object.fromEntries`**：`Map` → 对象逆操作 ✅
- **`String.prototype.trimStart / trimEnd`** ✅
- **`Symbol.prototype.description`** ✅
- **`Array.prototype.sort` 稳定排序**（规范强制）✅

### ES2020
- **可选链 `?.`**：`a?.b?.c` 自动短路 ✅（高频）
- **空值合并 `??`**：`a ?? '默认'`（仅 null/undefined 触发，区别于 `||`）✅（高频）
- **`BigInt`**：`123n` 大整数，超 `Number.MAX_SAFE_INTEGER` ⚠️ Node 10.4+/Chrome 67+ ✅
- **`globalThis`**：跨环境统一全局对象 ✅
- **动态 `import()` 标准化** ✅
- **`Promise.allSettled`**：等全部落定（不论成败）✅
- **`String.prototype.matchAll`** ✅

!!! danger "死角 4：`??` 与 `||` 的语义差"
    `0 ?? 1` → `0`（0 不是 null/undefined）；`0 || 1` → `1`。别用 `||` 设默认值处理"0/空串"——它们本是有效值。且 `??` 不能和 `||`/`&&` 直接混用，需加括号。

### ES2021
- **`String.prototype.replaceAll`**：`s.replaceAll('a','b')` ✅
- **`Promise.any`**：任一成功即resolve（全失败才 reject `AggregateError`）✅
- **逻辑赋值 `&&= ||= ??=`**：`a ??= b`（a 为 null/undefined 才赋值）✅
- **数值分隔符 `1_000_000`** ✅
- **`WeakRef` / `FinalizationRegistry`**（高级：弱引用，慎用）⚠️ 已支持但需谨慎

### ES2022
- **类字段声明 + 私有字段 `#x`**：`class { #secret = 1; #fn(){} }` ✅
- **类静态块 `static {}`** ✅
- **类公共/私有静态成员、`static #x`** ✅
- **`Object.hasOwn(obj, key)`**：替代 `Object.prototype.hasOwnProperty.call` ✅
- **`Array.prototype.at`**：`arr.at(-1)` 取末尾（负数索引）✅
- **顶层 `await`**（模块顶层）⚠️ Node 14.8+/现代浏览器 ✅
- **`error.cause`**：`new Error('x', { cause })` 链式错误 ✅
- **正则 `d` 标志（indices）**：返回匹配位置 ✅

### ES2023
- **`Array.prototype.findLast / findLastIndex`** ✅
- **`Array.prototype.toSorted / toReversed / toSpliced`**（不改原数组）✅
- **`Array.prototype.with(index, val)`** ✅
- **`WeakMap` 支持 `Symbol` 作 key** ✅

### ES2024
- **`Array.prototype.group / groupToMap`**：按条件分组 ✅（Chrome 117+/Node 21+）
- **`Array.fromAsync`**：异步可迭代 → 数组 ✅
- **`Object.groupBy / Map.groupBy`**（静态分组）✅
- **`String.prototype.isWellFormed / toWellFormed`**（UTF-16 合法性）✅
- **`RegExp` `v` 标志（unicodeSets）**：更强大的字符类 ✅
- **装饰器（Decorators）正式标准化**（Stage 4）：见 [设计模式·装饰器](design-patterns.md) ⚠️ 需新版 TS/构建链（Node 22+/Chrome 121+）

!!! tip "兼容性查询习惯"
    上线前用 **[Can I Use](https://caniuse.com)** 查具体特性；编译目标用 `Browserslist` + `Babel`/`TypeScript` 自动降级（见 [工程化](../engineering/index.md)）。

---

## 三、模块系统详解（ESM 完整版）

> 原独立专题并入此节，保证 ES6 知识在一篇闭环。

### 3.1 基础语法
```js
export const a = 1;                         // 具名
export default function () {};             // 默认（每模块一个）
import a, { b } from './m.js';             // default 在前
import { x as y } from './m.js';           // 改名
export * from './m.js';                    // 透传
```
!!! danger "死角 5：具名导入必须 `{}`，default 不能 `{}`"
    `import x from` ≠ `import { x } from`；浏览器原生 ESM **路径必须带 `.js`**。

### 3.2 动态导入与 Tree-shaking
```js
const m = await import('./lazy.js');       // 代码分割
```
Tree-shaking 依赖**静态 ESM 具名导出**；`export default { x, unused }` 无法摇掉 `unused`。打包工具据此优化（见 [性能总纲](../performance.md)）。

### 3.3 循环依赖
- **CJS**：返回部分构造对象（undefined 不报错但逻辑错）。
- **ESM**：live binding，未初始化访问抛 `ReferenceError`（TDZ），更早暴露。规避：函数内访问 / 抽第三模块。

### 3.4 Node 互操作
`package.json` 加 `"type": "module"`；CJS→ESM 用动态 `import()`（CJS 无静态 import）。

---

## 四、兼容性与降级策略（全等级必读）

| 场景 | 建议 |
|------|------|
| 现代浏览器 + Node 18+ | 直接用 ES2022+ 全部特性（可选链、`??`、私有字段、`at`、`group`） |
| 需支持 IE11 / 旧安卓 | Babel 全量降级 + 核心 JS polyfill（`core-js`） |
| 只需兼容近 2 年浏览器 | 开 `target: 'es2020'`，仅降级装饰器/部分 ES2024 |
| 类型项目 | TS `target` + `lib` 指定，编译期即报不兼容 API |

!!! danger "死角 6：特性可用 ≠ 类型可用"
    TS 即使 `target` 低，若 `lib` 不含对应 ES 版本，调用 `arr.at(-1)` 仍报类型错。需同步升级 `lib: ["ES2022"]`。

!!! warning "安全关联"
    降级 polyfill 会注入代码，注意来源可信（避免供应链投毒，见 [前端安全全集](../security/index.md)）。

---

## 五、ES6+ 自检清单

- [ ] 区分 `let/const` 与 `var`、理解 TDZ 与 const 非 immutable
- [ ] 箭头函数不绑定 `this`、不能用 `arguments`
- [ ] 解构/展开/剩余的正确用法与浅拷贝陷阱
- [ ] `?.` 与 `??` 的语义（vs `&&`/`||`）
- [ ] `BigInt` 适用场景与 `globalThis`
- [ ] `Array` 新 API：`flat`/`at`/`group`/`toSorted` 及兼容性
- [ ] 类私有字段 `#x`、静态块、顶层 await
- [ ] ESM 导入语法 + 循环依赖 + Tree-shaking 原理
- [ ] 会用 Can I Use + Babel/TS 做兼容性降级

> 衔接：语法基础见 [JS 基础](foundation.md)；异步/Proxy/迭代器深入见 [JS 高级进阶](advanced-topics.md)；类型层 ES 版本见 [TS 高级](../ts/terminology-advanced.md)；打包降级见 [工程化](../engineering/index.md)；性能优化见 [性能总纲](../performance.md)；运行时安全见 [前端安全全集](../security/index.md)。
