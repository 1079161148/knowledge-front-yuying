# 🟨 JavaScript 高级进阶（死角全集 · 直击中高级岗）

> 本篇是 [JS 基础](foundation.md) 的**深化篇**，覆盖**面试手写题、运行机制底层、现代 API、性能与安全**，目标是具备**中高级前端市场战斗力**。依据 **ECMA-262**、**HTML 规范（事件循环）**、**V8 文档**、**MDN**、**web.dev**。

---

## 一、事件循环：输出顺序题（面试必考死角）

宏任务（Macrotask）：`script` 整体、`setTimeout`、`setInterval`、I/O、UI 渲染。
微任务（Microtask）：`Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`、`async` 函数 await 之后的代码。

**规则**：每执行完一个宏任务，就**清空所有微任务**，再取下一个宏任务。

### 🎮 可运行 Demo：事件循环动画

<iframe src="../../demos/js-eventloop.html" width="100%" height="520" style="border:1px solid #2c5364;border-radius:8px"></iframe>

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// 输出：1 4 3 2
```

!!! danger "死角 1：async 函数里 await 前后的执行时机"
    `await` 之后的代码等价于 `Promise.then(后面的代码)`，属于**微任务**。
    ```js
    async function f() {
      console.log('a');
      await console.log('b');   // 'b' 同步执行（await 后表达式先求值）
      console.log('c');         // 微任务
    }
    f(); console.log('d');
    // a b d c
    ```

!!! tip "手写题套路"
    见到 `setTimeout` + `Promise` 混排：先跑同步代码 → 清空微任务队列 → 再跑定时器。

---

## 二、手写题合集（市场高频）

### 1. 防抖 debounce
```js
function debounce(fn, wait = 300) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
```

### 2. 节流 throttle（时间戳版）
```js
function throttle(fn, wait = 300) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) { fn.apply(this, args); last = now; }
  };
}
```

### 🎮 可运行 Demo：防抖 vs 节流 可视化

<iframe src="../../demos/js-debounce-throttle.html" width="100%" height="420" style="border:1px solid #2c5364;border-radius:8px"></iframe>

### 3. 深拷贝（含循环引用 / 常见类型）
```js
function deepClone(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (map.has(obj)) return map.get(obj);   // 解决循环引用
  const res = Array.isArray(obj) ? [] : {};
  map.set(obj, res);
  Reflect.ownKeys(obj).forEach(k => res[k] = deepClone(obj[k], map));
  return res;
}
```

### 4. 手动实现 Promise.all
```js
function promiseAll(list) {
  return new Promise((resolve, reject) => {
    const res = []; let count = 0;
    list.forEach((p, i) => {
      Promise.resolve(p).then(v => {
        res[i] = v;
        if (++count === list.length) resolve(res);
      }, reject);
    });
  });
}
```

### 5. 数组扁平化 flatten
```js
const flatten = arr => arr.reduce((a, c) => a.concat(Array.isArray(c) ? flatten(c) : c), []);
// 或 arr.flat(Infinity)
```

### 6. 柯里化 curry
```js
const curry = (fn, ...args) =>
  args.length >= fn.length ? fn(...args) : (...a) => curry(fn, ...args, ...a);
```

### 7. `new` 关键字模拟
```js
function myNew(Fn, ...args) {
  const obj = Object.create(Fn.prototype);
  const ret = Fn.apply(obj, args);
  return ret instanceof Object ? ret : obj;
}
```

---

## 三、Proxy / Reflect（现代响应式基石）

```js
const target = { name: 'a' };
const proxy = new Proxy(target, {
  get(t, k, r) { console.log('get', k); return Reflect.get(t, k, r); },
  set(t, k, v, r) { console.log('set', k); return Reflect.set(t, k, v, r); },
});
```

!!! info "市场价值"
    **Vue 3 的响应式 `reactive()` 就是 Proxy 实现的**（Vue 2 用 `Object.defineProperty`，有无法监听新增属性/数组下标等死角）。`Reflect` 与 `Proxy` 陷阱一一对应，让默认行为可调用。

!!! danger "死角 2：Proxy 只代理第一层"
    `reactive({ a: { b: 1 } })` 访问 `a.b` 时，`a` 返回的是被递归代理的对象（Vue 懒代理）。自己写时要递归 `get` 里 `return reactive(res)`。

---

## 四、垃圾回收与内存泄漏（性能死角）

- **标记清除**（V8 主流）：从根（window/global）出发，不可达对象被回收。
- **分代**：新生代（Scavenge，频繁小对象）/ 老生代（Mark-Sweep-Compact）。

!!! danger "死角 3：常见内存泄漏"
    1. 意外的全局变量（`this.x = 1` 在非严格函数里挂到 window）
    2. 遗忘的 `setInterval` / 未解绑的事件监听
    3. 闭包持有大对象长期不释放
    4. 脱离 DOM 但仍在 JS 中被引用（detached DOM）
    排查用 Chrome DevTools → Memory → Heap Snapshot。

---

## 五、V8 执行机制（优化死角）

1. 源码 → AST → 字节码（Ignition）→ 热点代码 JIT 编译为机器码（TurboFan）。
2. **隐藏类（Hidden Class）**：对象形状（属性顺序）固定才能走内联缓存快路径。
3. **优化建议**：
   - 对象属性**初始化顺序保持一致**
   - 避免先建空对象再动态加属性
   - 避免 `delete obj.x`（破坏隐藏类，用 `obj.x = undefined` 或 `Reflect.deleteProperty` 仍会退化，尽量不删）

!!! danger "死角 4：delete 性能陷阱"
    `delete obj.x` 让 V8 退化为字典模式（慢）。需要"移除"用 `obj.x = undefined` 或整体替换新对象。

---

## 六、模块化（ESM vs CJS，市场接轨）

```js
// ESM（浏览器/现代构建原生支持）
export const a = 1;
export default function () {};
import x, { a } from './m.js';

// CommonJS（Node 传统）
const x = require('./m');
module.exports = {};
```

| 维度 | ESM | CommonJS |
|------|-----|----------|
| 加载 | 编译时静态（可 tree-shaking） | 运行时动态 |
| 值 | 动态只读绑定（实时） | 拷贝值 |
| `this` | `undefined` | `module.exports` |
| 循环依赖 | 更易处理（绑定） | 易拿到未初始化值 |

!!! danger "死角 5：ESM 导入是'活的'"
    ```js
    // a.mjs: export let n = 1; setTimeout(()=> n=2, 0)
    // b.mjs: import { n } from './a.mjs'; setTimeout(()=> console.log(n), 10) // 2
    ```
    ESM 导入的是绑定，原模块改了，导入方也变（CJS 是快照拷贝）。

---

## 七、生成器与迭代器（高级控制流）

```js
function* gen() {
  yield 1; const x = yield 2; return x;
}
const it = gen();
it.next();        // {value:1, done:false}
it.next();        // {value:2, done:false}
it.next(99);      // {value:99, done:true}  （99 作为上一次 yield 的返回值）
```

**应用**：异步流程控制（`co` 库）、状态机、惰性序列、`for await...of`。

---

## 八、Symbol / BigInt / 元编程

```js
Symbol('id');                       // 唯一键，可做私有属性
Symbol.iterator; Symbol.asyncIterator; Symbol.hasInstance;
const big = 9007199254740993n;       // 超过 Number.MAX_SAFE_INTEGER 用 BigInt
```

!!! danger "死角 6：BigInt 不能和 Number 混算"
    `1n + 1` 抛 TypeError，必须 `1n + 1n`。`JSON.stringify` 不支持 BigInt（需自定义）。

---

## 九、安全死角（市场必备，依据 OWASP Top 10）

- **XSS（A03:2021 注入）**：不信任用户输入直接 `innerHTML` → 用 `textContent` / 框架自动转义 / DOMPurify。
- **CSRF**：携带 cookie 的跨站请求 → 同源校验 `Origin`/`Referer`、CSRF Token、SameSite Cookie。
- **eval / new Function**：执行任意字符串 → 禁用（CSP 策略 `script-src` 限制）。
- **原型污染**：`obj.__proto__.polluted = true` 来自不可信 JSON → `Object.freeze(Object.prototype)` / `JSON.parse` 时用 `reviver` 过滤 `__proto__`。

> 完整攻防对照（XSS / CSRF / CORS / CSP / 点击劫持，含后端职责）见 [前端安全全集](../security/index.md)（依据 OWASP Top 10、MDN Web Security、W3C CSP 规范）。

---

## 十、兼容性方案（降级到生产可用）

| 特性 | ES 版本 | 现代浏览器 | IE | 降级手段 |
|------|---------|-----------|----|----------|
| `let`/`const`/箭头 | ES2015 | ✅ | ❌ | Babel preset-env |
| `Promise` | ES2015 | ✅ | ❌(11 部分) | core-js |
| `async/await` | ES2017 | ✅ | ❌ | Babel + regenerator-runtime |
| 可选链 `?.` | ES2020 | ✅ | ❌ | Babel plugin-proposal |
| `??` | ES2020 | ✅ | ❌ | Babel plugin-proposal |
| `Proxy` | ES2015 | ✅ | ❌ | **无法 polyfill**（IE 死穴，用 `Object.defineProperty` 降级或放弃 IE） |
| `BigInt` | ES2020 | ✅ | ❌ | 无（用字符串/库） |

**工程化链路**：`Babel(@babel/preset-env)` 按 `browserslist` 目标转译 + `core-js` 注入 polyfill，配合 `useBuiltIns: 'usage'` 按需引入，体积最小。

---

## 十一、中高级岗自检清单

- [ ] 能手画事件循环并预测任意输出顺序
- [ ] 能手写防抖/节流/深拷贝/Promise.all/curry/new
- [ ] 能讲清 Proxy 与 Vue 响应式关系
- [ ] 能定位并修复内存泄漏
- [ ] 理解 V8 隐藏类与 `delete` 陷阱
- [ ] 区分 ESM 与 CJS 的值/加载差异
- [ ] 知道 XSS/CSRF/原型污染的防护
- [ ] 会配 Babel + core-js 做降级

> 配套阅读：[JS 进阶用法·异步·性能·兼容](terminology-advanced.md)（Promise 七大坑、Web Worker、rAF 等更细内容）。
