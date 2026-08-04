# 🔧 JS 工具链（语法增强与兼容）

> JS 工具链 = 把"新语法/TS/框架"转成浏览器能跑的 JS。本篇覆盖 **Babel 工作机制、core-js 与 polyfill、browserslist、TS 编译（tsc/esbuild）、SWC**。
>
> 权威来源：[Babel 文档](https://babeljs.io/docs/)、[core-js](https://github.com/zloirock/core-js)、[browserslist](https://github.com/browserslist/browserslist)、[TypeScript 文档](https://www.typescriptlang.org/docs/)、[SWC](https://swc.rs/)。

---

## 1. 术语表

- **Transpile（转译）**：语法层面转换（ES2022 → ES5），不改语义。
- **Polyfill**：为旧环境补缺失的 API 实现（如 `Promise`、`Array.at`）。
- **Preset**：Babel 预设插件集合（如 `@babel/preset-env`）。
- **browserslist**：用查询串声明目标浏览器，供 Babel/Autoprefixer 等共享。

---

## 2. Babel 工作机制（三步）

```
源码 ──parse──▶ AST ──transform──▶ 新 AST ──generate──▶ 目标代码
```

```js
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: '> 0.5%, last 2 versions' }],
  ],
  plugins: ['@babel/plugin-transform-runtime'],
}
```

!!! danger "preset-env 与 browserslist 联动"
    `@babel/preset-env` 根据 **browserslist** 决定转译到什么程度。没配 browserslist → 默认转译到很老，产物臃肿；配了 → 只补目标浏览器缺的，产物更小。

---

## 3. core-js 与 polyfill 策略

| 策略 | 说明 | 适用 |
|------|------|------|
| `useBuiltIns: 'usage'` | 按代码中用到的 API 自动注入 polyfill | 应用（最省体积） |
| `useBuiltIns: 'entry'` | 入口处按 targets 全量引入 | 简单粗暴 |
| `@babel/plugin-transform-runtime` | polyfill 从 `@babel/runtime` 引入，避免全局污染 | **库/组件包**（不污染全局） |

```js
// .browserslistrc
last 2 Chrome versions
> 0.5%
not dead
```

!!! danger "库不要污染全局"
    写**可发布组件库**必须用 `transform-runtime`，否则你的 polyfill 会覆盖使用方环境的原生实现，引发诡异 bug。应用项目可用 `usage`。

---

## 4. TypeScript 编译

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true
  }
}
```

| 工具 | 角色 | 速度 |
|------|------|------|
| **tsc** | 类型检查 +  emit JS（权威类型检查） | 慢 |
| **esbuild** | 仅擦除类型（不检查），转译快 | ⚡ 极快 |
| **SWC** | Rust 实现，转译 + 部分类型擦除 | ⚡ 极快 |
| **Vite** | 开发用 esbuild，类型检查交给 `tsc --noEmit` | 快 |

!!! danger "Vite 不检查类型"
    Vite 开发服务器用 esbuild 只擦类型、不报错。类型错误要靠 `tsc --noEmit` 或 IDE/CI 检查，否则类型 bug 溜进运行时。

---

## 5. 自检清单

- [ ] 我配置了 browserslist，且 preset-env 与它联动
- [ ] 应用用 `useBuiltIns: 'usage'` 控制 polyfill 体积
- [ ] 库/组件包用 `transform-runtime` 避免全局污染
- [ ] 严格模式 `strict: true` 已开
- [ ] 类型检查由 `tsc --noEmit` 或 CI 兜底（不依赖 Vite）

---

## 6. 下一步

- Babel/TS 产物怎么打包 → [构建工具](../build-tools/index.md)
- CSS 侧的增强 → [CSS 工具链](../css-toolchain/index.md)
- 框架里的 TS → [TS 基础](../../ts/terminology-basic.md)
