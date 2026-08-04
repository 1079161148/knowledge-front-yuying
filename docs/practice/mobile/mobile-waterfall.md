# 双列瀑布流

**难点**：小红书式图文流要不等高卡片紧凑排列，还要无限下拉。布局法选型、图片高度未知导致插列错位、触底高频并发，每一处都是坑。

**最佳实践**：双列用「哪列矮插哪列」（绝对定位法顺序准）；后端列表接口返回宽高比，前端按比例预留高度；触底 `IntersectionObserver` + `loading` 锁。

<iframe src="../../../demos/m-waterfall.html" height="560" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **矮列优先**：维护两列当前高度，新卡片插矮的那列，视觉最紧凑（demo 用奇偶近似，生产用真实高度）。
- **高度预知**：接口返回 `w/h`，前端 `padding-top: h/w*100%` 占位，图加载完不跳动。
- **触底加载**：`IntersectionObserver` 监听底部哨兵 + `rootMargin: 250px` 提前拉；`loading` 锁防并发。
- **视口坑**：容器高度用 `dvh` 而非 `100vh`，否则 iOS 地址栏收缩时列表被切（见 [视口](mobile-viewport.md)）。

**踩坑**

- `column-count` 布局顺序反直觉（先满列）→ 要求阅读顺序正确用绝对定位矮插法。
- 图片未加载高度算 0 → 全插第一列 → 必须预留宽高比。
- 旋转屏 / resize 要重建列宽与重排，绝对定位法需监听 `resize` 重算。
- 见 [PC 瀑布流](../../practice/pc/pc-masonry-infinite.md) 对照 CSS columns 方案。
