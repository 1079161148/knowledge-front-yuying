# 实战案例展示

这里不堆概念，只放**前端 / 移动端 / Java / Nest 天天会撞上的、绕不过的真实难题**，每个都配**能直接跑的示例**（前端是浏览器打开即跑的 HTML demo），采用社区与市场验证的**最佳实践**。

> 原则：**实战征服纸上谈兵**。每个难点都给你能交互的 demo + 关键代码思路 + 生产级踩坑，看完直接能用。

## 板块导航

### 前端 PC 业务实战（点击即跑，10 个案例）
> 点左侧「前端 PC 业务实战」展开子菜单，或直接看 [PC 实战总览](pc/index.md)。

**高频基础（每个项目必写一遍）**
- [万行表格虚拟滚动](pc/pc-virtual-table.md) — 大数据表格不卡死的唯一正解
- [复杂动态表单](pc/pc-dynamic-form.md) — 增删行 / 联动 / 逐行校验
- [请求层：无感刷新 + 取消 + 重试](pc/pc-request-layer.md) — 401 单飞刷新、AbortController
- [按钮级权限控制](pc/pc-permission.md) — 前端隐藏 ≠ 后端不校验
- [大文件断点续传](pc/pc-resume-upload.md) — 分片 + hash + 断点

**进阶亮点（拉开差距的实战）**
- [可拖拽看板 + 拖拽排序](pc/pc-drag-kanban.md) — 原生拖拽 / Pointer 事件 / SortableJS 选型
- [富文本编辑器痛点拆解](pc/pc-richtext.md) — contenteditable 光标/XSS/粘贴脏样式
- [可编辑树形表格](pc/pc-editable-tree-table.md) — 树展开 + 父行汇总 + 失焦保存
- [瀑布流无限滚动](pc/pc-masonry-infinite.md) — CSS columns vs 绝对定位、IO 触底
- [Web Worker 大数据计算](pc/pc-webworker.md) — 主线程不卡死、分块进度、terminate
- [音视频处理（播放/截帧/压缩）](pc/pc-media-processing.md) — canvas 截帧、MediaRecorder、WebCodecs 兼容
- [直播（WebRTC / HLS / FLV 低延迟）](pc/pc-live.md) — 推流/拉流选型、延迟对比、flv.js/hls.js

### 移动端难点亮点业务实战（点击即跑，13 个案例）
> 点左侧「移动端难点亮点业务实战」展开子菜单，或直接看 [移动端实战总览](mobile/index.md)。

**基础适配（每个 H5/小程序都绕不开）**
- [长列表虚拟滚动](mobile/mobile-virtual-list.md) — 万条聊天/商品列表不白屏
- [下拉刷新 + 上拉加载](mobile/mobile-pull-refresh.md) — 手势与滚动冲突的正确解法
- [异形屏安全区](mobile/mobile-safe-area.md) — 刘海 / 灵动岛 / Home 条
- [视口 dvh / 软键盘](mobile/mobile-viewport.md) — 弃用 100vh
- [1px 边框发虚](mobile/mobile-hairline.md) — 高清屏兜底
- [手势与滚动冲突](mobile/mobile-gesture-conflict.md) — touch-action 分轴
- [兼容性问题解决](mobile/mobile-compatibility.md) — 内核碎片化、iOS/Android/各 App WebView 真机坑

**进阶亮点（拉开差距的实战）**
- [手势密码解锁](mobile/mobile-gesture-lock.md) — Pointer 事件 + 安全区
- [图片懒加载 + 骨架屏](mobile/mobile-lazy-skeleton.md) — IntersectionObserver + CLS 防控
- [双列瀑布流](mobile/mobile-waterfall.md) — 矮列优先 + 触底加载
- [长按弹出操作菜单](mobile/mobile-longpress-menu.md) — 500ms 阈值 + 防误触
- [离线缓存 PWA](mobile/mobile-offline-pwa.md) — Service Worker 缓存策略
- [音视频处理（移动端播放/HLS）](mobile/mobile-media-processing.md) — playsinline、自动播放、截帧污染
- [直播（低延迟播放 + 连麦）](mobile/mobile-live.md) — HLS/FLV/WebRTC 移动端选型

**性能与体验**
- [弱网 + 首屏体验](mobile/mobile-weak-network.md) — 骨架屏 / 预加载 / 重试
- [面试怎么说（STAR）](mobile/mobile-interview.md)

### uni-app 跨端业务实战（代码即跑）
- [条件编译多端差异](uniapp.md) — #ifdef 把平台差异收敛到最小面
- [H5 ↔ App 双向 Bridge 通信](uniapp.md) — 桥就绪锁 + Promise 化
- [页面栈 10 层限制 / 分包 2MB](uniapp.md) — 小程序绕不开的硬约束
- [安全区 + 键盘适配 / 真机调试避坑](uniapp.md) — 各 App WebView 真机测
- [音视频播放与直播](uniapp.md) — playsinline 防全屏、连麦走原生 live-pusher
- [原生插件 / 原生能力桥接](uniapp.md) — 蓝牙/扫码/支付 SDK 的 #ifdef 隔离
- [分包预加载 + 启动性能](uniapp.md) — preloadRule/preloadPage 让二级页秒开
- [跨端状态管理（Pinia）](uniapp.md) — 持久化插件统一多端购物车

### Java 后端真实业务实战（多菜单，运行模块 + 经典难点）
> 点左侧「Java 后端真实业务实战」展开子菜单，或直接看 [Java 实战总览](java/index.md)。

**可 clone 运行的模块**
- [退款队列（SQLite + 幂等）](java/refund-queue.md) — 生产者/消费者分离、原子抢任务、幂等三道闸
- [缓存一致性](java/cache-consistency.md) — Cache-Aside + 延迟双删 + TTL 兜底
- [接口限流](java/rate-limit.md) — 注解 + 拦截器，单机到分布式滑动窗口

**经典业务难点亮点（方案 + 踩坑，技术含量高、易踩坑）**
- [音频转文字 ASR](java/asr-audio-to-text.md) — 本地 Whisper vs 云端 API 选型、流式 vs 整段、切片对齐
- [音视频处理最佳方案](java/media-processing.md) — FFmpeg 转码/截帧/压缩/HLS，服务端 vs 客户端 vs 云转码
- [分布式锁](java/distributed-lock.md) — Redis 误删、看门狗、Redlock 争议与正确姿势
- [大文件分片上传 + 断点续传](java/chunk-upload.md) — 前端切片、秒传、合并、并发控制
- [异步任务编排](java/async-orchestration.md) — CompletableFuture 陷阱、线程池隔离、上下文丢失
- [海量 Excel 流式导入](java/excel-import.md) — SAX/EasyExcel 防 OOM、校验、失败行回写
- [全局唯一 ID（雪花）](java/snowflake-id.md) — 时钟回拨、workerId 分配、号段模式
- [幂等通用套路](java/idempotent.md) — 去重表 / Token / 状态机，覆盖写与更新

### NestJS 真实业务实战（可运行模块）
- [NestJS：请求层 / 权限 / 限流 / 事务](backend-nest.md) — 真实中后台骨架
- [NestJS：文件上传（分片/秒传/断点）](backend-nest.md) — multer 落盘 + 流式合并
- [NestJS：WebSocket 实时通信](backend-nest.md) — 网关鉴权、房间、Redis Adapter
- [NestJS：缓存（穿透/击穿/雪崩）](backend-nest.md) — Cache-Aside + TTL 抖动
- [NestJS：Auth/JWT 无感刷新](backend-nest.md) — 双 Token、HttpOnly、轮换防重放

## 怎么跑

- **前端 demo（PC / 移动端）**：文档内嵌 `iframe`，直接交互；或打开 `docs/demos/pc-*.html`、`docs/demos/m-*.html` 源文件（移动端 demo 在桌面浏览器即可演示虚拟列表、下拉刷新手势）。
- **uni-app 示例**：一套 Vue 代码，代码块为可直接粘贴到 `uni-app` 工程的片段；跨端差异用 `#ifdef` 条件编译，编译到 H5 / 小程序 / App 运行（需 HBuilderX 或 cli）。
- **Java / Nest 示例**：见各文档底部的"运行方式"，`git clone` 后 `mvn spring-boot:run` / `npm run start` 即可。
