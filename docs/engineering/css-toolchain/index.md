# 🎨 CSS 工具链

> CSS 工具链 = 让样式可维护、可压缩、可增强。本篇覆盖 **PostCSS、Autoprefixer、CSS Modules / Scoped、原子化（Tailwind/UnoCSS）、CSS 压缩与剪枝**，均基于官方实践。
>
> 权威来源：[PostCSS 文档](https://postcss.org/)、[Tailwind CSS](https://tailwindcss.com/docs)、[UnoCSS](https://unocss.dev/)、[MDN CSS](https://developer.mozilla.org/zh-CN/docs/Web/CSS)。

---

## 1. 术语表

- **PostCSS**：用 JS 插件处理 CSS 的引擎（非"某个功能"），Autoprefixer 只是它的一个插件。
- **Autoprefixer**：按 browserslist 自动加 `-webkit-` 等前缀。
- **CSS Modules**：类名作用域哈希，避免全局冲突。
- **原子化（Atomic CSS）**：用预定义小类拼样式（`flex`、`p-4`），按需生成。
- **Tree Shaking CSS（Purge）**：移除未使用的样式规则。

---

## 2. PostCSS 工作流

```js
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-preset-env': { stage: 2 },  // 用新 CSS 语法（nesting 等）
    autoprefixer: {},
    cssnano: {},                          // 生产压缩
  },
}
```

```css
/* 写嵌套（stage 2 支持）*/
.card { padding: 16px; & .title { font-weight: 700; } }
```

!!! danger "Autoprefixer 依赖 browserslist"
    和 Babel 一样，前缀范围由 [browserslist](../js-toolchain/index.md) 决定。没配 → 前缀要么缺失要么过多。

---

## 3. 作用域方案

| 方案 | 机制 | 适用 |
|------|------|------|
| **CSS Modules** | 类名哈希 `styles.btn` | React/Vue 通用、JS 引用 |
| **Vue scoped** | `data-v-xxx` 属性选择器 | Vue SFC |
| **Shadow DOM** | 浏览器原生隔离 | Web Component |

---

## 4. 原子化框架

```html
<!-- Tailwind -->
<button class="px-4 py-2 rounded bg-blue-600 text-white">提交</button>
```

| 框架 | 特点 |
|------|------|
| **Tailwind CSS** | 生态最大、JIT 按需生成 |
| **UnoCSS** | 引擎级、更快、预设可组合 |
| **Windi CSS** | Tailwind 兼容的更快实现（已并入生态） |

!!! danger "原子化的坑"
    - **类名爆炸**：HTML 里塞一长串 class 可读性差 → 抽成组件/抽象层。
    - **必须配 content 扫描**：Tailwind v3+ 要 `content` 指向源码，否则 tree-shake 把用到的类也删了。
    - **别和组件库样式打架**：原子类优先级问题用层级或 `!important` 谨慎处理。

---

## 5. 压缩与剪枝

- **CssNano**：合并、去重、压缩。
- **PurgeCSS / UnCSS**：按 HTML/JS 中出现的选择器剪掉未用样式（原子化框架内置）。

!!! danger "剪枝配置错 = 样式丢失"
    `content` 路径漏了某个模板文件（如 `.vue`、动态拼接类名），会导致该文件样式被误删。构建后务必抽查关键页面样式。

---

## 6. 自检清单

- [ ] PostCSS 配了 autoprefixer + 压缩
- [ ] 前缀范围由 browserslist 控制
- [ ] 组件样式做了作用域隔离
- [ ] 原子化框架配了正确的 content 扫描路径
- [ ] 生产构建做了 CSS 剪枝且关键样式未丢失

---

## 7. 下一步

- 样式怎么写进组件 → [组件化](../componentization/index.md)
- JS 侧的增强 → [JS 工具链](../js-toolchain/index.md)
