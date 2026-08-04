# ⏳ JS 异步与事件循环（前端核心基础）

> 基础篇的"必懂底层"。JavaScript 单线程，却能做到"非阻塞"——全靠**事件循环（Event Loop）**、**宏任务 / 微任务**与**调用栈**的配合。不懂它，`Promise`、`async/await`、定时器顺序永远靠蒙。依据 **ECMA-262 / HTML Living Standard（Event Loop）**。

---

## 1. 三个核心概念

- **调用栈（Call Stack）**：函数调用入栈出栈，单线程一次只执行一个。
- **任务队列（Task Queue / Macrotask）**：`setTimeout`、I/O、UI 事件等，事件循环每轮取一个。
- **微任务队列（Microtask）**：`Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`，**每轮宏任务之后清空全部微任务**。

---

## 2. 一轮事件循环的顺序

```text
1. 执行当前宏任务（如整段脚本 / 一个 setTimeout 回调）
2. 清空所有微任务（直到队列为空）
3. 必要时渲染（浏览器）
4. 取下一个宏任务 → 回到 1
```

```js
console.log('1 脚本开始')          // 同步，立即执行

setTimeout(() => console.log('4 宏任务'), 0)

Promise.resolve()
  .then(() => console.log('3 微任务 A'))
  .then(() => console.log('3 微任务 B'))

console.log('2 同步结束')
// 输出顺序：1 → 2 → 3微任务A → 3微任务B → 4宏任务
```

!!! tip "记忆口诀"
    同步代码先跑完 → 微任务插队清空 → 才轮到下一个宏任务。`await` 之后的代码等价于 `.then` 里的微任务。

---

## 3. async / await 的本质

`async` 函数返回 `Promise`；`await` 把"后面的代码"切成微任务续体。

```js
async function f() {
  console.log('A')
  await Promise.resolve()   // 让出线程，后续作为微任务
  console.log('B')
}
f()
console.log('C')
// 输出：A → C → B
```

!!! danger "await 的常见误解"
    - `await` 不是"等待异步完成才继续主线程"，而是**当前 async 函数暂停，主线程继续跑别的同步代码**，等微任务轮到再续。
    - 别在循环里 `await` 串行请求却本可并发：`for` 里逐个 `await` 会变串行，应 `Promise.all([...])`。

---

## 4. 实战：并发控制与超时

```js
// 并发但限流（避免一次发 100 个请求打爆接口）
async function pLimit(tasks, limit = 5) {
  const ret = []
  const exec = async (fn) => { ret.push(await fn()) }
  const pool = []
  for (const t of tasks) {
    const p = Promise.resolve().then(() => exec(t))
    pool.push(p)
    if (pool.length >= limit) await Promise.race(pool)
    p.finally(() => pool.splice(pool.indexOf(p), 1))
  }
  await Promise.all(pool)
  return ret
}

// 超时控制：竞速，谁先到用谁
function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ])
}
```

!!! warning "易踩坑"
    - `setTimeout(fn, 0)` 不是"立刻"，最少 4ms（嵌套更深 5 层后最小 4ms），且要等当前宏任务与微任务清空。
    - 未捕获的 Promise rejection 在 Node/浏览器都会抛错，记得 `.catch` 或 `try/catch` 包 `await`。
    - `Promise.all` 任意一个 reject 整体失败；要"全部跑完看结果"用 `Promise.allSettled`。

---

## 5. 自测（看看你真懂没）

```js
async function test() {
  console.log('1')
  setTimeout(() => console.log('4'), 0)
  Promise.resolve().then(() => console.log('3'))
  console.log('2')
}
test()
// 答案：1 → 2 → 3 → 4
```

> 进阶衔接：[响应式原理深入](../advanced/reactivity-deep.md)。
