# 瀑布流无限滚动

**难点**：图片墙 / 商品流 / 笔记流（小红书式）要不等高卡片排列紧凑，还要无限下拉。但瀑布流布局、图片高度未知导致回流抖动、触底高频触发并发加载，每一处都是坑。

**最佳实践**：布局用 **CSS `columns`**（简单但顺序按列）或 **绝对定位双/多列"哪列矮插哪列"**（顺序准、可控）；触底用 `IntersectionObserver` 比 scroll 监听更稳；加载加 `loading` 锁防并发。

<iframe src="../../../demos/pc-masonry-infinite.html" height="560" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **CSS columns 取舍**：`column-count` 写法最简单，但 DOM 顺序是"先填满第一列"→ 视觉阅读顺序反直觉；要求顺序正确用绝对定位法（本 demo 移动端版用双列矮插法）。
- **图片高度未知**：后端应在列表接口就返回 `width/height`，前端按比例预留 `aspect-ratio`，否则图加载完回流抖动（CLS 扣分）。
- **触底加载**：`IntersectionObserver` 监听底部哨兵 + `rootMargin: 300px` 提前加载，比 scroll 高频计算优雅、不卡。
- **loading 锁**：`loading` 标志防滚动事件高频并发拉多次（demo 已实现）。
- **分页上限**：到底给"没有更多了"，别无限请求（接口也要防深分页，用游标 cursor 而非 offset）。

**踩坑**

- 用 `scrollTop + clientHeight >= scrollHeight` 判断触底，在图片未加载高度变化时算不准 → IO 解法。
- 绝对定位法要监听 resize 重排列宽；移动端旋转屏要重建布局。
- 弱网下下拉太快会连续触发 → 锁 + 最小间隔。
