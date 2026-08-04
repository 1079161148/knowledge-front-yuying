# 🟨 JavaScript 基础（扫清死角 · 快速接轨市场）

> 本篇是 **JS 核心术语**（[术语与语言基础](terminology-basic.md)）的**实战落地篇**：把术语变成可上手的代码，并补齐初学者 / 转行 / 面试常被卡的"死角"。所有结论依据 **ECMA-262**、**MDN**、**web.dev**。
>
> 适用：0→1 入门、复习查漏、面试前速通。读完应能**直接写业务代码、看懂框架源码、应付 80% 社招基础题**。

---

## 一、JS 是什么（先建立心智模型）

JavaScript = **ECMAScript 语言标准** + **宿主环境 API**（浏览器 BOM/DOM、Node 的 fs/http 等）。

!!! info "一句话记忆"
    JS 语言本身只定义语法、类型、内置对象（`Array`/`Object`/`Promise`…）；**能操作页面 / 发请求 / 读文件，都是宿主（浏览器/Node）提供的**，不是 JS 原生能力。这也是为什么"前端 JS"和"Node JS"写法像、API 却不同。

| 层级 | 提供方 | 例子 |
|------|--------|------|
| 语言核心 | ECMA-262 | `let`/`const`、箭头函数、`Promise`、`class` |
| 浏览器宿主 | W3C / WHATWG | `document`、`window`、`fetch`、`localStorage` |
| Node 宿主 | OpenJS | `require`、`fs`、`http`、`process` |

---

## 二、变量与作用域（第一死角：`var` vs `let` vs `const`）

```js
var a = 1;          // 函数作用域、可重复声明、可提升(初始化为 undefined)
let b = 2;          // 块级作用域、不可重复声明、TDZ 死区
const c = 3;        // 块级作用域、必须初始化、绑定不可重赋（对象内部可改）
```

!!! danger "死角 1：const 不是不可变"
    `const obj = {x:1}` 后 `obj.x = 2` 是**合法**的；`const` 只保证**绑定不变**，不保证**值不变**。要冻结用 `Object.freeze()`（浅冻结）。

!!! danger "死角 2：for 循环里的 var"
    ```js
    for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); } // 3 3 3
    for (let i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); } // 0 1 2
    ```
    `var` 没有块级作用域，三个定时器共享同一个 `i`；`let` 每次迭代创建新绑定。

**市场接轨**：默认用 `const`，需要重新赋值时用 `let`，**永远不用 `var`**（ESLint `no-var`）。

---

## 三、数据类型与类型转换（第二死角：隐式转换）

JS 有 7 种原始类型 + `object`：`string / number / boolean / null / undefined / symbol / bigint` + `object`。

### 1. `==` vs `===`

```js
0 == ''            // true  （都转成 0）
0 === ''           // false
null == undefined  // true  （历史特例）
null === undefined // false
NaN === NaN        // false （NaN 不等于任何值，用 Number.isNaN 判断）
```

!!! danger "死角 3：== 的隐式转换坑"
    永远用 `===`。`==` 的转换规则有 14 条以上，背不下来就别用。`[] == ![]` 竟为 `true`（先 `![]→false→0`，再 `[]→''→0`）。

### 2. 常见的隐式转换表

| 表达式 | 结果 | 说明 |
|--------|------|------|
| `'5' - 3` | `2` | `-` 触发 Number 转换 |
| `'5' + 3` | `'53'` | `+` 有字符串则拼接 |
| `[] + {}` | `'[object Object]'` | 都转字符串 |
| `{}` + `[]` | `0` | `{}` 被当代码块，`+[]→0` |
| `!!''` | `false` | 空串是 falsy |

**Falsy 七兄弟**：`false / 0 / -0 / '' / null / undefined / NaN`（以及 `document.all` 历史遗留）。其余都 truthy，**含 `[]`、`{}`、`'0'`、`'false'`**。

!!! danger "死角 4：'0' 是 truthy"
    `if ('0')` 会执行。`'0'` 是非空字符串 → truthy。判断数字是否为 0 要用 `=== 0`。

---

## 四、this 绑定（第三死角：5 条规则）

优先级：**`new` > 显式 `call/apply/bind` > 隐式(对象调用) > 默认(严格 undefined / 非严格 window)**。

```js
function f() { console.log(this); }
f();                      // 非严格: window；严格: undefined
obj.f();                  // obj
f.call(ctx);              // ctx
new f();                  // 新创建的对象
```

!!! danger "死角 5：回调里的 this 丢失"
    ```js
    const obj = { name: 'a', say() { setTimeout(function(){ console.log(this.name); }, 0); } };
    obj.say(); // undefined（this 指向 window）
    ```
    解决：箭头函数（无自身 this，继承外层）、`setTimeout(fn, 0, arg)`、`bind`。

**市场接轨**：类/对象方法优先用**箭头函数**保留 `this`；React 事件里 `this` 丢失是经典面试题。

---

## 五、原型与原型链（第四死角：继承本质）

每个对象有隐藏的 `[[Prototype]]`（用 `__proto__` 访问，标准用 `Object.getPrototypeOf`）。属性查找沿原型链向上。

```js
function Person(name){ this.name = name; }
Person.prototype.say = function(){ return this.name; };
const p = new Person('a');
p.say(); // 'a' —— 自身没有，沿原型链找到 Person.prototype
```

!!! danger "死角 6：__proto__ vs prototype"
    - `prototype`：**函数**特有，作为 `new` 出来的实例的原型。
    - `__proto__`：**实例**特有，指向构造函数的 `prototype`。
    - `p.__proto__ === Person.prototype` ✅

**class 只是语法糖**：
```js
class A { constructor(n){ this.n = n; } hi(){ return this.n; } }
// 等价于上面的构造函数写法，hi 在 A.prototype 上
```

**市场接轨**：组件库里 `extends`、React `Component`、Vue 选项式 API 的 `extends` 全靠原型链。理解它才能看懂"为什么方法放在原型上节省内存"。

---

## 六、闭包（第五死角：捕获的是变量不是值）

```js
function makeCounter() {
  let count = 0;
  return () => ++count; // 捕获 count 的绑定
}
const c = makeCounter();
c(); // 1  c(); // 2
```

!!! danger "死角 7：循环 + 闭包 + var"
    ```js
    for (var i = 0; i < 3; i++) {
      setTimeout(() => console.log(i), 0); // 3 3 3，闭包共享同一个 i
    }
    ```
    解决：`let` / IIFE / `bind`。

**应用**：模块私有变量、防抖节流、React `useCallback` 缓存、Vue `computed`/watch 实现原理。

---

## 七、数组与对象的 20 个高频方法（市场秒上手）

```js
// 遍历（不返回新数组）
arr.forEach(fn);
// 映射 / 过滤 / 判定
arr.map(fn); arr.filter(fn); arr.some(fn); arr.every(fn);
// 聚合
arr.reduce((acc, cur) => acc + cur, 0);
// 查找
arr.find(fn); arr.findIndex(fn); arr.includes(x);
// 变形
arr.flat(2); arr.flatMap(fn); arr.sort((a,b)=>a-b);
// 对象
Object.keys(o); Object.values(o); Object.entries(o);
Object.assign({}, a, b);             // 浅合并
{ ...a, ...b };                      // 展开合并（推荐）
const { x, ...rest } = o;            // 剔除字段
```

!!! danger "死角 8：map 里不 return"
    `arr.map(x => x * 2)` 漏写 `return`（箭头函数省了 `{}` 才有隐式 return；写了 `{}` 就必须显式 return），否则得到 `[undefined, ...]`。

!!! danger "死角 9：sort 默认按字符串"
    `[3,10,2].sort()` → `[10,2,3]`（当成字符串比较）。必须传比较函数 `sort((a,b)=>a-b)`。

---

## 八、解构 / 展开 / 模板字符串（现代写法必会）

```js
const { name, age = 18 } = user;        // 默认值
const [first, , third] = arr;          // 跳项
const clone = { ...obj };             // 浅拷贝
const merged = { ...a, ...b, x: 1 };   // 后者覆盖前者
const str = `${name} 今年 ${age} 岁`;   // 模板字符串
```

---

## 九、可选链 / 空值合并（接现代框架必会）

```js
const city = user?.address?.city;   // 任意一环为 null/undefined 直接返回 undefined
const n = input ?? 0;               // 仅当 null/undefined 用默认值（0/''/false 不触发）
```

!!! danger "死角 10：?? 与 || 的区别"
    `input || 0` 在 `input = 0` 时也走默认值；`input ?? 0` 只在 `null/undefined` 时走。配置项/表单数值用 `??`。

---

## 十、错误处理（市场必备：别让页面白屏）

```js
try {
  risky();
} catch (e) {
  console.error(e);          // e.message / e.stack
} finally {
  cleanup();                 // 无论成败都执行
}
// 抛自定义错误
throw new TypeError('参数类型错误');
```

!!! tip "市场接轨"
    异步里 `try/catch` 包不住 `await` 之外的微任务报错；全局兜底用 `window.onerror` / `addEventListener('unhandledrejection')`。

---

## 十一、JSON 与序列化死角

```js
JSON.stringify(obj, null, 2);          // 美化输出
JSON.parse(str);
```

!!! danger "死角 11：stringify 丢东西"
    `undefined` / 函数 / `Symbol` 属性会被**忽略**；`Date` 变字符串；`Map`/`Set` 变 `{}`；循环引用直接抛错。需要自定义 `replacer` 或 `JSON.stringify(obj, (k,v)=>...)`。

---

## 十二、Date / Math / 正则速查

```js
Date.now(); new Date().toLocaleString('zh-CN');
Math.floor(3.9); Math.random(); Math.max(...arr);
/^1[3-9]\d{9}$/.test(phone);            // 手机号
```

!!! danger "死角 12：new Date('2026-07-31') 是 UTC 零点"
    含 `-` 的 ISO 字符串按 UTC 解析，可能差 8 小时。用 `new Date(2026, 6, 31)`（月份从 0 起）按本地时区。

---

## 十三、快速接轨市场 checklist

- [ ] 能用 `const/let` 写业务，零 `var`
- [ ] 能区分 `==`/`===`、Falsy 值、隐式转换坑
- [ ] 能用 `this` 5 规则解释 React/Vue 事件绑定
- [ ] 能画原型链、解释 `class extends`
- [ ] 能手写闭包计数器 / 防抖节流
- [ ] 熟用 `map/filter/reduce/find/destructuring/optional chaining`
- [ ] 能 `try/catch` + 全局错误兜底
- [ ] 理解"语言核心 vs 宿主 API"边界

### 🎮 可运行 Demo：原型链 / 闭包 / 手写深拷贝

<iframe src="../../demos/js-prototype-closure.html" width="100%" height="560" style="border:1px solid #2c5364;border-radius:8px"></iframe>

> 下一篇 → [JS 高级进阶](advanced-topics.md)：手写题、微任务宏任务、Proxy/Reflect、垃圾回收、V8 优化、模块化、安全、工程化降级，直击中高级岗。
