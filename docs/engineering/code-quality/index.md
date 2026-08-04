# 🔍 静态代码分析（规范与质量）

> 静态分析 = 不运行代码就发现错误、统一风格。本篇覆盖 **ESLint（质量）、Prettier（格式）、Stylelint（CSS）、Commitlint（提交）、Husky + lint-staged（提交前卡口）**，按官方最佳实践组合。
>
> 权威来源：[ESLint 文档](https://eslint.org/docs/latest/)、[Prettier 文档](https://prettier.io/docs/en/)、[Stylelint 文档](https://stylelint.io/)、[Commitlint](https://commitlint.js.org/)、[Husky](https://typicode.github.io/husky/)。

---

## 1. 工具分工（别让它们打架）

| 工具 | 管什么 | 不管什么 |
|------|--------|----------|
| **ESLint** | 代码质量、潜在 bug、反模式 | 纯格式（交给 Prettier） |
| **Prettier** | 统一格式（引号/缩进/换行） | 逻辑错误 |
| **Stylelint** | CSS/SCSS 规范 | JS |
| **Commitlint** | Git 提交信息格式 | 代码 |
| **Husky + lint-staged** | 提交前自动跑上面的检查 | — |

!!! danger "ESLint 与 Prettier 必须解耦"
    二者规则重叠（如引号、分号）会互相覆盖报错。标准做法：Prettier 管格式，ESLint 关闭所有格式化规则并加 `eslint-config-prettier`。

---

## 2. ESLint 基础

```js
// eslint.config.js（ESM，Flat Config，ESLint 9 默认）
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
export default [
  js.configs.recommended,
  { languageOptions: { ecmaVersion: 2022, sourceType: 'module' } },
  prettier,
]
```

常用规则：
- `no-unused-vars`：未使用变量（死代码）
- `no-eval`：禁用 `eval`
- `eqeqeq`：强制 `===`
- `@typescript-eslint/no-explicit-any`：TS 里限制 `any`

!!! danger "别关掉报错规则用 // eslint-disable 掩盖"
    临时禁用要写原因且尽快修。把 `no-explicit-any` 之类全关 = 失去 TS 价值。

---

## 3. Prettier 配置

```json
// .prettierrc
{ "semi": false, "singleQuote": true, "printWidth": 80, "trailingComma": "all" }
```

---

## 4. Stylelint（CSS/SCSS）

```json
// .stylelintrc.json
{ "extends": ["stylelint-config-standard"] }
```

---

## 5. Commitlint（提交规范）

```js
// commitlint.config.js
module.exports = { extends: ['@commitlint/config-conventional'] }
// 提交示例： feat(login): 新增验证码输入框
```

---

## 6. Husky + lint-staged（提交前卡口）

```bash
# 安装
npm i -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,ts,vue,jsx,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,scss}": ["stylelint --fix"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
# .husky/commit-msg
npx --no-install commitlint --edit "$1"
```

!!! tip "为什么用 lint-staged 而不是全量 lint"
    提交前只对**暂存的文件**跑检查，秒级完成；全量 lint 在大仓库会卡很久。配合 Husky 在 `pre-commit` 钩子触发。

!!! danger "Husky 的坑"
    - 团队成员需 `npm install` 后 Husky 才装钩子；CI 里跳过钩子（CI 已单独跑 lint）。
    - 别在钩子里做耗时操作（如全量构建），会让提交卡死。

---

## 7. 自检清单

- [ ] ESLint 开了 `eslint-config-prettier`，不与 Prettier 冲突
- [ ] Prettier 规则团队统一且已格式化全仓
- [ ] Stylelint 覆盖 CSS/SCSS
- [ ] Commitlint 卡住不规范提交
- [ ] Husky + lint-staged 在 pre-commit / commit-msg 生效
- [ ] 我没有用 `eslint-disable` 掩盖真问题

---

## 8. 下一步

- 提交规范如何联动版本号 → [版本控制](../version-control/index.md)
- 钩子后接 CI → [CI/CD](../cicd/index.md)
