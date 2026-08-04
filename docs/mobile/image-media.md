# 🖼️ 移动端图片 / 媒体优化专项

> 图片是移动端首屏体积的第一杠杆（常占 60%+ 流量）。本篇讲：现代格式（AVIF/WebP）、响应式 `srcset`/`picture`、懒加载、CDN 裁剪、大图 OOM、视频/媒体。依据 **web.dev 图像优化**、**MDN 响应式图像**、**HTTP 官方**。前置：[性能专项](performance.md)（LCP/CLS）、[适配方案](adaptation.md)。

---

## 一、格式选择（先选对格式）

| 格式 | 体积 | 支持 | 建议 |
|------|------|------|------|
| **AVIF** | 最小（比 WebP 再小 20-30%） | Chrome 85+/iOS 16+ | 首选用 `<picture>` 提供 |
| **WebP** | 小 | 广泛（含老安卓） | 兜底格式 |
| **JPEG XL** | 优 | 支持少 | 暂观望 |
| **JPEG/PNG** | 大 | 全 | 仅兜底/透明图无 AVIF 时 |

!!! tip "输出策略"
    服务端/CDN 生成多格式，前端用 `<picture>` 让浏览器选最优；不支持 AVIF 的自动降级 WebP/JPEG。

---

## 二、响应式图片（按 DPR/视口给图）

### 2.1 srcset + sizes（按分辨率）

```html
<img
  src="hero-750.jpg"
  srcset="hero-375.jpg 375w, hero-750.jpg 750w, hero-1125.jpg 1125w"
  sizes="(max-width: 375px) 375px, 750px"
  alt="活动主图"
  loading="eager" decoding="async"
  style="aspect-ratio: 16/9">
```

> `w` 描述图固有宽度，`sizes` 告诉浏览器"此处 CSS 宽"，浏览器按 DPR 选最合适的——**避免 3x 屏下拿 1x 图糊、或 1x 屏下下载 3x 浪费**。

### 2.2 picture（按格式/艺术指导）

```html
<picture>
  <source type="image/avif" srcset="hero.avif">
  <source type="image/webp" srcset="hero.webp">
  <img src="hero.jpg" alt="..." loading="lazy" decoding="async">
</picture>
```

!!! danger "坑 1：首屏图别加 loading=lazy"
    首屏 LCP 图必须 `eager` + `preload`（见 [性能 §2](../mobile/performance.md) 坑 1），否则 LCP 崩。只有屏外图才 lazy。

!!! danger "坑 2：图不预留尺寸 → CLS 超标"
    图未设宽高/aspect-ratio，加载后撑开布局 → CLS > 0.1。务必 `width`+`height` 或 CSS `aspect-ratio` 占位。

---

## 三、懒加载（屏外图/列表）

```html
<img src="item.jpg" loading="lazy" decoding="async">
```

- `loading="lazy"`：浏览器原生懒加载，零 JS。
- `decoding="async"`：解码不阻塞主线程。
- 列表场景配合 [虚拟滚动](performance.md) §三，只渲染可视区图片。

!!! warning "CDN 懒加载图也要占位"
    懒加载图未加载时高度为 0 → 仍可能引起滚动跳动。用 `aspect-ratio` 占位或 LQIP（极低清模糊占位）先撑住。

---

## 四、CDN 裁剪与质量（工程化核心）

现代 CDN（阿里云 OSS/腾讯云/Coudflare）支持 URL 参数实时裁剪：

```
https://cdn.example.com/img.jpg?x-oss-process=image/resize,w_750/format,avif/quality,q_80
```

- `w_750`：按容器宽出图，避免下发超大原图。
- `format,avif`：服务端转格式（比前端转更省）。
- `quality,q_80`：有损压缩，移动端肉眼无损。

!!! tip "根据 DPR 出图"
    前端把 `devicePixelRatio` 传给 CDN（如 `dpr_2`），3x 屏拿 2x 图即可（3x 原图太重），平衡清晰与体积。

---

## 五、大图与 OOM（内存杀手）

| 风险 | 根因 | 方案 |
|------|------|------|
| 大图直接 OOM | 单图解码后位图 = 宽×高×4 字节 | 限制展示尺寸 + WebP/AVIF |
| 列表大图累积 | 多图同时驻留内存 | 虚拟滚动 + 离屏 `destroy` 实例 |
| 长图（海报） | 超长位图超 GPU 纹理上限 | 切片/缩放展示 |

!!! danger "坑 3：用背景图 background-size:cover 放大小图"
    小图被 CSS 放大 → 糊。正确：CDN 按容器尺寸出对应分辨率图（见第四节），别靠 CSS 放大。

---

## 六、视频与媒体

- **视频**：`playsinline`(iOS 内联播放，勿全屏)、`preload="metadata"`(移动端别预载全片)、首帧 poster 占位防 CLS。
- **自动播放**：移动端禁止有声自动播放，需 `muted autoplay playsinline` 才能自动播。
- **直播/HLS**：用 `hls.js`（Safari 原生支持 HLS）。

```html
<video playsinline muted preload="metadata" poster="frame.jpg">
  <source src="clip.mp4" type="video/mp4">
</video>
```

---

## 七、速查：图片问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| 首屏慢 | LCP 图太大/未 preload | AVIF + preload + eager |
| CLS 超标 | 图无尺寸占位 | width/height 或 aspect-ratio |
| 流量爆 | 下发原图/3x 图 | CDN 按容器宽+DPR 出图 |
| 白屏/OOM | 大图/多图驻留 | 限制尺寸 + 虚拟滚动 + 离屏销毁 |
| 模糊 | CSS 放大小图 | CDN 出对应分辨率 |
| 视频跳转全屏 | 缺 playsinline | 加 playsinline + muted |

---

## 八、章节关联

- LCP/CLS 指标 → [性能专项](performance.md)
- 虚拟滚动 → [性能专项 §三](performance.md)
- 响应式单位 → [适配方案](adaptation.md)
