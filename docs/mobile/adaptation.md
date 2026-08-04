# 📐 移动端适配方案选择（rem / vw / 百分比 / 容器查询 怎么选）

> 移动端适配没有"唯一正确解"，只有"按场景选"。本篇把主流方案摆在一起对比，给出**选型决策树**和**最佳实践**，并讲清 2026 年折叠屏时代的新法则。依据 **W3C CSS Values**、**MDN**、各主流方案社区实践。
>
> 适用：中级选型、架构决策。前置：[移动端基础](basics.md)、[响应式总纲](../html-css/index.md)、[视觉演进](index.md)。

---

## 一、主流方案一览

| 方案 | 原理 | 优点 | 缺点 | 适用 |
|------|------|------|------|------|
| **百分比 %** | 相对父宽 | 简单 | 高度无法百分比、嵌套易乱 | 简单布局 |
| **Flex/Grid 自动** | 弹性/网格 | 天然自适应 | 复杂精细间距难控 | 大多数布局首选 |
| **rem（根字号缩放）** | `html` 字号随屏宽变，`px→rem` | 一套比例适配所有屏 | 需 JS 设根字号、计算麻烦 | 老项目/设计稿按 750 出图 |
| **vw/vh（视口单位）** | 1vw = 屏宽 1% | 纯 CSS、无需 JS | 大屏(平板)会过大、需 `max-width` 封顶 | 现代项目、配合 `clamp` |
| **clamp() 流式** | `clamp(min, 理想, max)` | 平滑无跳变 | 老旧 WebView 不支持 | 字号/间距首选 |
| **容器查询 @container** | 按父容器响应 | 组件级自适应、折叠屏友好 | 旧 WebView 不支持需降级 | 2026 推荐组件级布局 |

---

## 二、方案详解与写法

### 2.1 rem 方案（经典：手淘 flexible 思路）

设计稿宽 750（iPhone 两倍图），约定 `1rem = 屏宽/10`：

```js
// 早期 flexible.js 思路（2026 已不推荐手写，了解即可）
function setRem() {
  const w = document.documentElement.clientWidth
  document.documentElement.style.fontSize = w / 10 + 'px'
}
setRem(); window.addEventListener('resize', setRem)
```

```css
/* 设计稿 750 宽，某元素 75px → 75/75 = 1rem */
.box { width: 1rem; }  /* 屏宽 375 时 = 37.5px */
```

!!! warning "2026 立场：rem 是过渡方案"
    它本质是"用 JS 模拟 vw"。现代浏览器 `vw` 原生支持后，**新项目优先 vw + clamp**，别再引 flexible。老项目维护可保留。

### 2.2 vw + clamp 方案（2026 推荐）

```css
/* 设计稿 375，某元素 20px → 20/375*100 = 5.33vw */
.box { width: 5.33vw; }

/* 更稳：流式封顶，避免平板过大 */
.box {
  width: clamp(16px, 5.33vw, 24px);
}
```

**工程化偷懒**：用 `postcss-px-to-viewport` 插件，写 px 自动转 vw，开发无感。

```js
// postcss.config.js
module.exports = {
  plugins: { 'postcss-px-to-viewport': { viewportWidth: 375, unitToConvert: 'px' } }
}
```

### 2.3 容器查询（组件级适配，折叠屏救星）

```css
.card-wrap { container-type: inline-size; }
@container (min-width: 400px) {
  .card { flex-direction: row; }   /* 容器够宽才横排，不管设备多宽 */
}
```

!!! tip "何时用容器查询"
    同一组件出现在"全屏页 / 侧边抽屉 / 弹窗"里表现应不同——按**容器**而非**设备**响应。这是 2026 折叠屏时代的主流范式（见 [总纲 §2.4](index.md)）。

---

## 三、选型决策树

```
你的场景？
├─ 新项目、现代浏览器为主？
│   └─ ✅ vw + clamp() 流式 + 容器查询（配合 postcss 自动转）
├─ 老项目、设计稿按 750 出、已用 rem？
│   └─ ✅ 保留 rem，不强行重构
├─ 需要兼容老安卓 WebView（≤ Android 7）？
│   └─ ⚠️ 用 rem/flex 兜底，vw/clamp 加 @supports 回退
├─ 组件要在多种容器里复用（抽屉/弹窗/分屏）？
│   └─ ✅ 必用 @container 容器查询
├─ 折叠屏（展开态宽度突变）？
│   └─ ✅ 容器查询 + ResizeObserver 重排，别用固定断点
└─ 简单静态页？
    └─ ✅ Flex/Grid 百分比即可，别过度设计
```

---

## 四、设计稿与开发对齐（避坑）

!!! danger "坑 1：设计稿宽度没对齐根基准"
    团队约定"设计稿 375 还是 750"必须统一。转 vw 时 `viewportWidth` 填错 → 全站尺寸翻倍/减半。

!!! danger "坑 2：1px 边框也转成 vw"
    边框、阴影、细线**不要**转 vw（会变成随屏宽变粗的怪线）。在 postcss 配置里把 `1px` 加白名单，或用 [basics §2.2](basics.md) 的 hairline 方案。

!!! danger "坑 3：大屏（平板/iPad）没封顶"
    vw 在 1024px 平板上会让元素巨大。给容器 `max-width: 640px; margin: 0 auto` 居中封顶（参考 PC 端阅读宽度）。

!!! tip "最佳实践组合（2026）"
    ```
    根布局：max-width 封顶 + 居中
    间距/字号：clamp(min, vw, max) 流式
    组件内部：@container 容器查询
    边框/细线：hairline 方案（不参与 vw）
    高清图：srcset 多倍图
    ```

---

## 五、1px 与高清（详见 [basics §2](basics.md)）

适配不止"尺寸"，还有**清晰度**：DPR≥2 必须出 `@2x/@3x` 图；1px 边框用 hairline。两者常被新手遗漏，导致"尺寸对了但糊/粗"。

---

## 六、速查表

| 适配目标 | 首选 | 备选 |
|---------|------|------|
| 字号流式 | `clamp()` | `vw` |
| 组件级响应 | `@container` | 媒体查询(按容器宽度) |
| 老项目维护 | rem | flex |
| 平板封顶 | `max-width` | 媒体查询 |
| 高清图 | `srcset` | `image-set()` |
| 细线边框 | hairline 伪元素 | `0.5px` |
| 折叠屏 | 容器查询 + ResizeObserver | — |
