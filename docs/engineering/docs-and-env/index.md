# 📝 文档生成与环境变量

> 可维护性 = 代码能看懂、配置不泄密。本篇覆盖 **JSDoc / TypeDoc 自动文档、Storybook 组件文档、多环境配置（.env）、环境变量安全**，基于官方实践。
>
> 权威来源：[JSDoc](https://jsdoc.app/)、[TypeDoc](https://typedoc.org/)、[Storybook](https://storybook.js.org/)、[Dotenv](https://github.com/motdotla/dotenv)、[The Twelve-Factor App（Config）](https://12factor.net/config)。

---

## 1. 术语表

- **JSDoc / TSDoc**：注释规范，可被工具提取成文档或增强类型提示。
- **Storybook**：隔离式组件开发/文档环境，每个"story"是一个用例。
- **.env**：存放环境变量的文件，按 `.env.development` / `.env.production` 区分。
- **Secret**：密码/Token/密钥，**绝不**进仓库。

---

## 2. 代码文档：JSDoc / TypeDoc

```js
/**
 * 计算两数之和
 * @param {number} a - 第一个数
 * @param {number} b - 第二个数
 * @returns {number} 和
 */
export function add(a, b) { return a + b }
```

- **JSDoc**：纯 JS 注释，IDE 自动提示，可配 `jsdoc` 插件做校验。
- **TypeDoc**：TS 项目直接由类型生成 HTML 文档站。

!!! danger "注释别写废话"
    `@param a - 第一个数` 这种复述变量名的注释没价值。注释应说明**意图、边界、副作用**，不是翻译代码。

---

## 3. 组件文档：Storybook

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'
const meta: Meta<typeof Button> = { title: 'UI/Button', component: Button }
export default meta
export const Primary: StoryObj<typeof Button> = { args: { variant: 'primary' } }
```

价值：组件可视化预览 + 交互测试 + 视觉回归（配合 Chromatic）。

---

## 4. 环境变量（多环境）

```bash
# .env.development
VITE_API_BASE=/api
# .env.production
VITE_API_BASE=https://api.example.com
```

```js
// 使用（Vite 暴露 VITE_ 前缀）
fetch(import.meta.env.VITE_API_BASE + '/users')
```

!!! danger "环境变量安全红线（最重要）"
    - **前端构建产物里所有 `VITE_*` 都是明文**，任何人可在源码里看到。**绝不在前端放密钥/数据库密码/私有 Token**。
    - 真正保密的密钥只在**后端/CI Secrets** 里，前端最多放公开的公钥或后端 API 地址。
    - `.env` 本地文件加进 `.gitignore`；`.env.example` 可提交作模板。
    - 不同环境用不同文件，CI 注入生产变量，不依赖本地 `.env.production` 入库。

---

## 5. 配置管理原则（12-Factor）

> 配置与代码分离：同一份代码在 dev/staging/prod 跑，靠环境变量区分，不靠改代码。

!!! danger "别把环境差异写死在代码里"
    `if (location.hostname === 'xxx')` 这种环境判断是反模式。用 `import.meta.env.MODE` / 环境变量统一注入。

---

## 6. 自检清单

- [ ] 公开 API 用 JSDoc/TSDoc 标注意图与边界
- [ ] 重要组件有 Storybook 用例
- [ ] 前端只放 `VITE_` 公开变量，密钥只在后端/CI
- [ ] `.env` 已 gitignore，`.env.example` 作模板
- [ ] 环境差异靠变量注入，不写死在代码

---

## 7. 下一步

- 组件怎么设计 → [组件化](../componentization/index.md)
- 提交与发布 → [版本控制](../version-control/index.md) · [Monorepo](../monorepo/index.md)
