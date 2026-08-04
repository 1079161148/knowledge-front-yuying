# 🎨 HTML / CSS 面试题

> 语义化、盒模型、BFC、Flex/Grid、层叠上下文、响应式、选择器权重。依据 **[MDN HTML](https://developer.mozilla.org/zh-CN/docs/Web/HTML)**、**[MDN CSS](https://developer.mozilla.org/zh-CN/docs/Web/CSS)**、**[W3C CSS 规范](https://www.w3.org/TR/)**。覆盖大厂高频核心题。

---

## 1. HTML

#### Q1：语义化标签有哪些？为什么重要？
- 常见：`header` / `nav` / `main` / `article` / `section` / `aside` / `footer` / `figure` / `time`。
- 好处：结构清晰可维护、**SEO** 友好、**无障碍**（屏幕阅读器按语义导航）、浏览器/插件能更好解析。

#### Q2：`<img>` 的 `alt` 和 `title` 区别？
- `alt`：图片加载失败或无障碍场景下的替代文本，**内容图必填**（装饰图用空 `alt=""` 让读屏跳过）。
- `title`：鼠标悬停提示，纯辅助信息，非必需。

#### Q3：`<script>` 的 `defer` 和 `async` 区别？
- `defer`：并行下载，**DOM 解析完成后按顺序执行**，不阻塞解析，适合依赖 DOM 的脚本。
- `async`：并行下载，**下载完立即执行**，顺序不保证，适合独立脚本（统计/埋点）。
- 两者都在 `<head>` 中用，避免阻塞渲染。

#### Q4：浏览器从输入 URL 到渲染，HTML 解析阶段会阻塞什么？
- 解析 HTML 时遇到同步 `<script>` 会暂停解析、先执行脚本（除非 `defer/async`）；CSS 会阻塞后面 JS 的执行（JS 可能读样式），但不阻塞 HTML 解析本身。

#### Q5：`src` 和 `href` 的区别？
- `href`（`<a>`/`<link>`）：建立**引用关系**，不会把资源替进文档，如 CSS 链接。
- `src`（`<img>`/`<script>`）：**替换/嵌入**资源，下载并执行/渲染，会阻塞后续处理。

#### Q6：常见 `<meta>` 标签作用？
- `viewport`：移动端视口控制（`width=device-width, initial-scale=1`）。
- `charset`：声明编码，避免乱码。
- `description` / `keywords`：SEO。

---

## 2. CSS

#### Q1：盒模型？`box-sizing` 的作用？
- 标准盒（`content-box`）：`width` 仅内容宽，padding/border 额外增加总尺寸。
- IE 盒（`border-box`）：`width` = 内容 + padding + border。现代项目统一设 `*{box-sizing:border-box}`，布局更直观。

#### Q2：BFC 是什么？如何触发？解决什么？
- BFC（Block Formatting Context）：独立渲染区域，内部布局不影响外部。
- 触发：`overflow` 非 visible、`display: flow-root`（推荐，无副作用）、`float` 非 none、`position: absolute/fixed`、`display: flex/grid` 的直接子项。
- 解决：**清除浮动**（父容器高度塌陷）、**外边距塌陷（margin collapse）**、自适应两栏（阻止文字环绕浮动）。

#### Q3：CSS 选择器权重计算？
- 内联 `(1,0,0,0)` > ID `(0,1,0,0)` > 类/伪类/属性 `(0,0,1,0)` > 元素/伪元素 `(0,0,0,1)`。
- 例：`#nav .list li:hover` = ID1 + 类1 + 元素1 + 伪类1 = `(0,1,2,0)`。
- `!important` 优先级最高（但应尽量避免，破坏可维护性）。相同权重看源码顺序（后者胜）。

#### Q4：Flex 和 Grid 怎么选？
- Flex：**一维**（行或列）布局，适合组件内排列、对齐、自适应伸缩。
- Grid：**二维**（行列同时）布局，适合整体页面骨架、复杂网格。
- 常见组合：Grid 搭页面大骨架，Flex 排内部元素。

#### Q5：层叠上下文（stacking context）与 `z-index`？
- 形成条件：`position` 非 static + z-index、opacity<1、`transform`/`filter`/`will-change`、`display: flex/grid` 子项带 z-index 等。
- `z-index` 仅在**同一层叠上下文**内比较；跨层级比的是父级上下文的层叠顺序。

#### Q6：实现水平垂直居中的方式？
- Flex：`display:flex; justify-content:center; align-items:center;`
- Grid：`display:grid; place-items:center;`
- 绝对定位 + `transform: translate(-50%,-50%)`
- 绝对定位 + `margin:auto` + 四边 0（需定宽高）

#### Q7：响应式方案有哪些？
- 媒体查询 `@media`、相对单位 `rem`/`vw`/`vh`、`clamp()` 流式排版、Flex/Grid 自适应、`picture`/`srcset` 响应式图片、`meta viewport`。

#### Q8：重排（reflow）与重绘（repaint）区别？如何减少？
- reflow（重排）：几何变化（尺寸/位置/增删节点），成本高，会触发后续重绘。
- repaint（重绘）：外观变化（颜色/阴影），不涉几何，成本较低。
- 优化：减少逐条样式读写（批量改 class）、用 `transform`/`opacity` 走合成层（不触发重排）、`will-change` 提前提升、离线 DOM（`documentFragment`）操作。

#### Q9：如何实现 0.5px 边框（高清屏细线）？
- `transform: scaleY(0.5)` 缩放伪元素、或 `box-shadow`、或 `border-image`、或 `background` 线性渐变。

#### Q10：`display: none`、`visibility: hidden`、`opacity: 0` 区别？
- `display:none`：不占空间、不渲染、不响应事件，可能触发重排。
- `visibility:hidden`：占空间但不可见，不响应事件，不触发重排。
- `opacity:0`：占空间、可见但透明，仍响应事件，可走合成层动画。

---

## 3. 高频代码题

#### 三栏布局（左右固定、中间自适应）：
```css
/* Grid 最简单 */
.layout { display: grid; grid-template-columns: 200px 1fr 200px; }
```

#### 清除浮动：
```css
.clearfix::after { content: ''; display: block; clear: both; }
```

---

## 4. 下一步

- 运行时逻辑看 [JavaScript 面试题](js.md)。
- 实际基础讲解 → [HTML/CSS 基础](../html-css/index.md)。
