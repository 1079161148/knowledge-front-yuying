# 🛠️ 工程化篇

> 从"写页面"到"交付项目"的关键一跃。涵盖包管理、构建、模块化、规范、Monorepo 与 CI/CD。

---

## 1. 包管理器对比：pnpm / npm / yarn

**结论（推荐）**：新项目首选 **pnpm**（快、省磁盘、严格依赖隔离）。

=== "pnpm（推荐）"
    ```bash
    pnpm install            # 安装依赖
    pnpm add vue            # 添加生产依赖
    pnpm add -D vite        # 添加开发依赖
    pnpm dlx create-vite    # 临时执行脚手架
    ```

=== "npm"
    ```bash
    npm install
    npm install vue
    npm install -D vite
    npx create-vite
    ```

=== "yarn"
    ```bash
    yarn install
    yarn add vue
    yarn add -D vite
    yarn create vite
    ```

| 维度 | pnpm | npm | yarn |
|------|------|-----|------|
| 安装速度 | ⚡ 最快 | 中 | 快 |
| 磁盘占用 | 硬链接共享 | 各自复制 | 各自复制 |
| 依赖隔离 | 严格（默认） | 扁平（易 phantom 依赖） | 扁平 |
| 工作区 | ✅ 原生 | ✅ | ✅ |

---

## 2. 构建工具对比：Vite / Webpack / esbuild / Rspack

=== "Vite（主流）"
    ```js
    // vite.config.js
    import { defineConfig } from 'vite'
    import vue from '@vitejs/plugin-vue'
    export default defineConfig({
      plugins: [vue()],
      server: { port: 5173 },
    })
    ```

=== "Webpack（老项目）"
    ```js
    // webpack.config.js
    const path = require('path')
    module.exports = {
      entry: './src/main.js',
      output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.js' },
      module: { rules: [{ test: /\.vue$/, use: 'vue-loader' }] },
    }
    ```

=== "esbuild（极速转译）"
    ```bash
    esbuild src/main.ts --bundle --outfile=dist/out.js --loader:.ts=ts
    ```

=== "Rspack（Webpack 兼容・快）"
    ```js
    // rspack.config.js（API 与 Webpack 高度一致）
    const { defineConfig } = require('@rspack/cli')
    module.exports = defineConfig({ entry: './src/main.js' })
    ```

| 工具 | 定位 | 冷启动 | 生产构建 |
|------|------|--------|----------|
| Vite | 现代开发/构建 | ⚡ 极快（ESM 原生） | ⚡（Rollup） |
| Webpack | 老牌全功能 | 慢 | 中 |
| esbuild | 转译/压缩 | ⚡⚡ 最快 | 仅转译 |
| Rspack | Webpack 替代 | 快 | 快 |

### 可运行 Demo：浏览器原生 ESM

现代浏览器原生支持 ES Module，无需打包即可 `import`：

<iframe src="demos/engineering-esm.html" width="100%" height="160" style="border:1px solid #2c5364;border-radius:8px"></iframe>

---

## 3. 模块化：ESM / CJS / 模块联邦

=== "ESM（浏览器 / 现代 Node）"
    ```js
    // math.js
    export const add = (a, b) => a + b
    // main.js
    import { add } from './math.js'
    ```

=== "CJS（传统 Node）"
    ```js
    // math.js
    module.exports = { add: (a, b) => a + b }
    // main.js
    const { add } = require('./math.js')
    ```

!!! info "模块联邦（Module Federation）"
    微前端场景下，多个独立构建的应用可"运行时共享模块"。Vite 用 `@module-federation/vite`，Webpack 5 原生支持。适合大型团队协作的中台项目。

---

## 4. 代码规范：ESLint / Prettier / Stylelint / Commitlint

=== "ESLint 基础"
    ```js
    // .eslintrc.cjs
    module.exports = {
      root: true,
      extends: ['eslint:recommended'],
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    }
    ```

=== "Prettier（格式化）"
    ```json
    // .prettierrc
    { "semi": false, "singleQuote": true, "printWidth": 80 }
    ```

=== "Commitlint（提交规范）"
    ```json
    // commitlint.config.js
    { "extends": ["@commitlint/config-conventional"] }
    // 提交示例： feat: 新增组合式 API 示例
    ```

| 工具 | 作用 |
|------|------|
| ESLint | 代码质量 / 潜在错误 |
| Prettier | 统一格式（不打架，配合 eslint-config-prettier） |
| Stylelint | CSS / SCSS 规范 |
| Commitlint | Git 提交信息规范（Conventional Commits） |

---

## 5. Monorepo：pnpm workspace / Turborepo / Nx

=== "pnpm workspace"
    ```yaml
    # pnpm-workspace.yaml
    packages:
      - 'packages/*'
      - 'apps/*'
    ```
    ```bash
    pnpm -F web dev      # 仅运行 web 包
    pnpm -r build        # 递归构建所有包
    ```

!!! tip "Turborepo / Nx"
    在 pnpm workspace 之上提供**任务编排与缓存**（如 `turbo run build --filter=web`），避免重复构建，大型仓库提速明显。

---

## 6. CI/CD（GitHub Actions 示例）

```yaml
# .github/workflows/ci.yml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm build
```

---

## 7. 踩坑（注意事项）

!!! warning "常见坑"
    - **phantom 依赖**：npm/yarn 扁平化下能 `import` 未声明的包；pnpm 严格隔离会在运行时直接报错（这是好事，逼你显式声明）。
    - **Vite 与 Webpack 混用**：老项目迁移别一次性全切，先用 Vite 跑 dev、Webpack 跑 build 过渡。
    - **ESLint 与 Prettier 冲突**：务必加 `eslint-config-prettier` 关闭格式化规则，只让 Prettier 管格式。
    - **Node 版本**：`package.json` 写好 `engines` 与 `.nvmrc`，避免团队协作版本不一致。

---

## 8. 学习经验

!!! tip "经验"
    - 工程化不是"越多工具越好"，按团队规模渐进引入。
    - 先搞懂 ESM 与打包的"为什么"，再选 Vite/Webpack 才不迷糊。
    - 把规范（ESLint/Prettier/Commitlint）一次性配好，长期收益巨大。

---

## 9. 总结

| 层 | 推荐选型 |
|----|----------|
| 包管理 | pnpm |
| 构建（新） | Vite |
| 构建（老） | Webpack / Rspack |
| 转译加速 | esbuild |
| 规范 | ESLint + Prettier + Stylelint + Commitlint |
| 仓库组织 | pnpm workspace + Turborepo |
| 流水线 | GitHub Actions |

> 下一板块预告：**全栈框架实战**（Node / NestJS / Next.js / Nuxt.js）。
