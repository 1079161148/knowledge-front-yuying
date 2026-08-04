# 📱 小程序原生开发实战

> 很多团队主业就是微信/抖音/支付宝小程序。本篇以**微信小程序官方文档**为主线，讲：小程序运行模型、目录与配置、分包/独立分包/预下载、原生组件层级、自定义组件、性能优化、常见坑与兼容。uni-app 写小程序的差异见 [跨端选型](cross-platform.md) §五。前置：[移动端基础](basics.md)、[兼容性处理](compatibility.md)。
>
> 依据：**微信开放社区官方文档**（分包 / 分包预下载 / 性能优化 / 原生组件）。

---

## 一、基础知识：小程序不是 H5

| 维度 | 小程序 | H5 |
|------|--------|-----|
| 运行 | 双线程：逻辑层（JSCore）+ 视图层（原生组件渲染） | 单线程 WebView |
| 语言 | WXML/WXSS + JS（类 Vue 模板） | HTML/CSS/JS |
| 渲染 | 视图层是原生组件，**非 DOM** | DOM |
| 能力 | 平台 API（wx.*） | Web API + Bridge |
| 入口 | 需审核发布、平台分发 | URL 直达 |

!!! tip "核心差异：逻辑层与视图层分离"
    逻辑层 JS 跑在 JSCore，**不在一个线程**，所以 `setData` 是跨线程通信，有序列化的成本（性能关键，见第三节）。这点和 H5 的同步 DOM 操作本质不同。

---

## 二、核心知识：工程结构与配置

### 2.1 目录与入口

```
miniprogram/
├─ app.js / app.json / app.wxss   # 全局
├─ pages/
│  └─ index/
│     ├─ index.wxml / wxss / js / json
├─ components/                    # 自定义组件
└─ subpackages/                   # 分包
```

`app.json` 关键配置：

```json
{
  "pages": ["pages/index/index"],
  "window": { "navigationBarTitleText": "Demo" },
  "subpackages": [
    { "root": "subpackages/a", "pages": ["page1", "page2"] }
  ],
  "preloadRule": {
    "pages/index/index": { "network": "wifi", "packages": ["subpackages/a"] }
  }
}
```

### 2.2 数据驱动视图

```xml
<!-- WXML：类似 Vue 模板 -->
<view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
<button bindtap="onTap">点击</button>
```

```js
// JS：setData 是唯一改视图的方式
Page({
  data: { list: [] },
  onTap() {
    this.setData({ list: [{ id: 1, name: 'A' }] })  // 跨线程序列化
  }
})
```

---

## 三、分包 / 独立分包 / 预下载（性能核心）

### 3.1 为什么分包

> 官方：**主包限制 2MB，整包限制 20MB**。主包过大 → 首次下载慢、审核受限。分包让非首屏代码按需下载。

### 3.2 独立分包（independent）

```json
{ "root": "subpackages/a", "pages": ["p1"], "independent": true }
```

- 独立分包**不依赖主包**即可运行（如推广落地页），启动更快。
- 限制：独立分包**不能引用主包内容/全局 app.wxss**，需自包含。

### 3.3 分包预下载

```json
"preloadRule": {
  "pages/index/index": { "network": "wifi", "packages": ["subpackages/a"] }
}
```

> 进主包某页时，WiFi 下自动预下载可能要用的分包，进分包页秒开。**注意流量**：`network:"all"` 会耗用户流量，按需配置。

!!! danger "坑 1：主包塞太多 → 超 2MB 无法上传"
    主包只留首屏必需（tabBar 页、公共组件、启动逻辑）。其余全丢分包。公共组件若被多个分包用，**放主包**或抽独立分包，否则重复打包。

!!! danger "坑 2：分包间不能互相引用"
    分包 A 不能直接用分包 B 的组件/资源（除非目标也在主包）。架构按业务切分包，避免交叉依赖。

---

## 四、原生组件层级问题（最高频坑）

> 官方：原生组件（`camera`/`video`/`map`/`canvas`/`live-player` 等）**层级高于普通组件**，无法用 `z-index` 盖住，且 `cover-view`/`cover-image` 才能覆盖其上。

| 场景 | 问题 | 规避 |
|------|------|------|
| 弹层盖不住 map/video | 普通 view 被原生组件遮 | 用 `cover-view` 或在原生组件上覆盖 |
| 自定义导航栏盖不住 | 同上层级 | `cover-view` 或改用原生导航栏 |
| 同屏多原生组件 | 互相遮挡、顺序不可控 | 减少同屏原生组件数量，错峰显示 |

!!! warning "cover-view 限制"
    `cover-view` 只支持极有限样式（不支持 flex 部分属性、动画受限），复杂 UI 别指望它。**最干净方案：少放原生组件，或把弹层做成单独页跳转**。

---

## 五、性能优化（官方要点）

1. **`setData` 优化（最重要）**
   - 只传变化字段，**别传整个大对象**。
   - 单次 `setData` 数据量 ≤ 256KB，累计单次传输 ≤ 1MB（官方告警阈值）。
   - 高频更新（如滚动）做**节流/合并**，避免每帧 setData。
   - 不在 `onPageScroll` 里直接 setData 大对象（用 `wx.createSelectorQuery` 取节点信息代替）。

```js
// 错误：传全量
this.setData({ list: newBigList })
// 正确：只传增量（用路径）
this.setData({ 'list[0].name': 'new' })
```

2. **首屏**：分包 + 预下载；首屏接口合并；骨架屏（`wx.showLoading` + 占位）。
3. **图片**：用 CDN 出缩略图（见 [图片优化](image-media.md)），别传原图。
4. **长列表**：用 `wx:for` + 虚拟列表（官方 `recycle-view` 或自研），避免一次性渲染上千节点。

!!! danger "坑 3：onPageScroll 里疯狂 setData"
    滚动回调每帧触发，里面 setData 大对象 → 逻辑层/视图层通信爆炸、掉帧。改用 IntersectionObserver 监听进出视口，或节流到 100ms+。

---

## 六、常见兼容与注意

| 项 | 注意 |
|----|------|
| 基础库版本 | 新 API 需高基础库；`wx.canIUse` 做能力检测，低版本降级 |
| 各平台差异 | 微信/抖音/支付宝 API 不同；uni-app 用条件编译抹平（见 [跨端](cross-platform.md)） |
| web-view 限制 | 小程序 web-view 全屏、强制原生导航栏、src 需配业务域名白名单（见 [uni-app 混合](uniapp-vue3-webview.md) §5.2） |
| 授权时机 | `wx.authorize` 拒绝后需引导去设置页重新开，不能重复弹 |
| 隐私合规 | 收集信息需合规声明（微信隐私协议接口 `wx.requirePrivacyAuthorize`） |

!!! danger "坑 4：自定义 tabBar 用原生组件导致白屏"
    自定义 tabBar 若用 `cover-view` 之外的原生组件（如 map）会异常。自定义 tabBar 用普通组件即可，别混原生组件。

---

## 七、速查：小程序问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| 上传失败 | 主包 > 2MB | 拆分包 + 预下载 |
| 滚动卡 | onPageScroll 里 setData | 节流/IntersectionObserver |
| 弹层被遮 | 原生组件层级高 | cover-view 或跳页 |
| 接口报 canIUse | 基础库低 | 能力检测 + 降级 |
| web-view 打不开 | 域名未白名单 | 后台配业务域名 |

---

## 八、章节关联

- 多端框架写小程序 → [跨端选型](cross-platform.md)、[uni-app 混合开发](uniapp-vue3-webview.md)
- 图片优化 → [图片/媒体专项](image-media.md)
- 兼容处理 → [兼容性处理](compatibility.md)
- 隐私合规 → [无障碍与合规](a11y-compliance.md) §七
