# 📱 移动端开发基础（必懂的概念与模型）

> 移动端 bug 大多源于"概念没搞清"。本篇讲清**视口、像素、DPR、触摸事件模型、手势基础**这些地基，再读适配/兼容/调试章节才不会懵。依据 **MDN**、**web.dev**、**W3C**。
>
> 适用：新人打底、中级补盲。前置：无。承接：[移动端专项总纲](index.md)、[响应式与媒体查询](../html-css/index.md)。

---

## 一、三个"视口"——所有布局 bugs 的根源

移动端最反直觉的就是"视口"有三层含义，搞混就出怪问题。

| 视口 | 含义 | 对应 JS | 典型大小 |
|------|------|--------|---------|
| **布局视口 Layout Viewport** | CSS 布局参考的"画布宽"，默认 980px（历史值） | `document.documentElement.clientWidth` | 980（未设 meta 时） |
| **视觉视口 Visual Viewport** | 用户当前"看到"的那块（会随缩放/键盘变化） | `window.visualViewport.width/height` | 随手势变 |
| **理想视口 Ideal Viewport** | 设备逻辑像素宽（CSS px），设计稿基准 | `screen.width` | 375 / 390 / 412 等 |

### 1.1 关键 meta：让布局视口 = 理想视口

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
```

- `width=device-width`：布局视口锁定为设备逻辑宽（如 375px），否则按 980 缩放，字小得像蚂蚁。
- `viewport-fit=cover`：**必加**，否则异形屏安全区 `env()` 不生效（见 [兼容性](compatibility.md)）。
- 2026 注意：`initial-scale=1` 足够，别再设 `user-scalable=no`（无障碍合规与 SEO 都会扣分）。

!!! danger "坑 1：没这行 meta，页面在手机上会被缩成桌面版"
    这是新人第一坑。任何移动端页面，第一行必须是正确的 viewport meta。

### 1.2 100vh 为什么不准（视觉视口陷阱）

`100vh` = 布局视口高，**包含**被地址栏/软键盘"藏起来"的部分。地址栏收缩时可见区变小，但 `100vh` 不变 → 底部内容被藏、出现滚动条。

**2026 解法**：用 `100dvh`（动态可见区）/ `100svh`（小视口，键盘弹起时）/ `100lvh`（大视口）。详见 [总纲 §2.1](index.md)。

---

## 二、像素与 DPR——为什么 1px 会变粗/发虚

### 2.1 三类像素

| 像素 | 说明 |
|------|------|
| **CSS 像素（逻辑像素）** | 我们写代码用的 `px`，布局单位 |
| **物理像素（设备像素）** | 屏幕真实发光点，如 1170×2532 |
| **DPR（设备像素比）** | `物理 / 逻辑`，iPhone 常见 2/3，安卓 1~4 |

```js
const dpr = window.devicePixelRatio  // 2 (Retina) / 3 (Plus) / 1 (普通安卓)
```

### 2.2 1px 边框难题

CSS `border: 1px` 在 DPR=3 的屏上，1 个逻辑像素 = 3 个物理像素，浏览器"凑整"渲染成 2~3px，看起来比设计稿粗。

**渐进化解法**：

```css
/* 方案 A：0.5px（2026 主流现代浏览器已支持，老机兜底） */
.hairline { border-width: 0.5px; }

/* 方案 B 兜底老机：伪元素 + scale */
@supports not (border-width: 0.5px) {
  .hairline { position: relative; border: none; }
  .hairline::after {
    content: ''; position: absolute; inset: 0;
    border: 1px solid #ddd; transform: scale(0.5);
    transform-origin: 0 0; width: 200%; height: 200%;
  }
}
```

### 2.3 图片清晰度

位图按 `物理像素` 出才清晰：DPR=2 的屏，`200×200` 设计图要切 `400×400` 二倍图，用 `srcset` 自动选（见 [原生优化 API](../advanced/browser-optimize-api.md) §2.2）。

```html
<img src="logo@1x.png" srcset="logo@2x.png 2x, logo@3x.png 3x" alt="logo">
```

---

## 三、触摸事件模型——和鼠标完全不同

### 3.1 事件序列

```
touchstart → touchmove* → touchend → (300ms 延迟) → mousedown → mouseup → click
```

!!! danger "坑 2：点击 300ms 延迟（历史遗留）"
    早期浏览器要等 300ms 判断是否双击缩放，导致点击"慢半拍"。**解法**：`viewport` 里 `width=device-width` + `user-scalable` 关闭（现代浏览器已默认无延迟）；或用 `touch-action: manipulation` 显式关掉双击缩放延迟。

### 3.2 关键 API

```js
el.addEventListener('touchstart', e => {
  const t = e.touches[0]          // 当前屏幕上所有手指
  const x = t.clientX, y = t.clientY
}, { passive: true })
```

!!! danger "坑 3：touchmove 不写 passive 会卡顿 + 警告"
    在 `touchmove`/`touchstart` 里调 `preventDefault()` 必须声明 `{ passive: false }`，否则现代浏览器报"无法被动监听"且滚动掉帧。**2026 最佳实践**：用 CSS `touch-action` 声明意图，JS 尽量不 `preventDefault`。

### 3.3 手势基础：自己算还是用库？

| 手势 | 实现 | 建议 |
|------|------|------|
| 点击 | `click`（或 `touchend` 判断位移） | 直接用 click |
| 横向滑动（轮播/抽屉） | `touchstart/end` 算 dx | 简单可手写 |
| 长按 | `setTimeout` 700ms + 位移<10px | 手写 |
| 双指缩放/旋转 | 多指 `touches` 算距离/角度 | 用库（如 `hammerjs` 已停更，改 `@use-gesture/vanilla`） |

---

## 四、移动端字体与可读性的基础

- **基准字号**：设计稿常用 375 宽对应 `16px` 根字号，正文不低于 `14px`（太小安卓看不清）。
- **禁止用户缩放被禁用**（无障碍）：`user-scalable=no` 会影响视障用户，2026 合规趋势下**建议开放缩放**。
- **行高**：移动端正文 `line-height: 1.5~1.6` 更易读。

---

## 五、移动端调试前的"环境认知"

- 真机调试靠 **USB + 远程调试**（见 [真机调试](debug-hybrid.md)）。
- WebView 里跑的页面，调试入口在**宿主 App**，不在系统浏览器。
- 模拟器（Xcode Simulator / Android Studio AVD）能跑大部分，但**真机测安全区/键盘/手势**不可替代。

---

## 六、速查：基础概念 → 常见现象

| 现象 | 根因 | 看哪章 |
|------|------|--------|
| 页面被缩小成桌面版 | 缺 viewport meta | 本篇 §1.1 |
| 满屏多出滚动条 | `100vh` 含地址栏 | [总纲 §2.1](index.md) |
| 边框在安卓变粗 | DPR 非整数 | 本篇 §2.2 |
| 点击慢半拍 | 300ms 延迟 | 本篇 §3.2 |
| 横滑时整页动 | touch 冲突 | [兼容性 §手势](compatibility.md) |
| 刘海挡内容 | 安全区未处理 | [兼容性 §安全区](compatibility.md) |
