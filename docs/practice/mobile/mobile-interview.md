# 面试怎么说（STAR）

- **难点**：万行列表 INP 超标、iOS 白屏 → 虚拟滚动 + `memo` + 稳定 key，INP 从 320ms 降到 90ms（见 [虚拟列表](mobile-virtual-list.md)）。
- **亮点**：自研移动端适配脚手架（安全区 / `dvh` / hairline 一套搞定，见 [安全区](mobile-safe-area.md) / [视口](mobile-viewport.md) / [1px](mobile-hairline.md)），团队多项目复用。
- **坑**：折叠屏展开态被旧断点误判成平板 → 改用 `@container` 容器查询 + `ResizeObserver` 重排。
- **手势**：下拉刷新误触整页拉动 → `overscroll-behavior: contain` + `touch-action` 分轴（见 [手势冲突](mobile-gesture-conflict.md)）。
- **弱网**：首屏白屏 + 重复请求打爆后端 → 骨架屏 + 请求去重/SWR + 指数退避（见 [弱网](mobile-weak-network.md)）。
- **离线**：地铁里页面打不开 → Service Worker 缓存壳 + SWR 策略（见 [离线 PWA](mobile-offline-pwa.md)）。
