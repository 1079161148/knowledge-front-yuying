# 🛠️ 工程化篇 · 总览

> 工程化 = 把"软件工程的方法与工具"用到前端，让多人协作、长期维护、稳定交付成为可能。本篇是入口，下面拆成 **12 个细分章节**，从"构建工具 → 模块化 → 组件化 → 版本控制 → CI/CD → 规范 → 测试 → 性能 → 工具链 → Monorepo → 文档环境"全链路覆盖。
>
> 权威来源与社区最佳实践：[Vite 官方文档](https://vitejs.dev/guide/)、[Webpack 官方文档](https://webpack.js.org/concepts/)、[pnpm 官方文档](https://pnpm.io/)、[Git 官方文档](https://git-scm.com/doc)、[GitHub Actions 文档](https://docs.github.com/actions)、[ESLint 文档](https://eslint.org/docs/latest/)、[Vitest 文档](https://vitest.dev/)、[Conventional Commits](https://www.conventionalcommits.org/)。

---

## 一、工程化到底管什么（10 个方面）

| # | 方面 | 解决的核心问题 | 对应细分章节 |
|---|------|----------------|--------------|
| 1 | 项目构建工具 | 把源码转成浏览器能跑的产物 | [构建工具](build-tools/index.md) |
| 2 | 模块化开发 | 代码拆分/聚合、依赖管理 | [模块化](modularization/index.md) |
| 3 | 组件化开发 | UI 拆成可复用单元、样式隔离 | [组件化](componentization/index.md) |
| 4 | 版本控制 | 协作、回溯、分支管理 | [版本控制](version-control/index.md) |
| 5 | CI/CD | 自动构建/测试/部署 | [CI/CD](cicd/index.md) |
| 6 | 静态代码分析 | 质量、格式、提交规范 | [静态代码分析](code-quality/index.md) |
| 7 | 单元测试/集成测试 | 回归防护、重构安全 | [测试](testing/index.md) |
| 8 | 性能优化 | 加载快、交互流畅 | [性能优化](performance/index.md) |
| 9 | JS/CSS 工具链 | 语法增强、兼容、原子化 | [JS 工具链](js-toolchain/index.md) · [CSS 工具链](css-toolchain/index.md) |
| 10 | 依赖管理与 Monorepo | 多包仓库、依赖治理 | [Monorepo](monorepo/index.md) |
| + | 文档生成与环境变量 | 可维护性、配置安全 | [文档与环境](docs-and-env/index.md) |

---

## 二、选型速览（新版推荐）

| 层 | 推荐选型 | 说明 |
|----|----------|------|
| 包管理 | **pnpm** | 快、省磁盘、严格依赖隔离 |
| 构建（新项目） | **Vite** | 原生 ESM 开发服务器 + Rollup 生产构建 |
| 构建（老/兼容 Webpack） | **Rspack** | Webpack 配置兼容，Rust 提速 |
| 转译加速 | **esbuild** / **SWC** | 替代 Babel 慢路径 |
| 规范 | ESLint + Prettier + Stylelint + Commitlint + Husky | 质量 + 格式 + 提交 + 钩子 |
| 测试 | **Vitest**（单元）+ **Playwright**（E2E） | 与 Vite 同源、快 |
| 仓库组织 | pnpm workspace + Turborepo / Nx | 任务编排 + 缓存 |
| 流水线 | GitHub Actions / GitLab CI | 免费、生态全 |

---

## 三、新人学习路径建议

1. 先懂 [模块化](modularization/index.md) 和 [构建工具](build-tools/index.md) 的"为什么"，再选工具不迷糊。
2. 把 [静态代码分析](code-quality/index.md) 一次性配好，长期收益最大。
3. 用 [版本控制](version-control/index.md) 的规范工作流协作。
4. 上 [CI/CD](cicd/index.md) 让每次 push 自动检查。
5. 用 [测试](testing/index.md) 守住核心逻辑，用 [性能优化](performance/index.md) 守住体验。

---

## 四、常见坑（总览级）

!!! warning "工程化反面教材"
    - **工具堆砌**：不是工具越多越好，按团队规模渐进引入。
    - **phantom 依赖**：npm/yarn 扁平化下能 import 未声明包；pnpm 严格隔离会直接报错（这是好事）。
    - **ESLint 与 Prettier 打架**：务必加 `eslint-config-prettier`。
    - **Node 版本漂移**：`package.json` 写 `engines` + `.nvmrc` 锁版本。

---

## 五、细而全章节地图（建议按顺序读）

- [项目构建工具](build-tools/index.md) — Webpack / Vite / Rspack / Turbopack 原理与配置
- [模块化开发](modularization/index.md) — ESM / CJS / AMD / UMD + 模块联邦 + 代码分割
- [组件化开发](componentization/index.md) — 设计原则 / 原子设计 / 受控 / 样式隔离
- [版本控制](version-control/index.md) — Git 工作流 / 分支模型 / rebase / 撤改
- [CI/CD](cicd/index.md) — GitHub Actions / GitLab CI / 缓存 / 产物 / 部署
- [静态代码分析](code-quality/index.md) — ESLint / Prettier / Stylelint / Commitlint / Husky
- [测试](testing/index.md) — Vitest / Jest / Playwright / 覆盖率
- [性能优化](performance/index.md) — Core Web Vitals / 构建期 / 运行时
- [JS 工具链](js-toolchain/index.md) — Babel / core-js / browserslist / TS 编译
- [CSS 工具链](css-toolchain/index.md) — PostCSS / Tailwind / 原子化 / Scoped
- [Monorepo 与依赖管理](monorepo/index.md) — pnpm workspace / Turbo / Nx
- [文档生成与环境变量](docs-and-env/index.md) — JSDoc / Storybook / .env
