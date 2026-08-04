# 🟢 Node.js 基础

> 面向前端转全栈：从运行机制到核心 API。依据 **[Node.js 官方文档](https://nodejs.org/docs/latest/api/)**、**[Node.js Design Docs](https://github.com/nodejs/node/tree/main/doc)**。本页讲**基础 API**：全局对象、模块、文件、事件、流、Buffer、路径、进程。

---

## 1. Node 是什么 / 运行机制

- Node 是**基于 V8 的 JS 运行时**，事件驱动、非阻塞 I/O，适合 I/O 密集（Web 服务、API、构建工具）。
- 单线程 + **事件循环** 处理并发；CPU 密集任务会阻塞主线程（用 worker_threads / 子进程）。

---

## 2. 全局对象与模块

**`global` / `process` / `__dirname` / `__filename`**
- `global`：全局对象（类似浏览器 window，但前端全局变量不在 global 上）。
- `process`：当前 Node 进程信息与控制（见高级篇）。
- `__dirname`：当前文件目录绝对路径；`__filename`：当前文件绝对路径（ESM 中需用 `import.meta.url`）。

**模块系统（CommonJS）**
```js
// 导出
module.exports = { a: 1 }
exports.b = 2
// 导入
const mod = require('./mod')
```
- `require` 是同步、运行时加载、缓存（`require.cache`）。
- `module.exports` 与 `exports` 指向同一对象，`exports = {}` 会断开引用（用 `module.exports` 赋值）。

**ES Module（推荐新项目）**
```js
// package.json 设 "type": "module"
import { readFile } from 'fs/promises'
export const foo = 1
```
- 静态、`import()` 动态导入、默认严格模式。

!!! danger "CJS 与 ESM 混用（最高频坑）"
    - 一个文件**不能**同时 `require` 和 `import`（语法层面就不允许）。
    - `package.json` 没写 `"type":"module"` 时，`.js` 默认是 CJS，此时写 `import` 直接报 `Cannot use import statement outside a module`。
    - 想用 ESM 又想保留个别 CJS 文件，把文件后缀改成 `.cjs`；反之 CJS 项目里想用 ESM 用 `.mjs`。
    - `__dirname` / `__filename` 在 ESM 中**不存在**，要用：
      ```js
      import { fileURLToPath } from 'url'
      import { dirname } from 'path'
      const __dirname = dirname(fileURLToPath(import.meta.url))
      ```

---

## 3. 文件系统 `fs`

**基础 API（回调 / 同步 / Promise）**
```js
const fs = require('fs')
fs.readFile('./a.txt', 'utf8', (err, data) => {})   // 回调
const s = fs.readFileSync('./a.txt', 'utf8')          // 同步（会阻塞）
// 推荐：Promise 版
const { readFile, writeFile, mkdir } = require('fs/promises')
await writeFile('./b.txt', 'hi', 'utf8')
```

| 方法 | 说明 |
|------|------|
| `fs.readFile` | 读整个文件到内存 |
| `fs.writeFile` | 覆盖写入（默认 `flag:'w'`） |
| `fs.appendFile` | 追加写入（`flag:'a'`） |
| `fs.copyFile` | 复制文件 |
| `fs.unlink` | 删除文件 |
| `fs.mkdir` / `fs.rmdir` | 创建/删除目录（`recursive:true` 递归） |
| `fs.readdir` | 列目录 |
| `fs.stat` | 文件元信息（大小/时间/类型） |
| `fs.watch` | 监听文件变化（热更新基础） |
| `fs.access` | 检查权限是否存在 |

!!! tip "优先用 `fs/promises`"
    回调嵌套易"回调地狱"，`fs/promises` + `async/await` 最可读；不要在生产用同步 API（阻塞事件循环）。

---

## 4. 路径 `path`

```js
const path = require('path')
path.join(__dirname, 'a', 'b')      // 拼接（自动处理分隔符）
path.resolve('a', 'b')              // 解析为绝对路径（从 cwd 累加）
path.basename('/a/b/c.txt')         // c.txt
path.dirname('/a/b/c.txt')          // /a/b
path.extname('/a/b/c.txt')          // .txt
path.parse('/a/b/c.txt')            // {root,dir,base,ext,name}
path.relative('/a', '/a/b/c')       // b/c
```
- `path.join` 不保证绝对；`path.resolve` 必得绝对路径。前端注意 `import.meta.url` + `fileURLToPath` 取 ESM 路径。

!!! warning "永远别用手动拼路径字符串"
    用 `path.join(__dirname, 'a', 'b')` 而不是 `'./a/b' + '/'`。不同 OS 分隔符不同（`\` vs `/`），手动拼在 Windows 上极易出错。`path` 模块会自动处理。

---

## 5. 事件 `events`

```js
const EventEmitter = require('events')
class MyBus extends EventEmitter {}
const bus = new MyBus()
bus.on('data', (v) => console.log(v))   // 监听（可多个）
bus.once('boot', () => {})              // 只触发一次
bus.emit('data', 123)                   // 触发
bus.off('data', handler)                // 取消监听（需同一函数引用）
bus.removeAllListeners()                // 全部移除
```
- `EventEmitter` 是 Node 很多模块（http/net/stream）的基类；监听器过多会内存泄漏（`setMaxListeners` 警告）。

!!! warning "事件监听器的两个隐形坑"
    - **忘记监听 error**：EventEmitter 触发未监听的 `error` 事件会**直接抛出并崩溃进程**。凡是用 `EventEmitter` 的地方，至少 `on('error', ...)` 兜底。
    - **监听器泄漏**：`bus.on(...)` 如果反复注册却不 `off`，回调会执行多次且内存上涨。`once` 只触发一次；需要长期监听时确保组件销毁时 `off`。
    - `off` 必须传入**同一个函数引用**，箭头函数匿名写 `bus.off(() => {})` 删不掉。

---

## 6. Buffer 与二进制

```js
const b = Buffer.from('hello')          // 字符串→Buffer
Buffer.from([0x68, 0x69])               // 字节数组
b.toString('utf8')                       // 解码
Buffer.alloc(10)                         // 分配（清零，安全）
Buffer.allocUnsafe(10)                   // 不清理，更快但有旧数据风险
b.length                                 // 字节长度（≠字符串长度）
Buffer.concat([b1, b2])                  // 合并
```
- Buffer 是**二进制数据容器**（图片/网络包/编码转换）；中文 `Buffer.byteLength` 才准确。

!!! danger "Buffer 编码与乱码（最容易被忽视）"
    - `Buffer.length` 是**字节数**，不是字符数。中文 UTF-8 一个字占 3 字节，`'中文'.length` 是 2，但 `Buffer.byteLength('中文')` 是 6。
    - 切分 Buffer 时若在多字节字符中间截断再 `toString('utf8')`，会出现**乱码/替换符**。处理文本流要用 `StringDecoder` 或基于行的解析，别手动 `slice` 后再 `toString`。
    - `Buffer.allocUnsafe` 不清零，可能残留**旧内存数据**（含别处敏感信息），生产优先用 `Buffer.alloc`。

---

## 7. 流 `stream`（基础）

```js
const { Readable, Writable, Duplex, Transform } = require('stream')
// 读取流（如文件/HTTP 请求体）
const { createReadStream } = require('fs')
createReadStream('./big.mp4').pipe(res)   // 边读边发，不占内存
```
- 四种流：Readable / Writable / Duplex（双工）/ Transform（转换）。用 `pipe` 串联，避免大文件一次性读内存。

!!! warning "流的错误处理与资源释放"
    - `pipe` 不会自动转发错误！上游出错时下游不会收到，**必须两边都 `on('error')`**，否则进程崩。
    - 大文件上传/下载务必用流；用 `readFile` 读几百 MB 文件会直接 OOM。
    - 手动 `createReadStream` 后要确保正常 `end()` / `destroy()`，否则文件描述符泄漏。

---

## 8. 下一步

- 进阶能力看 [Node.js 高级](nodejs-advanced.md)：HTTP 服务、事件循环、异步、cluster。
- 框架实践看 [NestJS 基础](nestjs-basic.md)。
