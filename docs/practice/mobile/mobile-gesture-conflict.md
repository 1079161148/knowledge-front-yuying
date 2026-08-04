# 手势与滚动冲突

**难点**：横滑抽屉时整页跟着动；`touchmove` 里 `preventDefault` 报 passive 警告 + 卡顿；下拉刷新误触；嵌套滚动（横滑卡 + 纵滑列表）互相穿透。

**最佳实践**：用 CSS `touch-action` 声明意图，JS 只处理逻辑；必要时 `passive:false` 才 `preventDefault`。

```css
.scroll-x     { touch-action: pan-x; } /* 只横滑，纵滑交还页面 */
.pull-refresh { touch-action: pan-y; }
```

**关键点（生产级细节）**

- 能用 CSS 解决的别碰 JS；`touch-action` 让浏览器提前优化合成，滚动更丝滑。
- 嵌套滚动用 `touch-action` 分轴：横向用 `pan-x`，纵向用 `pan-y`，避免橡皮筋穿透。
- `addEventListener('touchmove', fn, { passive: false })` 才能 `preventDefault`，否则浏览器警告且滚动卡。
- 手势库（如 `hammerjs`）已处理多指/旋转/缩放手势冲突，复杂交互直接上库。

**踩坑**

- 在 `passive:true`（默认）的监听里调 `preventDefault` 会失效 + 报控制台警告 → 明确声明 `passive:false`。
- iOS 上 `touch-action: none` 会禁用整个元素的滚动，只该加在需要完全自定义手势的手柄上。
- 横向 swiper 套纵向 scroll，滑动方向判断不准会"误触" → `touch-action` 分轴优于 JS 方向判定。
