# 富文本编辑器痛点拆解

**难点**：评论、公告、IM、低代码表单都要富文本。但原生 `contenteditable` 是"前端三大天坑之一"：光标乱跳、粘贴带脏样式、回车产生 `<div>` 还是 `<p>`、"全选删除"后块结构崩溃、XSS 注入。

**最佳实践**：别从零造轮子。生产用 **TipTap（ProseMirror）/ Lexical / Slate / Quill**，它们用"文档模型（Schema）"而非裸 DOM，光标与结构是受控的。本 demo 用 `contenteditable` 演示坑在哪。

<iframe src="../../../demos/pc-richtext.html" height="440" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **光标保活**：`execCommand` 执行前要在按钮 `mousedown` 调 `e.preventDefault()`，否则焦点跑到按钮上、格式应用到错位置（demo 已处理）。
- **`execCommand` 已废弃**：Chrome 仍支持但标准废弃，且无法清除内联 `style`；新编辑器走 Selection API + 自定义命令。
- **XSS 是红线**：富文本存储的 HTML 渲染前必须 `DOMPurify.sanitize()` 过滤 `on*` 属性与 `<script>`；前端输出绝不能直出 `innerHTML`（demo 的"模拟粘贴带脚本"按钮演示了 `<img onerror>` 危害）。
- **粘贴净化**：监听 `paste` 事件，`clipboardData` 取纯文本或清洗后 `document.execCommand('insertHTML')`；禁止直接 `insertHTML` 原始 HTML。

**踩坑**

- `contenteditable` 在空块回车生成 `<div><br></div>` 层层嵌套，字数统计/序列化全乱 → 模型化编辑器统一成 `<p>`。
- 中文输入法（IME）组合输入 `compositionstart/end` 期间不能做校验，否则吞字。
- 协同编辑（多人同时改）要上 CRDT（Yjs），纯 innerHTML 同步会互相覆盖。
