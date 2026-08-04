# 📦 模块化开发

> 模块化 = 把大程序按"职责清晰、高内聚低耦合"拆成一个个可独立开发/测试/复用的单元。本篇讲清 **模块标准（ESM/CJS/AMD/UMD）**、**加载机制差异**、**模块联邦** 与 **代码分割/懒加载**。
>
> 权威来源：[MDN ES Modules](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)、[Node.js ESM 文档](https://nodejs.org/api/esm.html)、[Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)。

---

## 1. 术语表

- **模块（Module）**：一个独立作用域的文件单元，明确 `import` 依赖、`export` 对外接口。
- **高内聚低耦合**：模块内部紧密相关，模块之间依赖尽量小、接口清晰。
- **Tree Shaking**：打包器静态分析 ESM 的 `export`，剔除未被引用的死代码。
- **模块联邦（Module Federation）**：运行时跨应用共享模块，微前端核心能力。

---

## 2. 模块标准对比

| 标准 | 提出方 | 加载 | 语法 | 现状 |
|------|--------|------|------|------|
| **ESM** | ECMAScript 官方（ES2015） | 静态编译时（浏览器/Node 原生） | `import/export` | ✅ 现代唯一推荐 |
| **CommonJS (CJS)** | Node.js 社区 | 运行时同步 `require` | `module.exports/require` | Node 老项目、npm 包 |
| **AMD** | 社区（RequireJS） | 异步、浏览器 | `define/require` | 基本淘汰 |
| **UMD** | 社区 | 兼容 CJS+AMD+全局 | 自执行函数包裹 | 兼容老环境的库仍有用 |

### 2.1 ESM（现代标准，推荐）

```js
// math.js
export const add = (a, b) => a + b
export default function sub(a, b) { return a - b }

// main.js
import sub, { add } from './math.js'   // 具名 + 默认导入，注意 .js 不能省
console.log(add(1, 2), sub(3, 1))
```

### 2.2 CommonJS（Node 传统）

```js
// math.js
module.exports = { add: (a, b) => a + b }
// main.js
const { add } = require('./math.js')
```

!!! danger "ESM 与 CJS 的核心差异"
    - **加载时机**：ESM 是**编译时静态**分析（便于 tree shaking），CJS 是**运行时**才 `require`。
    - **值语义**：ESM 导入的是**活绑定（live binding）**，外部改了这边也变；CJS 导入的是**值的拷贝**。
    - **顶层 await**：ESM 顶层可用 `await`，CJS 不行。
    - **互操作**：Node 里 ESM `import` 一个 CJS 包得到 `module.exports` 的 default；CJS `require` ESM 需动态 `import()`。

---

## 3. 浏览器原生 ESM 与打包

现代浏览器原生支持 `<script type="module">`，无需打包即可 `import`。但生产环境仍需打包器做：依赖预构建、tree shaking、代码分割、兼容降级。

<iframe src="../../demos/engineering-esm.html" width="100%" height="160" style="border:1px solid #2c5364;border-radius:8px"></iframe>

---

## 4. 模块联邦（Module Federation）

多独立构建的应用"运行时共享模块"，典型场景：中台微前端、主站与子应用共享组件/工具库。

```js
// 宿主（remote）暴露模块 —— webpack.config / rspack.config
new ModuleFederationPlugin({
  name: 'remoteApp',
  filename: 'remoteEntry.js',
  exposes: { './Button': './src/Button.jsx' },
})
// 消费方（host）
new ModuleFederationPlugin({
  remotes: { remoteApp: 'remoteApp@https://cdn.xxx/remoteEntry.js' },
})
```

!!! danger "模块联邦的坑"
    - 共享依赖（React/Vue）必须 `shared` 声明且版本对齐，否则会出现**两份 React 实例**导致 hooks 报错。
    - 类型与运行时版本要一致，否则类型对但运行崩。

---

## 5. 代码分割与懒加载

把不首屏必需的代码拆出来，按需加载，降低首包体积。

```js
// 动态 import() → 自动分包（Vite/Webpack 都支持）
const Editor = () => import('./Editor.jsx')
// React 懒加载
const Lazy = React.lazy(() => import('./Heavy'))
```

| 方式 | 适用 |
|------|------|
| 路由级 `import()` | 页面级拆分，最常用 |
| 组件级 `React.lazy` / Vue `defineAsyncComponent` | 重组件按需 |
| `import()` + 条件 | 按用户操作加载（如富文本编辑器） |

!!! danger "别过度分包"
    分包太碎会增加 HTTP 请求数与并行上限的争夺，反而变慢。用打包分析（`rollup-plugin-visualizer`）看依赖图再决定切分点。

---

## 6. 自检清单

- [ ] 我能说清 ESM（静态）与 CJS（运行时）的加载差异
- [ ] 我明白 ESM 是 live binding，CJS 是值拷贝
- [ ] 生产构建我确认开启了 tree shaking（ESM + `sideEffects` 正确）
- [ ] 重组件/路由我用动态 `import()` 做了懒加载
- [ ] 微前端场景下我正确配置了 `shared` 依赖版本

---

## 7. 下一步

- 想知道「构建工具怎么把这些模块打成产物」→ [构建工具](../build-tools/index.md)
- 想学「组件怎么拆、样式怎么隔离」→ [组件化](../componentization/index.md)
- 想管多包依赖 → [Monorepo 与依赖管理](../monorepo/index.md)
