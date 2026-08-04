# 🏗️ 项目构建工具

> 构建工具 = 把源码（模块、TS、Vue/React、CSS）转成浏览器可运行的产物。本篇对比 **Webpack / Vite / Rspack / Turbopack / esbuild / Rollup** 的原理、配置与选型。
>
> 权威来源：[Vite 文档](https://vitejs.dev/guide/)、[Webpack 概念](https://webpack.js.org/concepts/)、[Rspack](https://rspack.dev/)、[esbuild](https://esbuild.github.io/)、[Rollup](https://rollupjs.org/)。

---

## 1. 术语表

- **Entry / Output**：入口文件与产物输出。
- **Loader / Plugin**：Loader 处理非 JS 资源（转译），Plugin 扩展构建流程（压缩/分包）。
- **Dev Server（HMR）**：开发服务器 + 热模块替换，改代码即时生效。
- **Bundle / Chunk**：打包产物整体 / 拆分出的代码块。
- **Dependency Graph**：从入口顺着 import 构建的依赖图，决定打什么。

---

## 2. 主流工具对比

| 工具 | 定位 | 开发服务器 | 生产打包 | 底层 |
|------|------|-----------|----------|------|
| **Vite** | 现代主流 | 原生 ESM，极快 | Rollup | esbuild(预构建) |
| **Webpack** | 老牌全功能 | 较慢 | 自身 | JS |
| **Rspack** | Webpack 兼容·快 | 快 | 自身(Rust) | Rust |
| **Turbopack** | Next.js 下一代 | 快(增量) | 实验 | Rust |
| **esbuild** | 转译/压缩 | — | 仅转译 | Go |
| **Rollup** | 库打包标杆 | — | 自身 | JS |

!!! tip "选型建议"
    - **新项目**：Vite（开发体验最好、生态全）。
    - **老 Webpack 项目想提速**：Rspack（配置高度兼容，迁移成本最低）。
    - **打 npm 库**：Rollup（输出干净、支持多种格式）。
    - **极致转译速度**：esbuild / SWC 作为底层加速。

---

## 3. Vite 配置实战

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
  build: { sourcemap: true, rollupOptions: { output: { manualChunks: { vue: ['vue'] } } } },
})
```

!!! danger "Vite 的两个关键点"
    - **开发不打包**：浏览器原生 ESM 直接加载，依赖预构建用 esbuild 转 CJS→ESM。所以 dev 快，但首屏大量请求（HTTP/2 下无碍）。
    - **生产用 Rollup**：和 dev 不是同一套机制，偶尔出现"dev 正常 build 报错" → 通常是 Rollup 更严格（如 ESM 默认 stricter、循环依赖）。

---

## 4. Webpack 核心配置

```js
// webpack.config.js
const path = require('path')
module.exports = {
  entry: './src/main.js',
  output: { path: path.resolve(__dirname, 'dist'), filename: '[contenthash].js' },
  module: { rules: [
    { test: /\.vue$/, use: 'vue-loader' },
    { test: /\.css$/, use: ['style-loader', 'css-loader'] },
  ]},
  plugins: [/* HtmlWebpackPlugin, etc. */],
}
```

!!! danger "Webpack 反面"
    - 不配 `contenthash` 文件名 → 缓存失效策略错乱。
    - `rules` 顺序敏感（从右到左/从下到上），loader 写错顺序不生效。
    - 大项目全量构建慢，用 `cache`/`thread-loader` 或干脆迁 Rspack。

---

## 5. 分包策略

```js
// 手动拆 vendor
manualChunks: { react: ['react', 'react-dom'], vendor: ['lodash-es'] }
// 或按 node_modules 自动拆
manualChunks: { vendor: /[\\/]node_modules[\\/]/ }
```

!!! danger "分包与缓存联动"
    带 `[contenthash]` 的文件名 + 长缓存（见 [性能优化](../performance/index.md)）。vendor 独立成块，业务改动不会让用户重新下载 React。

---

## 6. 自检清单

- [ ] 我理解 dev(ESM) 与生产(Rollup) 机制差异
- [ ] 产物文件名带 contenthash 以利缓存
- [ ] 我做了合理的 vendor 分包
- [ ] 知道何时选 Vite / Rspack / Rollup
- [ ] dev 代理（proxy）正确转发后端 API

---

## 7. 下一步

- 模块怎么被打包 → [模块化](../modularization/index.md)
- TS/Babel 如何接入 → [JS 工具链](../js-toolchain/index.md)
- 产物如何部署 → [CI/CD](../cicd/index.md)
