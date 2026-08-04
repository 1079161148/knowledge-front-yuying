# 可拖拽看板 + 拖拽排序

**难点**：任务看板（待办/进行中/已完成）拖拽移动、列内排序是协作工具标配。但原生 HTML5 拖拽在表格行、跨容器、触屏上都很坑：拖动时半透明预览丑、触屏不支持 `dragstart`、跨列位置计算容易错位。

**最佳实践**：PC 用成熟库 `SortableJS`（Vue 用 `vuedraggable`、React 用 `dnd-kit`）。要"零依赖/完全可控"时用 **Pointer Events** 自实现（鼠标+触屏统一），避免 HTML5 DnD 的局限。

<iframe src="../../../demos/pc-drag-kanban.html" height="440" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- HTML5 `draggable` 在触屏失效、跨 iframe 难、预览不可控 → 现代方案多用 Pointer Events + `transform` 跟手。
- 跨列插入位置用「鼠标 Y 与最近卡片中线比较」（`getDragAfterElement`），demo 已实现。
- 拖拽中加 `dragging` 半透明、目标列 `drag-over` 高亮，体验才像真看板。
- 落点后要**同步后端顺序**（发 `reorder` 接口，传目标列 + 新 index），别只改前端内存。
- 虚拟化列表里拖拽要和虚拟滚动坐标对齐，难度高，建议用库内置支持。

**踩坑**

- HTML5 DnD 的 `dragover` 必须 `preventDefault()` 否则 `drop` 不触发（最常见的"拖不进去"）。
- 触屏上 `touch-action` 不设置会导致拖动时整页滚 → 拖拽手柄设 `touch-action: none`。
- 多标签页共享看板要乐观更新 + 冲突合并，否则两人同时拖同卡片会覆盖。
