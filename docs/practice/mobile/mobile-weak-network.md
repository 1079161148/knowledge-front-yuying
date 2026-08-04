# 弱网 + 首屏体验

**难点**：移动端芯片弱、网络波动大、流量贵，首屏慢、交互卡、白屏、请求超时。

**最佳实践**：骨架屏 + 关键资源 preload + 图片 `srcset` + 路由级懒加载 + 请求层重试/去重（见 [PC 请求层](../../practice/pc/pc-request-layer.md) 思路）。

```html
<link rel="preload" as="image" href="hero.avif">
<img src="hero.avif" srcset="hero-2x.avif 2x" loading="lazy" style="aspect-ratio:16/9">
```

**关键点（生产级细节）**

- 长列表用虚拟滚动；大图用 `WebP/AVIF` + `srcset` 多倍图（见 [图片懒加载](mobile-lazy-skeleton.md)）。
- 弱网重试用**指数退避**；乐观更新 + 冲突检测（版本号/ETag）防覆盖他人改动。
- 首屏关键 CSS 内联、JS 按需（`import()` 动态导入）；骨架屏用 `aspect-ratio` 占位防 CLS。
- 接口层做**请求去重 + 缓存**（SWR）：相同请求在途复用，避免重复打后端。

**踩坑**

- 骨架屏闪一下就没（数据秒回）比白屏还糟 → 骨架屏最小展示时长 300ms 防闪烁。
- `loading=lazy` 图片在首屏视口内的也要懒 → 首屏图用 `loading=eager` + `fetchpriority=high`。
- 弱网下 `Promise.race([请求, timeout])` 把超时当失败，但请求其实还在跑 → 要配合 `AbortController` 真取消。
