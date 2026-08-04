# 📖 HTML5 / CSS3 核心术语（专业词汇速查）

> 在正式学习 HTML5 / CSS3 之前，先把**核心专业术语**的概念对齐清楚。本篇所有解释均依据官方标准与权威文档：
>
> | 来源 | 说明 | 地址 |
> |------|------|------|
> | **WHATWG HTML Living Standard** | HTML 的现行官方标准（取代旧版 W3C HTML5 推荐标准） | `html.spec.whatwg.org` |
> | **W3C CSS Working Group 规范** | CSS 的官方标准（按模块拆分：Cascade、Box、Display、Values 等） | `www.w3.org/TR/` |
> | **ECMA-262** | ECMAScript 语言规范（JavaScript 的官方标准，涉及脚本相关术语时引用） | `ecma-international.org` |
> | **MDN Web Docs** | Mozilla 维护的权威参考文档，含浏览器兼容性数据 | `developer.mozilla.org` |
> | **web.dev / web.dev Learn** | Google 发布的前端规范与最佳实践社区文档 | `web.dev` |
> | **Can I Use / CSS-Tricks** | 特性兼容性查询与社区深度解读 | `caniuse.com` / `css-tricks.com` |
>
> 阅读建议：每个术语都标注了它**来自哪个标准**，并给出"为什么重要"的实战提示。建议先通读一遍本篇，再进入下一章的深入讲解。

---

## 一、HTML 核心术语

### 1. 标签 / 元素 / 属性（Tag / Element / Attribute）

三者是最容易混淆但必须分清的基础概念，定义来自 **WHATWG HTML Living Standard**。

| 概念 | 定义 | 示例 |
|------|------|------|
| **标签 (Tag)** | 用尖括号包裹的标记，是 HTML 语法层面的"符号"，分开始标签 `<p>` 与结束标签 `</p>` | `<p>`、`</p>` |
| **元素 (Element)** | 由开始标签、内容、结束标签共同组成的**语义整体**，是 DOM 树中的一个节点 | `<p>文字</p>` 整体 |
| **属性 (Attribute)** | 写在开始标签内、用于配置元素行为的**键值对** | `<a href="...">` 中的 `href` |

!!! warning "常见误区"
    初学者常说"写一个 `div` 标签"，严格地说 `div` 是元素名，`<div>` 才是标签。元素的各种行为（默认样式、可访问性角色）由**元素类型**决定，而不是标签名本身。

### 2. DOCTYPE

文档类型声明，告诉浏览器用哪种**渲染模式**解析页面。

```html
<!DOCTYPE html>
```

- 来自 **WHATWG HTML Living Standard**，HTML5 的 DOCTYPE 只有这一种简洁写法。
- 作用是触发**标准模式（Standards Mode）**。若缺失或写错，浏览器会进入 **怪异模式（Quirks Mode）**，导致盒模型、百分比高度等表现与现代规范不一致。
- 实战铁律：**每个 HTML 文档第一行必须是 `<!DOCTYPE html>`**。

### 3. DOM（Document Object Model，文档对象模型）

- 定义：浏览器把 HTML 文档解析后生成的**树形对象结构**，是 JS 操作页面的接口，由 **WHATWG DOM Standard** 规范。
- 关键认知：你写在文件里的 HTML 是"源代码"，浏览器构建出的 DOM 才是"运行时结构"。JS 改的是 DOM，不是你手写的字符串。
- 与渲染的关系：DOM 树 + CSSOM 树 → 渲染树（见下一章"渲染管线"）。

### 4. 语义化（ Semantics）与语义标签

- 定义：**语义化**指用"含义明确"的标签表达内容意图，而非只用 `<div>` 堆结构。概念来自 **WHATWG HTML Living Standard** 的元素设计原则。
- 核心语义元素：`header` / `nav` / `main` / `article` / `section` / `aside` / `footer` / `figure` / `figcaption` / `time` / `mark` / `address`。
- 为什么重要（MDN）：
  - **SEO**：搜索引擎通过语义结构理解页面优先级。
  - **无障碍 (a11y)**：屏幕阅读器依赖语义元素与 ARIA 角色构建导航。
  - **可维护性**：结构自说明，减少"div 地狱"。

### 5. 内容模型（Content Model）

WHATWG 规范把元素按"能放什么、能放哪里"分类，这是理解标签能不能嵌套的根本依据：

| 内容类别 | 含义 | 代表元素 |
|----------|------|----------|
| **元数据内容 (Metadata)** | 设置文档或其余内容的呈现/行为 | `title`、`meta`、`link`、`style`、`base` |
| **流内容 (Flow)** | 构成文档主体的大多数元素 | `p`、`div`、`ul`、`table`、`form` |
| **区块内容 (Sectioning)** | 定义文档大纲的章节 | `article`、`section`、`nav`、`aside` |
| **标题内容 (Heading)** | 定义章节标题 | `h1`~`h6`、`hgroup` |
| **短语内容 (Phrasing)** | 文档中的文本级内容 | `a`、`strong`、`em`、`span`、`img` |
| **嵌入内容 (Embedded)** | 引入其他资源 | `img`、`video`、`canvas`、`iframe` |
| **交互内容 (Interactive)** | 用户可交互 | `a`、`button`、`input`、`label` |

!!! tip "实战意义"
    为什么 `<div>` 里不能放 `<li>`？因为 `<li>` 属于只能出现在 `ul`/`ol`/`menu` 内部的元素，违反内容模型会导致 DOM 被浏览器重建（HTML 解析的容错规则）。理解内容模型能预判"为什么我的结构被浏览器改了"。

### 6. 空元素（Void Elements / 自闭合元素）

- 定义：**不能包含任何内容、没有结束标签**的元素，**WHATWG HTML Living Standard** 明确定义了约 13 个。
- 列表：`area`、`base`、`br`、`col`、`embed`、`hr`、`img`、`input`、`link`、`meta`、`param`、`source`、`track`、`wbr`。
- 注意：HTML 语法中无需也不应写 `</img>`；XHTML 习惯写 `<img />` 在 HTML5 中合法但非必须。

### 7. 替换元素 / 非替换元素（Replaced / Non-replaced Elements）

- **替换元素**：内容由**外部资源**决定、浏览器不直接渲染其内容，而是"替换"为一个框。来自 **CSS 规范（CSS Display / Replaced Elements）**。
  - 典型：`img`、`video`、`canvas`、`iframe`、`input`（部分类型）、`object`。
  - 特点：通常有**固有尺寸（intrinsic size）**，可被 `width`/`height` 覆盖；`vertical-align` 对其生效。
- **非替换元素**：内容由自身文本/子元素构成，如 `div`、`span`、`p`。

!!! warning "为什么这个术语重要"
    `img` 是替换元素，所以 `img { display: block; }` 才能消除底部几像素的"幽灵空白"（行内替换元素基线对齐导致）。不理解替换元素，永远搞不清这类经典间距问题。

### 8. 块级元素 / 行内元素（Block-level / Inline-level）

- 定义：元素在**普通流**中的默认参与方式，由 **CSS `display`** 决定（注意：这是 CSS 概念，不是 HTML 标签的固有属性）。
- 块级（`display: block` 等）：独占一行的盒子，可设宽高，`<div>`、`<p>`、`h1` 等默认如此。
- 行内（`display: inline`）：在一行内流动，宽高由内容决定，`<span>`、`<a>`、`strong` 默认如此。
- 现代认知：HTML5 规范不再用"块级/行内"分类元素，而是统一用 `display` 计算值描述。但面试和日常仍广泛使用这两个词，本质是 `display` 计算值的体现。

### 9. 可访问性（Accessibility / a11y）与 ARIA

- 定义：**a11y** 是让残障用户（视觉、听觉、运动、认知）也能使用网页。ARIA（Accessible Rich Internet Applications）是 **W3C WAI-ARIA 规范** 定义的属性集，用于补充语义。
- 核心：`role`（角色）、`aria-*` 属性、`tabindex`、`alt`。
- 实战：能用原生语义元素（`button`、`nav`）就不要用 `div` + ARIA 模拟（"No ARIA is better than bad ARIA"）。

### 10. 字符编码（Character Encoding / UTF-8）

```html
<meta charset="utf-8">
```

- 定义：规定字节如何映射为字符，**WHATWG** 要求文档声明编码。
- `UTF-8` 是万国码，覆盖所有语言字符。缺失编码声明会导致中文等出现乱码（Mojibake）。
- 实战：`<head>` 内第一句就写 `<meta charset="utf-8">`。

### 11. HTML5 新增 API（Web Platform APIs）

这些不是 CSS，但属于 HTML5 时代的"Web 平台能力"，来自 **WHATWG / W3C 各独立规范**：

| API | 标准 | 用途 |
|-----|------|------|
| **Canvas** | WHATWG HTML | 2D 位图绘制（图表、游戏） |
| **SVG** | W3C SVG | 矢量图形，可 CSS 控制 |
| **Web Storage** (`localStorage`/`sessionStorage`) | WHATWG HTML | 客户端键值存储（区别于 Cookie） |
| **Web Workers** | W3C | 后台线程，避免阻塞主线程 |
| **WebSocket** | W3C | 全双工实时通信 |
| **Fetch API** | WHATWG Fetch | 取代 `XMLHttpRequest` 的网络请求（底层基于 Promise） |
| **History API** | WHATWG HTML | SPA 路由控制（`pushState`） |
| **Geolocation** | W3C | 获取地理位置 |

---

## 二、CSS 核心术语

### 12. 层叠（The Cascade）

- 定义：当多条规则匹配同一元素时，浏览器按一套**优先级算法**选出"最终生效值"的过程。规范：**W3C CSS Cascading and Inheritance Level 4（css-cascade-4）**。
- 优先级由低到高：**用户代理样式 → 用户样式 → 作者样式**；在作者样式内部再按 `!important` → 选择器优先级 (Specificity) → 源码顺序 决出。
- 为什么重要：你写的样式"不生效"，90% 是层叠被更高优先级覆盖（或被 `!important`、或被行内样式压过）。

### 13. 层叠上下文（Stacking Context）

- 定义：元素在 Z 轴（深度方向）上的**独立排序作用域**，**W3C CSS Positioned Layout / css-cascade** 规范定义。
- 关键真相：`z-index` 不是全局排名，**只在同一个层叠上下文内比较**。创建新上下文的方式：`position: relative/absolute` + `z-index` 非 `auto`、`opacity < 1`、`transform`、`filter`、`will-change`、`isolation: isolate` 等。
- 详见下一章"渲染机制"中的层叠上下文图解。

### 14. 选择器（Selector）与优先级（Specificity）

- 定义：选择器是"选取要样式化的元素"的模式；优先级是浏览器计算选择器**权重**的公式。规范：**W3C Selectors Level 4**、**CSS Cascade**。
- Specificity 是四元组 `(a,b,c,d)`：`a` 内联样式、`b` ID、`c` 类/属性/伪类、`d` 元素/伪元素。
- 相关伪类函数：`:is()`（取参数中最高优先级）、`:where()`（永远为 0）、`:not()`（只看参数）。这些在 **Selectors Level 4** 中定义。

```css
#main .box ul li:first-child  /* (0,1,2,2) */
a.link:hover                   /* (0,0,2,1) */
```

### 15. 继承（Inheritance）

- 定义：某些 CSS 属性的值**自动从父元素流向子元素**。规范：**W3C CSS Cascading and Inheritance**。
- 可继承：`color`、`font-*`、`line-height`、`text-align`、`visibility`、`cursor` 等。
- 不可继承：`display`、`width`、`height`、`margin`、`padding`、`border`、`background`、`position`、`z-index`。
- 控制关键字：`inherit`（强制继承）、`initial`（重置初始值）、`unset`（可继承→inherit，否则→initial）、`revert`（回退 UA 默认）。

### 16. 盒模型（Box Model）

- 定义：文档中每个元素在布局时都被当作一个矩形盒子，从内到外为 **content → padding → border → margin**。规范：**W3C CSS Box Model Module Level 3**。
- `box-sizing` 决定 `width/height` 作用范围：
  - `content-box`（默认）：`width` 只算 content，实际占用 = content+padding+border。
  - `border-box`：`width` 已包含 padding+border（推荐）。

```css
*, *::before, *::after { box-sizing: border-box; } /* 工程标配 */
```

### 17. 视觉格式化模型（Visual Formatting Model）

- 定义：CSS 2.1 规范（**W3C CSS2 §9 / css-display**）定义的**核心布局机制**——浏览器用哪些规则把盒子放到页面上（位置、尺寸、排列方向）。
- 每个盒子都属于一个**格式化上下文（Formatting Context）**，上下文决定排列规则。

### 18. 格式化上下文：BFC / IFC / FFC / GFC

| 上下文 | 触发 | 行为 | 规范 |
|--------|------|------|------|
| **BFC**（块级格式化上下文） | `overflow` 非 `visible`、`display: flow-root`、`float`、`position: absolute/fixed`、`display: inline-block` | 块级盒子垂直排列；清除浮动；隔离 margin 塌陷 | CSS Display 3 |
| **IFC**（行内格式化上下文） | 默认行内容器 | 行内元素水平排列；`vertical-align`、`line-height` 生效 | CSS Inline 3 |
| **FFC**（Flex 格式化上下文） | `display: flex/inline-flex` | 主轴/交叉轴排列 | CSS Flexbox 1 |
| **GFC**（Grid 格式化上下文） | `display: grid/inline-grid` | 行列网格排列 | CSS Grid 1 |

- 实战：`display: flow-root` 是创建 BFC 的**无副作用**标准方式（替代老旧的 `overflow: hidden`），强烈推荐。

### 19. 文档流 / 普通流（Normal Flow）与脱离文档流

- 定义：**普通流**是元素按其在 HTML 中的顺序、依其 `display` 默认参与排列的方式。规范：**CSS Display / Visual Formatting Model**。
- **脱离文档流**：元素不再参与普通流布局，不影响兄弟元素位置。触发方式：`position: absolute/fixed`、`float`（部分脱离）。
- 认知：`relative` **不**脱离文档流（只占位移，原位置保留）；`absolute/fixed` 才真正脱离。

### 20. 定位方案（Positioning Schemes）

- 规范：**W3C CSS Positioned Layout Module Level 3**。
- `static`（默认，普通流）、`relative`（相对自身偏移，占原流）、`absolute`（相对**包含块**定位，脱离流）、`fixed`（相对视口）、`sticky`（阈值内 relative、越过阈值变 fixed）。

### 21. 包含块（Containing Block）

- 定义：元素用于**百分比尺寸和绝对定位**的"参照矩形"。规范：**CSS Positioned Layout § Containing Block**。
- 规则：正常流块级元素的包含块是最近块级祖先的 content 区；`absolute` 的包含块是最近 `position` 非 `static` 祖先的 padding 区；`fixed` 的是视口。
- 实战：`position: absolute` 的子元素找不到"定位祖先"时会相对视口定位——这是最常见的"absolute 跑偏"原因。

### 22. 浮动（Float）与清除（Clear）

- 定义：`float` 让元素靠左/右并允许文本环绕，源自印刷排版。规范：**CSS 2.1 / css-display（float 属性）**。
- `clear` 阻止元素浮动到指定侧。现代布局优先用 Flex/Grid，浮动主要用于图文环绕等特定场景；清除浮动（BFC）见盒模型章节。

### 23. margin 塌陷（Collapsing Margins）

- 定义：相邻块级元素的垂直 `margin` **合并取最大值**而非相加。规范：**W3C CSS Box Model / CSS 2.1 §8.3.1**。
- 条件：同一 BFC 内相邻的块级父子/兄弟。避免：用 `padding`、触发 BFC 隔离、或使用 Flex/Grid（其容器不塌陷）。
- 注意：这是**规范设计**，不是 bug。

### 24. 值的四种形态（Specified / Computed / Used / Actual）

- 规范：**W3C CSS Cascading and Inheritance Level 4 § Resolved Values**。
- `指定值 (Specified)` → 层叠决出 → `层叠值 (Cascaded)` → `计算值 (Computed)`（相对单位解析完，如 `em`→`px`、`%` 暂留）→ `使用值 (Used)`（布局后 `%`→具体 `px`、`auto`→具体值）→ `实际值 (Actual)`（受屏幕 DPR/缩放约束后的最终像素）。
- 实战：`getComputedStyle()` 返回的是 Computed Value；理解四阶段才知道"`width: 50%` 到底等于多少 px"。

### 25. 单位：绝对 / 相对（Units）

- 规范：**W3C CSS Values and Units Module Level 4**。
- 绝对：`px`（CSS 像素，受 DPR 影响为"参考像素"）、`pt`、`cm`。
- 相对：`em`（相对当前字体大小）、`rem`（相对根字体大小）、`%`（相对包含块）、`vw/vh/vmin/vmax`（相对视口）、`ex/ch`（相对字号度量）。
- 实战：可访问性推荐用 `rem` 配合用户字体缩放；流式布局用 `vw` + `clamp()`。

### 26. 响应式（Responsive）与媒体查询（Media Query）

- 定义：让页面适配不同设备尺寸。规范：**W3C Media Queries Level 4**、**Media Queries Level 5（容器查询）**。
- `@media` 按视口/特性应用样式；移动优先（min-width 向上覆盖）是主流策略。
- 现代补充：**容器查询 `@container`**（按父容器尺寸响应，非视口），见新特性章节。

### 27. CSSOM（CSS Object Model）

- 定义：CSS 的"DOM 等价物"，把样式表表示为可脚本化的对象树。规范：**W3C CSSOM**。
- 可通过 `document.styleSheets` 在 JS 中读取/修改；是"样式计算"阶段的输入之一。

### 28. 自定义属性（Custom Properties / CSS 变量）

- 定义：以 `--` 开头的属性，用 `var()` 引用。规范：**W3C CSS Custom Properties Level 1**。
- 特点：**可继承**、可用 JS 动态修改、支持 `@property` 声明类型与默认值（CSS Houdini 方向）。

```css
:root { --primary: #00e5ff; }
.btn { color: var(--primary); }
```

### 29. 重排 / 重绘 / 合成（Reflow / Repaint / Composite）

- 定义：浏览器把样式变更映射到屏幕时，按代价从小到大触发的三个阶段。依据 **CSS 规范 + 浏览器引擎实现（Blink/Gecko/WebKit）**。
- **重排 (Reflow / Layout)**：改变几何尺寸（`width`、`top`、`font-size`），代价最高。
- **重绘 (Repaint / Paint)**：改变外观（`color`、`background`、`box-shadow`），跳过布局。
- **合成 (Composite)**：只改 `transform`/`opacity`，走 GPU 独立图层，代价最低。
- 实战铁律：**动画只用 `transform` 和 `opacity`**（所有动画库的核心优化原理）。

### 30. 动画（Animation）与过渡（Transition）

- 规范：**W3C CSS Animations Level 1**、**CSS Transitions Level 1**。
- `transition`：属性值**变化过程**的平滑过渡（需状态改变触发）。
- `@keyframes` + `animation`：基于时间轴的**关键帧**动画（可自动播放/循环）。
- 限制：只有"可插值"属性可过渡；`display` 不能过渡，需用 `opacity + visibility` 替代。

### 31. 逻辑属性（Logical Properties）

- 定义：用**逻辑方向**（块轴/行轴）而非物理方向描述盒子的属性。规范：**W3C CSS Logical Properties and Values Level 1**。
- `margin-block` / `margin-inline` 替代 `margin-top/bottom/left/right`；`padding-block` 等；`inset` 替代 `top/right/bottom/left`。
- 实战：国际化（RTL 阿拉伯语）布局必备，现代项目优先使用。

### 32. 容器查询（Container Queries）

- 定义：让子元素样式**根据父容器尺寸**而非视口响应。规范：**W3C CSS Containment Module Level 3**。
- 触发：父容器 `container-type: inline-size`；子元素用 `@container` 查询。
- 意义：组件级响应式，组件放到任何容器都自适应——响应式设计的范式升级。

---

## 三、速查总表（一张图记住核心词）

| 领域 | 术语 | 一句话定义 | 规范来源 |
|------|------|-----------|---------|
| HTML | 标签 / 元素 / 属性 | 标记符号 / 语义整体 / 配置键值 | WHATWG HTML |
| HTML | DOCTYPE | 触发标准模式的文档声明 | WHATWG HTML |
| HTML | DOM | HTML 解析后的树形对象结构 | WHATWG DOM |
| HTML | 语义化 | 用含义明确的标签表达意图 | WHATWG HTML |
| HTML | 内容模型 | 元素"能放哪/放什么"的分类 | WHATWG HTML |
| HTML | 空元素 | 无结束标签的元素（img/br/...） | WHATWG HTML |
| HTML | 替换元素 | 内容由外部资源决定（img/canvas） | W3C CSS Display |
| HTML | 字符编码 UTF-8 | 字节到字符的映射，防乱码 | WHATWG HTML |
| CSS | 层叠 Cascade | 多规则冲突时的优先级算法 | W3C css-cascade-4 |
| CSS | 层叠上下文 | z 轴独立排序作用域 | W3C css-cascade |
| CSS | 优先级 Specificity | 选择器权重 (a,b,c,d) | W3C Selectors 4 |
| CSS | 继承 Inheritance | 属性从父元素流向子元素 | W3C css-cascade |
| CSS | 盒模型 Box Model | content/padding/border/margin | W3C CSS Box 3 |
| CSS | 视觉格式化模型 | 盒子落位的布局规则 | W3C CSS 2.1 / Display |
| CSS | BFC/IFC/FFC/GFC | 四种格式化上下文 | W3C Display/Flex/Grid |
| CSS | 文档流 / 脱离流 | 普通流 vs 绝对/固定定位 | W3C CSS Display |
| CSS | 包含块 | 百分比/绝对定位的参照矩形 | W3C Positioned Layout |
| CSS | margin 塌陷 | 垂直 margin 合并取最大值 | W3C CSS Box 3 |
| CSS | 值四形态 | 指定→计算→使用→实际 | W3C css-cascade |
| CSS | 单位 | px/em/rem/%/vw/vh 等 | W3C Values 4 |
| CSS | 媒体查询 | 按视口响应（响应式） | W3C Media Queries 4 |
| CSS | CSSOM | CSS 的对象模型 | W3C CSSOM |
| CSS | 自定义属性 | --变量 + var() | W3C Custom Properties |
| CSS | 重排/重绘/合成 | 样式变更的三级代价 | 规范 + 引擎实现 |
| CSS | 动画/过渡 | @keyframes / transition | W3C Animations/Transitions |
| CSS | 逻辑属性 | 逻辑方向替代物理方向 | W3C Logical Properties |
| CSS | 容器查询 | 按父容器尺寸响应 | W3C Containment 3 |

---

!!! tip "如何使用本篇"
    1. 看不懂下一章的某个词（如 BFC、层叠上下文、margin 塌陷）→ 回本篇查定义与规范来源。
    2. 遇到"样式不生效"→ 先想**层叠/优先级/继承**三件套。
    3. 遇到"布局乱跑"→ 先想**文档流/包含块/层叠上下文**。
    4. 遇到"动画卡顿"→ 先想**重排/重绘/合成**哪一阶段被触发。
    5. 一切以 **WHATWG / W3C 官方规范 + MDN** 为准，社区文档（web.dev、CSS-Tricks）作为实践补充。
