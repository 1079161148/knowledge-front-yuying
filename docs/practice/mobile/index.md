# 移动端难点亮点业务实战（总览）

移动端天天撞的是**碎片化适配**：异形屏安全区、软键盘、1px 发虚、手势冲突、长列表卡顿、弱网白屏。每个案例配**浏览器打开即跑的 HTML demo**（桌面浏览器即可演示手势/虚拟列表，真机专属的用代码块 + 适配说明），用生产级最佳实践拆解。

> 原则：**实战征服纸上谈兵**。每个难点都给你能交互的 demo + 关键代码 + 真机踩坑。

## 案例清单（点击展开左侧子菜单）

**基础适配（每个 H5/小程序都绕不开）**
- [长列表虚拟滚动](mobile-virtual-list.md) — 万条聊天/商品列表不白屏
- [下拉刷新 + 上拉加载](mobile-pull-refresh.md) — 手势与滚动冲突的正确解法
- [异形屏安全区](mobile-safe-area.md) — 刘海 / 灵动岛 / Home 条
- [视口 dvh / 软键盘](mobile-viewport.md) — 弃用 100vh
- [1px 边框发虚](mobile-hairline.md) — 高清屏兜底
- [手势与滚动冲突](mobile-gesture-conflict.md) — touch-action 分轴
- [兼容性问题解决](mobile-compatibility.md) — 内核碎片化、iOS/Android/各 App WebView 真机坑

**进阶亮点（拉开差距的实战）**
- [手势密码解锁](mobile-gesture-lock.md) — Pointer 事件 + 安全区
- [图片懒加载 + 骨架屏](mobile-lazy-skeleton.md) — IntersectionObserver + CLS 防控
- [双列瀑布流](mobile-waterfall.md) — 矮列优先 + 触底加载
- [长按弹出操作菜单](mobile-longpress-menu.md) — 500ms 阈值 + 防误触
- [离线缓存 PWA](mobile-offline-pwa.md) — Service Worker 缓存策略
- [音视频处理（移动端播放/HLS）](mobile-media-processing.md) — playsinline、自动播放、截帧污染
- [直播（低延迟播放 + 连麦）](mobile-live.md) — HLS/FLV/WebRTC 移动端选型

**性能与体验**
- [弱网 + 首屏体验](mobile-weak-network.md) — 骨架屏 / 预加载 / 重试
- [面试怎么说（STAR）](mobile-interview.md)

## 前置
- [移动端专项总纲](../../mobile/index.md)、[适配方案选择](../../mobile/adaptation.md)、[兼容性处理](../../mobile/compatibility.md)
