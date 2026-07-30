# 🎨 HTML5 / CSS3 篇

> 一切前端的基础。内容依据 **W3C HTML5 / CSS3 规范** 与 **MDN**。本篇包含多个**纯前端可运行 Demo**（无需联网）。

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

<iframe src="demos/html-css-flexgrid.html" width="100%" height="240" style="border:1px solid #2c5364;border-radius:8px"></iframe>

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

<iframe src="demos/html-css-animation.html" width="100%" height="240" style="border:1px solid #2c5364;border-radius:8px"></iframe>

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

## 6. 踩坑（注意事项）

!!! warning "常见坑"
    - **Flex 子项收缩**：默认 `flex-shrink: 1`，内容过长会被压扁；需 `flex-shrink: 0` 或 `min-width: 0`。
    - **Grid 与 Flex 混用**：别一维硬套 Grid，反而复杂。
    - **`z-index` 失效**：只对定位元素（`position` 非 static）生效。
    - **`transition` 不生效**：只对"可插值"属性有效（如 `display` 不能过渡）。

---

## 7. 学习经验

!!! tip "经验"
    - 布局先想清楚"一维还是二维"，再决定 Flex 还是 Grid。
    - 多写 Demo 直接拖拽窗口看响应式效果，比死记媒体查询更快。
    - CSS 变量 + BEM 命名，能让样式可维护很多。

---

## 8. 总结

| 主题 | 要点 |
|------|------|
| 语义化 | header/nav/main/article/footer |
| 布局 | Flex（一维）/ Grid（二维） |
| 动效 | transition / @keyframes |
| 响应式 | 移动优先 + 流式单位 |
| 新特性 | dialog / details / 变量 / clamp |

> 下一板块预告：**AI 前端领域**（AI 辅助编码、LLM 接入、Vercel AI SDK、低代码 + AI、实战聊天界面）。
