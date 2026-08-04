# 🎨 HTML5 / CSS3 篇

> 一切前端的基础。内容依据 **W3C HTML5 / CSS3 规范**、**WHATWG HTML 标准**、**MDN** 与 **web.dev**。本篇包含多个**纯前端可运行 Demo**（无需联网）。

!!! info "先掌握核心术语"
    正式学习前，建议先阅读 [HTML5 / CSS3 核心术语（专业词汇速查）](glossary.md)：系统梳理了标签/元素/属性、DOM、语义化、内容模型、层叠、层叠上下文、盒模型、格式化上下文（BFC/IFC/FFC/GFC）、文档流、包含块、margin 塌陷、值的四形态、重排/重绘/合成等核心词汇，全部依据 **WHATWG / W3C 官方标准、MDN、ECMA-262 与 web.dev 等社区规范文档** 解释。遇到不懂的术语可随时回查。

---

## 1. 语义化标签

语义化让结构有意义，利于 SEO 与无障碍（屏幕阅读器）。

=== "语义化写法（推荐）"
    ```html
    <header><nav>...</nav></header>
    <main>
      <article>
        <h1>标题</h1>
        <section>正文</section>
      </article>
    </main>
    <footer>页脚</footer>
    ```

=== "div 滥用（不推荐）"
    ```html
    <div class="header"><div class="nav">...</div></div>
    <div class="main"><div class="post">...</div></div>
    <div class="footer"></div>
    ```

!!! tip "常用语义标签"
    `header` / `nav` / `main` / `article` / `section` / `aside` / `footer` / `figure` / `time` / `mark`。

---

## 2. Flex / Grid 布局

**经验法则**：一维排列用 **Flex**，二维网格用 **Grid**。

=== "Flex（一维）"
    ```css
    .container { display: flex; gap: 8px; justify-content: center; align-items: center; }
    ```

=== "Grid（二维）"
    ```css
    .container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    ```

### 可运行 Demo：Flex vs Grid

<iframe src="../demos/html-css-flexgrid.html" width="100%" height="240" style="border:1px solid #2c5364;border-radius:8px"></iframe>

---

## 3. 动画与过渡

=== "transition（过渡）"
    ```css
    .btn { transition: transform .2s, background .2s; }
    .btn:hover { transform: scale(1.08); }
    ```

=== "@keyframes（关键帧动画）"
    ```css
    .box { animation: spin 2s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    ```

### 可运行 Demo：动画

<iframe src="../demos/html-css-animation.html" width="100%" height="240" style="border:1px solid #2c5364;border-radius:8px"></iframe>

---

## 4. 响应式与媒体查询

```css
/* 移动优先：默认小屏样式，大屏覆盖 */
.container { padding: 12px; }
@media (min-width: 768px) {
  .container { max-width: 720px; margin: 0 auto; }
}
@media (min-width: 1200px) {
  .container { max-width: 1140px; }
}
```

!!! tip "现代做法"
    优先用 **Flex/Grid 的自动换行 + `clamp()` / `min()`** 做流式响应，媒体查询只在"断点级差异"时使用，代码更少更稳。

!!! info "移动端深入"
    响应式只是起点。屏幕碎片化、异形屏安全区、`100dvh` 视觉视口、折叠屏与容器查询等移动端专项难点，见 [移动端专项：难点与 2026 视觉演进](../mobile/index.md)。

---

## 5. 新特性（HTML5 / CSS3）

- **`<dialog>`**：原生对话框，`showModal()` 打开。
- **`<details>` / `<summary>`**：原生折叠，无需 JS。
- **CSS 变量**：`--primary: #00e5ff; color: var(--primary);`
- **`clamp()`**：`font-size: clamp(1rem, 2vw, 1.5rem);` 流式字号。
- **`aspect-ratio`**：`aspect-ratio: 16 / 9;` 控制宽高比。
- **容器查询（Container Queries）**：`@container` 按父容器尺寸响应。

```html
<details>
  <summary>点击展开</summary>
  <p>原生折叠内容，无需 JS。</p>
</details>
```

---

## 6. 核心原理与渲染机制

> **本章节是 CSS 最底层、最核心的知识**，依据 **W3C CSS 规范（CSS 2.1 + CSS 3 各模块）**、**MDN** 及浏览器渲染引擎（Chromium Blink / Firefox Gecko / WebKit）的实际行为撰写。无论你用的是 Vue、React 还是原生，这些机制都不变——CSS 最终渲染只认浏览器引擎。

### CSS 从定义到屏幕渲染：完整管线

一句话总结：**你在 `.css` 文件里写的一行 `color: red`，到屏幕上变成一个红色像素，中间经过了至少 6 个阶段**。

<div class="flow-chart" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;font-size:.78rem;font-weight:600;padding:12px 0;line-height:1.3;">
  <div style="background:var(--md-code-bg-color);border:2px solid #4fc3f7;border-radius:8px;padding:6px 12px;text-align:center;">① 解析 HTML/CSS<br/><span style="font-size:.65rem;color:#90a4ae;">HTML→DOM 树<br/>CSS→CSSOM 树</span></div>
  <span style="color:#4fc3f7;font-size:1.1rem;">→</span>
  <div style="background:var(--md-code-bg-color);border:2px solid #4fc3f7;border-radius:8px;padding:6px 12px;text-align:center;">② 样式计算<br/><span style="font-size:.65rem;color:#90a4ae;">层叠 / 继承 / 计算值<br/>生成 Computed Style</span></div>
  <span style="color:#4fc3f7;font-size:1.1rem;">→</span>
  <div style="background:var(--md-code-bg-color);border:2px solid #81c784;border-radius:8px;padding:6px 12px;text-align:center;">③ 布局<br/><span style="font-size:.65rem;color:#90a4ae;">盒模型 / 格式化上下文<br/>算出元素位置与尺寸</span></div>
  <span style="color:#81c784;font-size:1.1rem;">→</span>
  <div style="background:var(--md-code-bg-color);border:2px solid #81c784;border-radius:8px;padding:6px 12px;text-align:center;">④ 绘制<br/><span style="font-size:.65rem;color:#90a4ae;">生成绘制指令<br/>（display lists）</span></div>
  <span style="color:#ffb74d;font-size:1.1rem;">→</span>
  <div style="background:var(--md-code-bg-color);border:2px solid #ffb74d;border-radius:8px;padding:6px 12px;text-align:center;">⑤ 合成<br/><span style="font-size:.65rem;color:#90a4ae;">图层合并 / GPU 合成<br/>（compositing）</span></div>
  <span style="color:#ef5350;font-size:1.1rem;">→</span>
  <div style="background:var(--md-accent-fg-color);color:#1a1a2e;border-radius:8px;padding:6px 14px;font-weight:700;text-align:center;">⑥ 像素<br/><span style="font-size:.65rem;color:#37474f;">屏幕显示</span></div>
</div>

!!! info "每个阶段干了什么"
    | 阶段 | 输入 | 输出 | 谁负责 |
    |------|------|------|--------|
    | ① 解析 | HTML 文本 + CSS 文本 | DOM 树 + CSSOM 树 | HTML/CSS Parser |
    | ② 样式计算 | DOM + CSSOM | 每个 DOM 节点的 **Computed Style** | Style Engine |
    | ③ 布局 | Computed Style + DOM | **Layout Tree**（含位置/尺寸的渲染树） | Layout Engine |
    | ④ 绘制 | Layout Tree | **Display List**（绘制指令序列） | Paint Engine |
    | ⑤ 合成 | Display List + 图层树 | **Compositor Frame**（GPU 纹理合成） | Compositor |
    | ⑥ 像素 | Compositor Frame | 屏幕像素 | GPU / OS |

### 阶段 ①：浏览器如何解析你写的 CSS

```
┌─────────────────────────────────────────────────────────────────┐
│  用户写的 .css 文件                                             │
│  .box { color: red; display: none; width: calc(100% - 20px); } │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  CSS 解析器（CSS Parser）                                       │
│  1. 词法分析：color → IDENT, : → COLON, red → HASH_IDENT...    │
│  2. 语法分析：构建 CSSStyleRule 对象                            │
│  3. 遇到无效声明？→ 静默丢弃，不影响其他声明                     │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  CSSOM（CSS Object Model）                                      │
│  一个 CSSStyleSheet 对象树，包含所有规则                        │
│  可通过 document.styleSheets 在 JS 中读取                       │
└─────────────────────────────────────────────────────────────────┘
```

!!! warning "CSS 解析的关键特性"
    - **错误容错**：`p { color: red; foobar: 123; }` 中 `foobar: 123` 会被静默丢弃，`color: red` 正常工作。
    - **阻塞渲染**：CSS 是**渲染阻塞资源**（render-blocking）—— 浏览器必须等待所有 `<link>` 和 `<style>` 中的 CSS 解析完才能开始渲染（否则会出现 FOUC / 无样式闪烁）。
    - **不阻塞 DOM 解析**：CSS 不阻塞 DOM 构建，只阻塞渲染和 `DOMContentLoaded` 之前的阶段。

### 阶段 ②：样式计算 — 层叠（Cascade）、继承、计算值

这是整个 CSS 系统中最核心、也最容易被误解的阶段。浏览器拿到 DOM + CSSOM 之后，为 **每一个 DOM 节点** 计算出 **Computed Style**（最终生效的样式）。

#### 层叠（The Cascade）—— 「最后的赢家」规则

当多个规则匹配同一个元素时，浏览器按以下优先级从低到高选出「赢家」：

```
优先级 低 ─────────────────────────────────────────── 高 →

1. 用户代理样式    →   2. 用户样式    →   3. 作者样式
   (浏览器默认)         (极少用)           (你写的 CSS)
                                              │
                          ┌───────────────────┘
                          ▼
                   在作者样式内部按：
                   ① !important 标记（有 > 无）
                   ② 选择器优先级（Specificity）
                   ③ 源码顺序（后写的覆盖先写的）
```

#### 选择器优先级（Specificity）—— 精确计算公式

Specificity 是一个 `(a, b, c, d)` 四元组：

| 级别 | 选择器类型 | 权重 |
|------|-----------|------|
| **a** | 内联 `style=""` | 1, 0, 0, 0 |
| **b** | ID 选择器 `#id` | 0, 1, 0, 0 |
| **c** | class / 属性 / 伪类 `.class`、`[attr]`、`:hover` | 0, 0, 1, 0 |
| **d** | 元素 / 伪元素 `div`、`::before` | 0, 0, 0, 1 |

```css
/* 优先级计算示例 */
a.link:hover                 /* (0,0,2,1) → 0210 */
#main .box ul li:first-child /* (0,1,2,2) → 1220 */
style="color: red"           /* (1,0,0,0) → 1000 最高！ */
```

!!! warning "关键误区"
    - `*` 通配符的 specificity = `(0,0,0,0)`，不影响优先级。
    - `:not()` 本身不算，只计算其参数的选择器。`:is()`、`:where()` 有各自规则——`:is()` 取参数中最高优先级；`:where()` 永远为 `(0,0,0,0)`。
    - **`!important` 不改变 specificity**，它是另一个维度的优先级。有 `!important` 永远 > 没有 `!important`。

#### 继承（Inheritance）

CSS 属性分为**可继承**和**不可继承**两类：

| 可继承（默认继承父元素） | 不可继承（默认用初始值） |
|--------------------------|--------------------------|
| `color`、`font-*`、`line-height`、`text-align`、`visibility`、`cursor`、`letter-spacing`、`word-spacing`、`white-space`、`list-style` | `display`、`width`、`height`、`margin`、`padding`、`border`、`background`、`position`、`z-index`、`overflow` |

```css
/* 继承示例 */
.parent { color: red; font-size: 16px; border: 2px solid blue; }
.child { /* 空规则 */ }
/* 结果：.child 文字红色 (继承)、字号 16px (继承)、没有边框 (不可继承) */
```

CSS 提供了 4 个关键字来精确控制继承行为：

```css
.child { color: inherit; }  /* 强制继承父元素值 */
.child { color: initial; }  /* 重置为属性的初始值（color → 黑色） */
.child { color: unset; }    /* 可继承属性 = inherit；不可继承 = initial */
.child { color: revert; }   /* 回退到用户代理/浏览器默认样式 */
```

#### 计算值（Computed Value）的形成过程

一个 CSS 属性从声明到最终「像素值」，经过 4 种值形态：

```
Specified Value（指定值）
    ↓ 层叠决出赢家
Cascaded Value（层叠值）
    ↓ inherit / initial 关键字处理
Specified Value（最终指定值）
    ↓ 相对单位解析 → em→px, %→px, calc()→计算
Computed Value（计算值）
    ↓ 布局阶段 → auto→具体px, % 根据父容器→具体px
Used Value（使用值）
    ↓ 屏幕 DPR / 缩放
Actual Value（实际值）→ 最终像素
```

```css
/* 值形态变化实战 */
.box { width: 50%; font-size: 1.2em; }
/*                                  ↑ 指定值: 1.2em
 * 父元素 font-size = 16px →  1.2 × 16 →     计算值: 19.2px
 * 布局后 width: 50%     →  50% × 父容器 500px → 使用值: 250px
 * DPR=2                →  250 × 2 →          实际像素: 500px
 */
```

### 阶段 ③：盒模型与视觉格式化模型

浏览器拿到所有元素的 Computed Style 后，开始计算位置和尺寸。这一步涉及两个核心概念。

#### 盒模型（Box Model）

每个元素在布局中都是一个矩形盒子，从内到外：

```
┌─────────────────────────────────────┐
│               margin                │  外边距（透明）
│  ┌───────────────────────────────┐  │
│  │            border             │  │  边框
│  │  ┌─────────────────────────┐  │  │
│  │  │         padding         │  │  │  内边距
│  │  │  ┌───────────────────┐  │  │  │
│  │  │  │     content       │  │  │  │  内容区
│  │  │  │                   │  │  │  │
│  │  │  └───────────────────┘  │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

`box-sizing` 决定了 `width` / `height` 控制的是哪一层：

```css
/* content-box（默认） */
.box { box-sizing: content-box; width: 200px; padding: 20px; border: 5px solid; }
/* 实际占用宽度 = 200 + 20×2 + 5×2 = 250px —— 容易溢出 */

/* border-box（推荐） */
.box { box-sizing: border-box; width: 200px; padding: 20px; border: 5px solid; }
/* 实际占用宽度 = 200px —— padding 和 border 内含在 width 里 */
```

```css
/* ⭐ 全局统一初始化：所有项目都应该加 */
*, *::before, *::after { box-sizing: border-box; }
```

!!! warning "margin 塌陷（Collapse）"
    垂直方向相邻的**块级**元素的 `margin-top` 和 `margin-bottom` 会**合并取最大值**：
    ```html
    <div style="margin-bottom:30px">上</div>
    <div style="margin-top:20px">下</div>
    <!-- 间距 = max(30, 20) = 30px，不是 50px！ -->
    ```
    **触发条件**：同一 BFC 内的相邻块级父子/兄弟元素。  
    **避免方法**：用 `padding` 替代；触发 BFC 隔离；使用 Flex/Grid（其容器内不会塌陷）。

#### 视觉格式化模型（Visual Formatting Model）

这是 CSS 2.1 规范定义的核心机制——浏览器用什么规则把盒子放到页面上。每个盒子属于一个**格式化上下文**。

| 上下文 | 触发方式 | 行为 |
|--------|---------|------|
| **BFC**（块级格式化上下文） | `overflow: hidden/auto/scroll`、`display: flow-root`、`float`、`position: absolute/fixed`、`display: inline-block` | 内部块级盒子垂直排列，清除浮动，隔离 margin 塌陷 |
| **IFC**（行内格式化上下文） | 默认（包含行内元素的块容器） | 行内元素水平排列，`vertical-align`、`line-height` 生效 |
| **FFC**（Flex 格式化上下文） | `display: flex / inline-flex` | Flex 子项按主轴/交叉轴排列 |
| **GFC**（Grid 格式化上下文） | `display: grid / inline-grid` | Grid 子项按行列网格排列 |

```css
/* BFC 的三大实战用途 */

/* ① 清除浮动（最经典用法） */
.clearfix { display: flow-root; }

/* ② 防止 margin 塌陷到父元素外部 */
.bfc-parent { overflow: hidden; }
.bfc-parent > :first-child { margin-top: 30px; } /* 被 BFC 隔离 */

/* ③ 自适应两栏布局（左固定 + 右自适应） */
.left  { float: left; width: 200px; }
.right { overflow: hidden; } /* BFC 不环绕 float */
```

#### 层叠上下文（Stacking Context）

决定谁在「上面」的不是简单的 `z-index` 数字大小，而是**层叠上下文**：

```
每个层叠上下文内部独立排序（从下到上）：
① 当前上下文的根（background / border）
② z-index 为负值的子级
③ 常规流中的块级盒子
④ 浮动盒子
⑤ 常规流中的行内盒子
⑥ z-index: 0 的定位元素 / transform 子项 / flex/grid 子项
⑦ z-index 为正值的定位元素 → 数值越大越靠前
```

```css
/* 创建新层叠上下文的常见方式 */
.new-context {
  position: relative; z-index: 0;   /* 定位 + z-index */
  opacity: 0.99;                    /* opacity < 1 */
  transform: translateZ(0);         /* 任何 transform */
  /* filter, perspective, clip-path, mask, isolation: isolate,
     will-change（部分属性）也都创建新上下文 */
}
```

!!! danger "z-index 失效的真相：层叠上下文隔离"
    ```css
    .parent   { position: relative; z-index: 1; }  /* 创建上下文 A，z=1 */
    .child    { position: absolute; z-index: 999; } /* 在上下文 A 中排 999 */
    .outside  { position: relative; z-index: 2; }  /* 在根上下文中 z=2 > parent 的 z=1 */
    ```
    `.child` 的 `z-index: 999` 只在 `.parent` 上下文中有效。`.outside` 的 `z-index: 2` 在根上下文中，2 > 1，所以 `.outside` 在上层。**z-index 不是全局排名，仅在同一层叠上下文中比较。**

### 阶段 ④⑤⑥：绘制、合成与像素

#### 绘制（Paint）

布局完成后，浏览器按顺序生成绘制指令：

1. 背景色 / 背景图
2. 边框
3. 阴影（`box-shadow`）
4. 文字内容
5. `outline`（轮廓）

```css
/* 只触发重绘（Repaint）的属性 */
.element { color: red; background: blue; box-shadow: 0 0 5px; }
/* 改这些 → 只走 Paint 阶段，不重新布局，代价中等 */
```

#### 合成（Composite）

浏览器将页面分成多个**图层**，在 GPU 上独立合成：

```css
/* 创建独立合成层（GPU 加速）的属性 */
.gpu-layer {
  transform: translate3d(0, 0, 0);  /* 或任何 3D transform */
  will-change: transform;            /* 提前告知浏览器准备图层 */
}
/* 修改 transform 或 opacity → 只触发 Composite，跳过 Layout 和 Paint */
```

#### 性能排序：不同属性触发不同阶段

| 触发阶段 | 属性示例 | 代价 | 典型场景 |
|----------|---------|:---:|---------|
| **Composite Only** | `transform`、`opacity` | 最低 | 动画、滚动视差 |
| **Paint + Composite** | `color`、`background`、`box-shadow`、`border-color` | 中等 | 主题切换、hover 效果 |
| **Layout + Paint + Composite** | `width`、`height`、`margin`、`padding`、`top`、`left`、`font-size`、`display` | 最高 | 响应式布局 |

!!! tip "性能铁律"
    **动画只用 `transform` 和 `opacity`** —— 这就是为什么所有动画库（Framer Motion、GSAP）都优先使用这两个属性。改动前问问自己：这个属性会在 layout / paint / composite 哪个阶段触发重算？

---

### CSS 渲染机制：完整可运行 Demo

以下 Demo 直观展示**层叠、继承、BFC 隔离、盒模型差异、margin 塌陷、层叠上下文**六大核心概念：

<iframe src="../demos/html-css-render-model.html" width="100%" height="580" style="border:1px solid #2c5364;border-radius:8px"></iframe>

---

### 兼容性查询与处理

#### 如何查询兼容性

| 工具 | 用途 | 地址 |
|------|------|------|
| **Can I Use** | 查询特性在各浏览器的支持情况 | `caniuse.com` |
| **MDN Browser Compat Data** | 每个 CSS 属性页底部标注兼容性 | `developer.mozilla.org` |
| **`@supports`** | CSS 原生特性检测指令 | 见下文 |
| **`CSS.supports()`** | JS 中检测特性支持 | `CSS.supports('display', 'grid')` |

#### @supports —— CSS 原生特性检测

```css
/* 基础用法 */
@supports (display: grid) {
  .container { display: grid; }
}
@supports not (display: grid) {
  .container { display: flex; }  /* 降级方案 */
}

/* 组合检测 */
@supports (display: grid) and (gap: 1rem) {
  .layout { display: grid; gap: 1rem; }
}

/* 选择器检测（较新语法） */
@supports selector(:has(a)) {
  .card:has(img) { border-color: blue; }
}
```

```js
// JavaScript 端特性检测
if (CSS.supports('container-type', 'inline-size')) {
  // 支持容器查询
} else {
  // 降级：用 @media 或 ResizeObserver
}
```

#### 渐进增强 vs 优雅降级

```
渐进增强 (Progressive Enhancement):
  基础功能 → 检测支持 → 增强体验
  先保证所有人都能用，再给支持的浏览器加分

优雅降级 (Graceful Degradation):
  完整体验 → 检测不支持 → 降级处理
  先做最好，不支持的给替代方案
```

```css
/* 渐进增强示例：渐变色背景 */
.button {
  background: #333;               /* 所有浏览器能用的基础色 */
}
@supports (background: linear-gradient(135deg, #667eea, #764ba2)) {
  .button {
    background: linear-gradient(135deg, #667eea, #764ba2); /* 增强 */
  }
}
```

#### 常见兼容性差异与处理方案

| 问题 | 影响范围 | 处理方案 |
|------|---------|---------|
| `gap` in Flexbox | Safari < 14.1 不支持 flex 的 `gap` | 用 `margin` 作为 fallback：`@supports not (gap: 1rem) { .flex > * { margin: 4px; } }` |
| `position: sticky` | IE 完全不支持 | 回退到 `position: static`，sticky 失效时元素仍在原位 |
| `:focus-visible` | Safari < 15.4 | 双写 `:focus` + `:focus-visible` |
| `aspect-ratio` | Safari < 15 | 经典 hack：`padding-bottom: 56.25%` |
| `backdrop-filter` | Firefox < 103（需手动开启） | 降级：用半透明 `background` 替代 |
| CSS Nesting | Chrome 120+、Safari 17.2+ | PostCSS / Sass 编译为平面选择器 |
| `view-transition` | 仅 Chrome 111+ | 纯增强特性，不支持时无任何副作用 |
| `@container`（容器查询） | Chrome 105+、Safari 16+ | 降级使用 `@media` 或 `ResizeObserver` |

#### Autoprefixer —— 自动化前缀

工业级项目不应手写浏览器前缀，用 **Autoprefixer**（Vite 内置 PostCSS 支持）：

```js
// postcss.config.js
module.exports = {
  plugins: [require('autoprefixer')],
}
```

```json
// package.json
{
  "browserslist": ["> 1%", "last 2 versions", "not dead"]
}
```

```css
/* 你写的 */
.box { user-select: none; }

/* Autoprefixer 自动输出 */
.box {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
```

!!! tip "兼容性处理四项原则"
    1. **能用标准写法就用标准写法**，让 Autoprefixer 处理前缀。
    2. **用 `@supports` 做特性检测**，而不是浏览器 UA 检测。
    3. **渐进增强是最佳兼容策略**：不支持的浏览器少一些花哨，核心功能不受损。
    4. **动手前先查 Can I Use**，不凭记忆猜测。

---

## 7. 踩坑（注意事项）

!!! warning "常见坑"
    - **Flex 子项被压扁**：默认 `flex-shrink: 1`，内容过长会被压缩；需 `flex-shrink: 0` 或 `min-width: 0`。
    - **Grid 与 Flex 混用**：别一维硬套 Grid，反而复杂。
    - **`z-index` 失效**：先检查是否在同一层叠上下文；或元素是否 `position: static`。
    - **`transition` 不生效**：只对"可插值"属性有效（如 `display: none ↔ block` 不能过渡，用 `opacity + visibility + pointer-events` 替代）。
    - **`margin` 塌陷**：垂直相邻块级元素的 margin 合并，不是 bug 是规范设计。用 Flex/Grid 或 BFC 隔离即可。

---

## 8. 学习经验

!!! tip "经验"
    - 布局先想清楚"一维还是二维"，再决定 Flex 还是 Grid。
    - CSS 变量 + BEM 命名，能让样式可维护很多。
    - 理解渲染管线 → 知道什么时候用 `transform` 而不是 `top/left` → 性能天差地别。
    - `@supports` + Can I Use = 现代前端兼容性工作的全部工具。

---

## 9. 总结

| 主题 | 要点 |
|------|------|
| 语义化 | header / nav / main / article / footer |
| 布局 | Flex（一维）/ Grid（二维） |
| 动效 | transition / @keyframes |
| 响应式 | 移动优先 + 流式单位 |
| 新特性 | dialog / details / 变量 / clamp / 容器查询 |
| 渲染管线 | 解析→样式计算→布局→绘制→合成→像素 |
| 层叠 | !important > Specificity(a,b,c,d) > 源码顺序 |
| 继承 | color/font 可继承；width/display 不可继承 |
| 盒模型 | content-box vs border-box；margin 塌陷；BFC 隔离 |
| 兼容性 | Can I Use + @supports + Autoprefixer + 渐进增强 |
