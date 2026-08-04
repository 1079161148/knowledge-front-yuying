# 🕳️ 前端踩坑经验面试题

> 这类题不背八股，问的是**「你真实项目里踩过什么坑、怎么定位、怎么解决」**——最能拉开差距。下面每题都给「坑现场 → 根因 → 解法 → 面试怎么说」。答案结合主流大厂实战与社区高频复盘。

---

## 1. 数据与状态踩坑

#### Q1：父组件传对象 prop，子组件直接改了，线上数据串了？
- **坑现场**：Vue 把大对象当 prop 传下去，子组件 `obj.x = 1` 直接改了，多个页面共享同一引用，互相污染。
- **根因**：对象是引用类型，Vue2 对对象属性劫持不彻底，且「props 单向流」被打破后难以追踪。
- **解法**：子组件用 `computed` 副本 / `emits` 回传；或 `toRefs` + 浅拷贝；严禁直接 mutate prop。
- **面试怎么说**：强调「props 只读，状态上提或事件回写，对象用深拷贝切断引用」。

#### Q2：useEffect 里拿到的一直是旧 state？
- **坑现场**：`setInterval` 定时器里读 `count` 永远是初始值。
- **根因**：闭包捕获了首次渲染的 state；effect 没把 state 加依赖导致函数没重建。
- **解法**：把依赖加进 `[]`（或 `ref` 存最新值、用函数式 `setCount(c=>c+1)`）。
- **面试怎么说**：讲清「闭包陷阱 + 依赖数组」两件事，顺带提 React 18 的 `useEffectEvent`。

#### Q3：表单连续提交重复创建订单？
- **坑现场**：弱网卡顿，用户连点提交，生成两个订单。
- **根因**：前端没防重，后端也没幂等。
- **解法**：按钮 `disabled` + loading；请求带 **幂等键**（如 `requestId`）；后端按幂等键去重（见 [Java 幂等通用套路](../practice/java/idempotent.md)）。

## 2. 渲染与性能踩坑

#### Q4：列表万条数据，页面卡死 / 滚动掉帧？
- **坑现场**：一次性 `v-for` / `map` 渲染 1 万条 DOM，首屏几秒、滚动掉帧。
- **根因**：DOM 节点过多，布局/绘制成本爆炸。
- **解法**：**虚拟滚动**（只渲染视口内 N 条），可用 `vue-virtual-scroller` / `react-window`；或服务端分页。
- **面试怎么说**：量化「1 万条 → 视口 20 条」，结合 FPS、LCP 指标讲优化收益。

#### Q5：大量图表 / 弹窗导致内存只涨不跌（内存泄漏）？
- **坑现场**：SPA 切页后内存不回落，长时间用变卡。
- **根因**：定时器/ECharts 实例/事件监听未销毁；闭包持有大对象。
- **解法**：组件卸载时 `clearInterval`、图表 `dispose()`、`removeEventListener`、`AbortController` 取消请求。
- **面试怎么说**：用 Chrome Performance Monitor / Memory 快照对比「操作前/后」定位泄漏点。

#### Q6：图片加载导致 CLS 布局跳动、LCP 很差？
- **坑现场**：图片后加载，文字被挤下去，体验差、CLS 超标。
- **根因**：图片无预留尺寸，布局在加载时才计算。
- **解法**：`width/height` 或 `aspect-ratio` 预留空间；`loading="lazy"`（非首屏）；首屏图 `fetchpriority="high"`。

## 3. 兼容与移动端踩坑

#### Q7：iOS 上 `<video>` 自动播放没反应 / 自动全屏？
- **坑现场**：微信/ Safari 里 video 不自动播、一点就全屏。
- **根因**：iOS 禁止非静音自动播放；默认全屏播放器。
- **解法**：`muted + playsinline + webkit-playsinline`；事件触发后再 `play()`；详见 [移动端音视频处理](../practice/mobile/mobile-media-processing.md)。

#### Q8：1px 边框在 Retina 屏发虚？
- **坑现场**：border 实际渲染成 2px 或模糊。
- **根因**：DPR=2/3 时 1 物理像素 ≠ 1 CSS 像素。
- **解法**：`transform: scale(0.5)` 缩放伪元素；或 `border-width: 1px` + `@media (min-resolution: 2dppx)` 调 0.5px；用 `postcss-px-to-viewport` 类方案。

#### Q9：移动端 1px 安全区 / 软键盘顶起布局错乱？
- **坑现场**：iPhone 底部 Home 条挡按钮；输入框聚焦后页面被顶、收起不还原。
- **根因**：刘海/安全区未处理；软键盘改变视口高度。
- **解法**：`env(safe-area-inset-bottom)` 留白；用 `dvh` 替代 `vh`；聚焦时滚动到可视区。

## 4. 网络与工程化踩坑

#### Q10：发版后用户一直用旧版本（缓存陷阱）？
- **坑现场**：改了 bug 用户说还在；刷新才生效。
- **根因**：HTML 被强缓存，或 JS 文件命中旧 hash 未更新。
- **解法**：HTML 设 `no-cache`（每次校验）；静态资源加 **content-hash** 文件名；配合 Service Worker 发版激活策略。

#### Q11：Safari 跨域 / 第三方 cookie 被拦？
- **坑现场**：新版 Safari ITP 删除第三方 cookie，登录态丢失。
- **根因**：隐私策略收紧（ITP、Partitioned Cookies、`SameSite=Lax` 默认）。
- **解法**：关键鉴权走**首方域名**；用 `Partitioned` 属性（CHIPS）；OAuth 用 PKCE + 后端 session。

#### Q12：打包后偶现 `undefined is not a function`（生产才炸）？
- **坑现场**：本地正常，线上某些浏览器报错。
- **根因**：用了过新语法/BOM API 未被 polyfill 覆盖；或 `import` 循环依赖导致初始化顺序问题。
- **解法**：`@babel/preset-env` + `browserslist` 配好目标；用 `core-js` 按需引入；排查循环依赖（`webpack` 告警）。

## 5. 面试怎么说（STAR 表达模板）

!!! tip "踩坑题黄金答法"
    用 **STAR**：背景(S) → 任务(T) → 行动(A) → 结果(R)。
    - 别说「我遇到过 XX 问题」就完了，要补**量化结果**：「首屏从 4.2s → 1.3s」「内存从 380MB → 120MB」「Crash 率降 60%」。

## 6. 下一步

- 基础看 [前端经典面试题](frontend-classic.md)；底层看 [前端核心面试题](frontend-core.md)。
- 框架深入看 [框架面试题（深化）](frontend-framework-deep.md)；工具插件看 [常用插件 / 第三方库面试题](frontend-plugins.md)。
- 讲项目亮点参考 [面试难点与亮点](highlights.md)。
