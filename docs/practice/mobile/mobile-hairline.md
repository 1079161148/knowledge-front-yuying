# 1px 边框（高清屏发虚）

**难点**：DPR 非整数，CSS `1px` 在 2x/3x 屏被渲染成 2px 或半像素发虚，列表分割线、卡片边框显粗。

**最佳实践**：现代浏览器直接 `0.5px`；老机用伪元素 `transform: scale` 兜底。

```css
@media (min-resolution: 2dppx) {
  .hairline { border-width: 0.5px; }
}
@supports not (border-width: 0.5px) {
  .hairline::after { transform: scaleY(0.5); } /* 老安卓兜底 */
}
```
> Vant / antd-mobile 自带 `hairline` 类，直接用它，别自己转 vw。

**关键点（生产级细节）**

- 伪元素方案：`::after` 设 `border: 1px solid; transform: scale(0.5); transform-origin: 0 0; width:200%;height:200%`，兼容最稳。
- 0.5px 在 iOS 渲染成物理 1 设备像素，最清晰；但部分安卓 WebView 不支持亚像素会被四舍五入成 0（线消失）→ 必须伪元素兜底。
- 圆角 hairline 用 `::after` 设 `border-radius` 同步 scale。

**踩坑**

- 用 `box-shadow` 模拟 1px 在深色背景下有抗锯齿发虚，不是真 1px。
- `transform: scale` 的伪元素会创建新层叠上下文，注意和 `position:fixed` 子元素的层级冲突。
- 在 `rem`/`vw` 布局里混用 px 边框没问题，边框就该用 px 而非相对单位。
