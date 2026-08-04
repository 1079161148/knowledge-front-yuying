# 🎬 移动端动画与手势交互

> 移动端体验是否"像原生 App"，动画与手势是分水岭。本篇讲：CSS 动画原则、Web Animations API、手势（滑动/拖拽/缩放）、滚动驱动动画、Passive 事件、Lottie、共享元素转场、性能红线。依据 **MDN**、**web.dev 动画性能**、**Google Web Fundamentals — 流畅度**。
>
> 前置：[移动端基础](basics.md)（触摸事件模型）、[性能专项](performance.md)（INP/长任务）。

---

## 一、动画的两条黄金法则（先记住）

1. **只动 `transform` 和 `opacity`**：这两个属性由合成线程（compositor）处理，**不触发重排/重绘**，60fps 稳。动 `top/left/width/height/margin` 会触发布局 → 卡顿。
2. **别阻塞主线程**：动画期间若有 JS 长任务，合成线程虽能跑，但交互响应（INP）会掉。把动画交给 CSS/WAAPI，别在 `requestAnimationFrame` 里做重计算。

!!! danger "坑 1：用 left/top 做位移动画"
    ```css
    /* 错误：每帧重排 */
    @keyframes move { from { left: 0 } to { left: 200px } }
    /* 正确：用 transform，只走合成 */
    @keyframes move { from { transform: translateX(0) } to { transform: translateX(200px) } }
    ```

---

## 二、CSS 动画与过渡

```css
.card {
  transition: transform .3s cubic-bezier(.22,1,.36,1), opacity .3s;
  will-change: transform;   /* 提示浏览器提前提升图层（别滥用） */
}
.card:active { transform: scale(.96); }   /* 按压反馈 */
```

!!! warning "will-change 使用纪律"
    `will-change` 会常驻内存占用图层，**只对即将动画的元素临时加、动画结束移除**，不要全局写 `will-change: transform` 否则内存爆炸（见 [性能·内存](performance.md) §五）。

---

## 三、Web Animations API（JS 精确控制）

比 CSS 更灵活：可暂停/反向/监听结束、与手势联动。

```js
const anim = el.animate(
  [{ transform: 'translateX(0)' }, { transform: 'translateX(100px)' }],
  { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
)
anim.onfinish = () => {}
anim.pause(); anim.reverse()
```

> 手势拖动时实时驱动：`anim.currentTime = progress * 300`（进度条式联动），比每帧 `style.transform` 更稳。

---

## 四、手势交互（滑动/拖拽/缩放）

### 4.1 原生手势：用 Pointer Events

```js
let startX = 0
el.addEventListener('pointerdown', e => { startX = e.clientX; el.setPointerCapture(e.pointerId) })
el.addEventListener('pointermove', e => {
  const dx = e.clientX - startX
  el.style.transform = `translateX(${dx}px)`   // 拖拽跟手
})
el.addEventListener('pointerup', e => { /* 回弹/吸附 */ })
```

!!! danger "坑 2：手势里读布局属性导致卡"
    拖动中读 `el.offsetWidth`/`getBoundingClientRect()` 强制同步布局 → 每帧重排。改：用 `transform` 累积位移，结束再读。

### 4.2 双指缩放

- 用 `PointerEvent` 多指或 `TouchEvent` 的 `touches[0]/[1]` 算两指距离比，驱动 `scale()`。
- 移动端禁掉默认缩放：`touch-action: none`（元素上）防止浏览器抢手势。

### 4.3 大厂实践库（按需）

| 需求 | 库 |
|------|-----|
| 通用手势/拖拽 | `@use-gesture/react`、`interact.js` |
| 轮播/滑动 | `swiper`（移动端事实标准） |
| 下拉刷新/上拉 | 框架组件（Vant `PullRefresh` / antd-mobile `PullToRefresh`） |

---

## 五、滚动驱动动画（新特性）

```css
/* scroll-driven animations（Chrome 115+） */
.progress {
  animation: grow linear;
  animation-timeline: scroll(root);   /* 跟滚动进度 */
}
@keyframes grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
```

!!! tip "兼容处理"
    老内核（见 [兼容性](compatibility.md)）不支持时用 `IntersectionObserver` + `scroll`(rAF 节流) 降级，别强依赖。

---

## 六、Passive 事件（滚动流畅关键）

```js
// 滚动/触摸监听默认会等 JS 判断是否 preventDefault → 阻塞滚动
// 明确不阻止时用 passive，浏览器可立即滚动，避免掉帧
window.addEventListener('touchmove', onMove, { passive: true })
```

> React/Vue 的 `@touchmove.prevent` 等价于非 passive，会卡滚动。**只在真要阻止默认行为（如下拉刷新）时去掉 passive**。

---

## 七、Lottie 与复杂动画

- **Lottie**（airbnb）：设计师 After Effects 导出 JSON，前端 `lottie-web` 渲染，矢量、轻量、跨端一致。
- 控制：`anim.playSegments([0, 30], true)` 播指定段。
- 性能：复杂 Lottie 帧数多也吃 CPU，列表里多实例用 `lottie-web` 的 `renderer:'canvas'` 或 `@lottiefiles/dotlottie`。

!!! danger "坑 3：长列表里塞很多 Lottie"
    每个 Lottie 实例常驻渲染，列表一多直接 OOM（iOS 尤甚）。用**虚拟滚动只渲染可视区** + 不可见时 `destroy()`。

---

## 八、页面转场与共享元素

- 路由转场：Vue `<Transition>` / React `framer-motion` 的 `AnimatePresence`，统一用 `transform/opacity`。
- 共享元素（图片放大进入详情）：用 `View Transition API`（Chrome 111+）或 FLIP 技巧（先测终态位置，animate 从初态到终态）。

```js
// View Transition API（实验特性，需特性检测）
if (document.startViewTransition) {
  document.startViewTransition(() => renderNewPage())
}
```

---

## 九、性能红线（动画不出问题）

| 指标 | 红线 | 越线后果 |
|------|------|----------|
| 动画帧率 | ≥ 60fps（或 120） | < 50 肉眼卡 |
| 单帧主线程 | < 16ms | INP 超标 |
| 图层内存 | 控制 will-change 数量 | OOM 白屏 |

!!! tip "调试"
    DevTools → Performance 录制看 **Long Tasks**（红块）和 **Frames**；Rendering → 开 "Paint flashing" 看是否重绘；[真机调试](debug-hybrid.md) 在手机上复现最准。

---

## 十、速查：动画问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| 动画卡顿 | 动了 top/left/width | 改 transform/opacity |
| 滚动时手势掉帧 | 非 passive 监听 | 加 `{ passive: true }` |
| 内存涨 | will-change 滥用 / Lottie 多实例 | 限时释放、虚拟滚动 |
| 手势跟手抖 | 拖动中读布局属性 | 用 transform 累积 |
| 转场闪白 | 未预加载目标资源 | preload + 骨架屏 |

---

## 十一、章节关联

- 触摸事件模型 → [移动端基础](basics.md) §三
- INP/长任务 → [性能专项](performance.md)
- 真机复现卡顿 → [真机调试与 Hybrid 桥协议实战](debug-hybrid.md)
