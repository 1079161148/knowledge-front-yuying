# 下拉刷新 + 上拉加载

**难点**：移动端列表交互标配，但手势和页面滚动容易冲突——下拉时整页跟着动、松手误触发、重复加载。

**最佳实践**：用 `touch-action: pan-y` 声明意图；下拉刷新**只在 `scrollTop<=0` 时触发**；上拉加载用触底 + 锁（`loadingMore` 防重复）。

<iframe src="../../../demos/m-pull-refresh.html" height="560" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- 下拉刷新判断阈值（如 60px），超过才真正刷新，否则回弹。
- 上拉加载必须有「加载中锁」，否则滚动事件高频触发会并发拉多次。
- 监听用 `{ passive: true }`，避免 `touchmove` 里 `preventDefault` 导致滚动卡顿。
- 下拉过程用 `transform: translateY` 跟手，松手 `transition` 回弹（别直接改 `top`）。
- 空列表 / 单屏未满时不要触发上拉加载（判断内容高度 > 视口）。

**踩坑**

- iOS 橡皮筋（overscroll）让 `scrollTop` 到负，`touchmove` 不拦会导致整页拉动 → 容器 `overscroll-behavior: contain`。
- 下拉时地址栏展开改 `100vh` → 用 `dvh`（见 [视口章节](mobile-viewport.md)）。
- 刷新中再触发刷新 → 状态机 `idle/refreshing/loading` 互斥。
