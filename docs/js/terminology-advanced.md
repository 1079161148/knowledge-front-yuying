# 🟨 JavaScript 进阶用法 · 异步 · 性能 · 兼容方案

> 接续 [JS 核心术语与语言基础](terminology-basic.md)。本篇聚焦**异步编程、事件循环、性能优化、内存安全**与**进阶兼容方案**，越细越好。依据 **ECMA-262**、**HTML 规范（事件循环/任务队列）**、**MDN**、**web.dev**。

---

## 一、异步编程核心术语（深入）

| 术语 | 定义 | 规范 |
|------|------|------|
| 回调 Callback | 作为参数传入、未来某个时机被调用的函数 | — |
| 回调地狱 | 多层嵌套回调导致"金字塔"式难维护代码 | — |
| Promise | 表示异步操作的**最终完成/失败**及其结果值的对象 | ECMA-262（ES2015） |
| 状态 | `pending` → `fulfilled` / `rejected`，**不可逆** | ECMA-262 |
| then / catch / finally | Promise 链式处理方法 | ECMA-262 |
| async / await | 基于 Promise 的语法糖，让异步代码像同步一样书写 | ECMA-262（ES2017） |
| 微任务 Microtask | Promise 回调，在当前宏任务结束后、下一个宏任务前清空 | HTML 规范 |
| 宏任务 Macrotask | `setTimeout`/`setInterval`/I/O/UI 渲染等 | HTML 规范 |
| Generator | 可暂停/恢复的函数（`function*` + `yield`） | ECMA-262（ES2016） |
| 迭代器协议 | 对象实现 `next()` 返回 `{value,done}` | ECMA-262 |
| 可迭代协议 | 对象实现 `Symbol.iterator` 方法 | ECMA-262 |
| 异步迭代 | `for await...of` + 异步迭代器（`Symbol.asyncIterator`） | ECMA-262（ES2018） |

---

## 二、Promise 核心用法 + 注意事项

### 1. 基础与静态方法

```js
const p = new Promise((resolve, reject) => {
  doAsync((err, data) => err ? reject(err) : resolve(data));
});
p.then(v => v).catch(e => console.error(e)).finally(() => clean());

Promise.all([p1, p2, p3]);          // 全部成功→结果数组；任一失败→立即 reject
Promise.allSettled([p1,p2]);        // 全部"落定"后返回 [{status,value|reason}]（ES2020）
Promise.race([p1, p2]);             // 第一个落定（成功或失败）即返回
Promise.any([p1, p2]);              // 第一个成功即返回；全失败→AggregateError（ES2021）
```

!!! danger "Promise 七大坑"
    1. **状态不可逆**：`resolve` 后再次 `reject` 无效，不会抛错也不生效。
    2. **吞掉错误**：`then` 回调里抛错会进入下一个 `catch`，但**最后一个 `then` 未接 `catch` 的错误会被静默吞掉**（未处理的 rejection）。
    3. **`Promise` 构造函数里抛错**会自动转成 `reject`，安全。
    4. **`then` 必须 `return`** 才能链式传值；不 return 则下一环拿到 `undefined`。
    5. **`all` 一失败全失败**，需要"全部结果不管成败"用 `allSettled`。
    6. **`forEach` + `await` 不串行也不等待**：`[1,2,3].forEach(async x => await fn(x))` 并发且无法 `await` 完成。
    7. **`new Promise` 里忘了 resolve/reject** → Promise 永远 `pending`，内存泄漏 + 流程卡死。

### 2. async / await 注意事项

```js
async function load() {
  try {
    const a = await fetchA();      // 串行
    const b = await fetchB();      // 等 a 完才发 b
    // 并发写法（同时发）：
    const [x, y] = await Promise.all([fetchA(), fetchB()]);
  } catch (e) {
    // 捕获 fetchA/fetchB 任意错误
  } finally {
    clean();
  }
}
```

!!! danger "async/await 致命细节"
    - **并发陷阱**：连续写 `await a(); await b();` 是**串行**，能用 `Promise.all` 就并行，否则慢一倍。
    - **错误必须 try/catch**：`async` 函数内未捕获的 reject 会冒泡成未处理 rejection。
    - **`await` 非 Promise 值**会包成已 resolved 的 Promise（`await 1` 合法）。
    - **顶层 `await`**：ES2022 模块顶层可用 `await`，但需模块环境（Vite/Webpack 支持），普通脚本不可用。
    - **循环里的 await**：`for...of` + `await` 是串行顺序执行；要并发用 `Promise.all` + `map`。

---

## 三、事件循环（Event Loop）深入 —— 输出顺序题必考

执行顺序铁律：

```
同步代码（调用栈）
   ↓ 全部执行完
清空所有微任务队列（microtask，Promise.then / queueMicrotask / MutationObserver）
   ↓ 微任务也可能继续产生微任务，直到队列清空
取一个宏任务（setTimeout / setInterval / I/O / UI render）
   ↓ 执行该宏任务
再次清空微任务队列
   ↓ 循环
渲染（浏览器在合适时机）
```

```js
console.log('1');                         // 同步
setTimeout(() => console.log('2'), 0);   // 宏任务
Promise.resolve().then(() => console.log('3')); // 微任务
console.log('4');                         // 同步
// 输出顺序：1 → 4 → 3 → 2
```

!!! warning "关键认知"
    - **微任务优先级高于宏任务**：每个宏任务执行后都会先清空整个微任务队列。
    - `queueMicrotask(fn)` 显式入微任务队列。
    - `requestAnimationFrame` 是**渲染前**的回调，不属于微/宏任务标准分类，归渲染阶段。
    - `async` 函数中 `await` 之后的代码，等价于 `Promise.then`（微任务）。

---

## 四、性能优化核心用法 + 注意事项

### 1. 防抖（Debounce）与节流（Throttle）

```js
// 防抖：停止触发 wait 毫秒后才执行（搜索输入、resize）
function debounce(fn, wait = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}
// 节流：每隔 wait 毫秒最多执行一次（scroll、mousemove）
function throttle(fn, wait = 300) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) { last = now; fn(...args); }
  };
}
```

!!! tip "选型"
    - **输入联想/resize**：用防抖（等用户停手）。
    - **滚动加载/拖拽**：用节流（控制频率）。
    - 现代浏览器还有 `AbortController` 取消未完成的请求，配合防抖更优。

### 2. requestAnimationFrame（rAF）

```js
function animate() {
  // 改 transform/opacity 等合成属性
  element.style.transform = `translateX(${x}px)`;
  x += 1;
  if (x < 100) requestAnimationFrame(animate);  // 跟随浏览器刷新率（通常 60fps）
}
requestAnimationFrame(animate);
```

!!! warning "注意"
    - 动画请用 `rAF` 而非 `setInterval`（后者不跟刷新率、易掉帧、后台标签页仍跑）。
    - 只改 `transform`/`opacity` 走合成层，性能最佳（见 CSS 渲染章节）。

### 3. Web Worker（避免阻塞主线程）

```js
// main.js
const worker = new Worker('./calc.js');
worker.postMessage(bigData);
worker.onmessage = e => console.log('结果', e.data);
// calc.js
self.onmessage = e => { const r = heavyCompute(e.data); self.postMessage(r); };
```

!!! warning "限制"
    - Worker **不能访问 DOM / `window` / `document`**，只能算数据。
    - 数据通过**结构化克隆**传递（大对象有拷贝开销），可用 `Transferable` 转移所有权零拷贝。
    - 跨域 Worker 受限，通常同源或用打包器处理。

### 4. 内存与垃圾回收

- JS 引擎用**标记-清除（Mark-and-Sweep）**回收不可达对象。
- **常见泄漏**：
  - 意外的全局变量（`this.x = ...` 在非严格模式变全局）。
  - 被遗忘的定时器 `setInterval` 引用了 DOM。
  - 闭包持有大对象（变量被闭包捕获无法释放）。
  - 脱离 DOM 但仍在 JS 引用的"游离节点"。
- 排查：Chrome DevTools → Memory → Heap Snapshot 对比快照找增长。

---

## 五、安全注意事项（前端必知）

| 风险 | 说明 | 防范 |
|------|------|------|
| **XSS** | 拼接用户输入到 HTML / `innerHTML` 执行脚本 | 用 `textContent`；`innerHTML` 前转义；CSP 策略 |
| **CSRF** | 跨站请求伪造 | SameSite Cookie、CSRF Token、校验 Origin |
| **`eval` / `new Function`** | 执行任意字符串，极大风险且破坏优化 | 禁止（ESLint `no-eval`）；用 `JSON.parse`（带 try/catch） |
| **原型污染** | 不可信对象 `__proto__` 被篡改 | 用 `Object.create(null)`；深拷贝时过滤 `__proto__` |
| **敏感信息** | 前端代码/Token 明文暴露在源码 | 密钥放后端，前端只持临时 Token |

!!! danger "XSS 实战"
    ```js
    // ❌ 危险
    el.innerHTML = `<div>${userInput}</div>`;
    // ✅ 安全
    el.textContent = userInput;
    // 必须渲染 HTML 时，转义 < > & " ' 或使用 DOMPurify
    ```

---

## 六、进阶兼容方案（工程化）

### 1. 浏览器支持对照（进阶特性）

| 特性 | 版本 | IE | 现代浏览器 | 降级 |
|------|------|----|-----------|------|
| `async`/`await` | ES2017 | ❌ | ✅ | Babel + `regenerator-runtime` |
| `Symbol`/`Iterator` | ES2015 | ❌ | ✅ | `core-js` |
| `Generator` | ES2016 | ❌ | ✅ | Babel + regenerator |
| `for await...of` | ES2018 | ❌ | ✅ | Babel |
| `Promise.allSettled` | ES2020 | ❌ | ✅(80+) | `core-js` |
| `Promise.any` | ES2021 | ❌ | ✅ | `core-js` |
| `globalThis` | ES2020 | ❌ | ✅ | `core-js` |
| `WeakRef`/`FinalizationRegistry` | ES2021 | ❌ | 很新 | `core-js` |
| `Array.at` / `Object.hasOwn` | ES2022 | ❌ | 很新 | `core-js` |
| 顶层 `await` | ES2022 | ❌ | 很新(模块) | 打包器 |
| 可选链 `?.` | ES2020 | ❌ | ✅(80+) | Babel |
| `BigInt` | ES2020 | ❌ | ✅(Chrome 67+) | `core-js`（仅部分） |

### 2. Babel + core-js 标准配置（按需 polyfill）

```js
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { browsers: ['last 2 versions', '> 0.5%', 'not dead'] },
      useBuiltIns: 'usage',   // 只引入用到的 polyfill，减小体积
      corejs: { version: 3, proposals: false },
    }],
  ],
  plugins: ['@babel/plugin-transform-runtime'], // 复用 helper，避免重复
};
```

### 3. 现代 / 传统双包输出（兼容老浏览器的工业方案）

```js
// vite.config.js —— 产出 es2015(现代) + es5(传统) 两份，由 <script type=module> 自动分发
export default {
  build: {
    target: 'es2015',
    // 用 @vitejs/plugin-legacy 生成 legacy 包 + nomodule 降级
  },
};
```

### 4. 旧浏览器检测与降级

```js
// 特性检测优先于 UA 检测
if ('Promise' in window && Promise.allSettled) {
  // 使用新 API
} else {
  // 加载 polyfill 或降级逻辑
}
```

!!! tip "兼容决策树"
    1. 是否现代项目（只支持 Chrome/Edge 新版）？→ 可不用 Babel，享受原生 ESM。
    2. 是否要兼容 IE / 旧 Safari？→ 必须 Babel 语法降级 + `core-js` API 补全 + `regenerator-runtime`。
    3. 体积敏感？→ `useBuiltIns: 'usage'` 按需引入，避免全量 `core-js`。
    4. 动手前：**[Can I Use](https://caniuse.com)** + **MDN 兼容性表** 查实。

---

## 七、调试与错误处理最佳实践

```js
// 1. 用 Error 对象保留堆栈
throw new TypeError('参数必须是 string');

// 2. 全局兜底（但别吞掉错误）
window.addEventListener('error', e => report(e.error));
window.addEventListener('unhandledrejection', e => report(e.reason));

// 3. 自定义错误类型
class ValidationError extends Error {
  constructor(msg) { super(msg); this.name = 'ValidationError'; }
}
```

!!! warning "注意"
    - `window.onerror` 对**跨域脚本**只能拿到 `Script error.`，需脚本加 `crossorigin` 且服务器返回 CORS 头。
    - `unhandledrejection` 兜底只用于上报，不要用来"静默吞掉"业务错误。
    - 生产环境应把错误聚合上报（Sentry 等），不要 `console.log` 裸奔。
