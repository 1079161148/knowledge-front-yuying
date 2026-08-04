# 🧭 移动端跨端方案选型总览

> 做移动端应用第一步是**选技术栈**。本文横向对比：H5+WebView、微信/抖音小程序、uni-app、React Native、Flutter，给出适用边界与选型决策树，帮架构师/技术负责人做总选型。
>
> 依据：**各框架官方文档定位**（uni-app 编译架构、React Native Fabric 新架构、Flutter Skia 自绘、微信小程序官方框架）、社区大规模实践对比。不站队，只给可落地的取舍依据。
> 前置：[移动端开发基础](basics.md)、[H5 + WebView 混合开发](h5-webview.md)、[Vue3(H5)+uni-app(WebView) 混合开发](uniapp-vue3-webview.md)。

---

## 一、五大方案技术本质

| 方案 | 渲染原理 | 语言 | 跨端范围 |
|------|----------|------|----------|
| **H5 + WebView** | WebView 渲染网页 | HTML/CSS/JS | 任意壳（浏览器/微信/App web-view） |
| **小程序**（微信/抖音/支付宝） | 双线程（逻辑层 JSCore + 视图层原生组件） | 小程序 DSL（类 Vue/React） | 仅对应平台 |
| **uni-app** | App 端 vue 页=WebView、nvue=原生渲染；编译到小程序/H5 | Vue3 | 11 端（iOS/Android/小程序/H5 等） |
| **React Native** | JS 与原生组件桥接（新架构 Fabric 同步渲染） | React(JS/TS) | iOS/Android（小程序需第三方转译） |
| **Flutter** | Skia 引擎自绘 UI（脱离平台控件） | Dart | iOS/Android/Web/桌面（小程序需桥接） |

---

## 二、横向对比（决策用）

| 维度 | H5+WebView | 小程序 | uni-app | React Native | Flutter |
|------|-----------|--------|---------|--------------|---------|
| **性能上限** | 中（受 WebView） | 中高（原生组件） | 中~高（nvue 原生） | 高（接近原生） | 高（自绘流畅） |
| **开发效率** | 高 | 高 | 高（一套多端） | 中 | 中（Dart 学习成本） |
| **多端覆盖** | 靠壳，不强 | 仅单平台 | ⭐ 最广（11 端） | iOS/Android 为主 | 多端但小程序弱 |
| **动态化/免发版** | ⭐ 最强（H5 发 CDN） | 强（审核后） | 中（H5 部分可热更） | 弱（需发版/CodePush） | 弱（需发版） |
| **复杂动画/游戏** | 弱 | 中 | 中（nvue 较强） | 中高 | ⭐ 最强 |
| **原生能力** | 靠 Bridge（有边界） | 平台受限 | 插件/原生插件 | ⭐ 直接原生模块 | 需写 Platform Channel |
| **包体积** | 最小 | 平台决定 | 中 | 中 | 较大（基础包~15MB+） |
| **团队匹配** | 前端通用 | 前端 | Vue 前端 | React 团队 | 需学 Dart |

---

## 三、适用边界（什么时候选谁）

### 选 H5 + WebView（本专题主线）
- 已有 Vue3/React H5 资产，要快速嵌进 App/微信。
- 活动页、营销页、第三方内容——**要动态下发、免发版**。
- 团队是纯前端，不需要深度原生能力。

### 选小程序
- 业务主阵地就在微信/抖音/支付宝生态（获客、支付、分享闭环）。
- 不追求跨 App，单平台深耕。
- 注意：小程序 web-view **强制原生导航栏**、域名白名单（见 [uni-app 混合开发](uniapp-vue3-webview.md) §5.2）。

### 选 uni-app
- 一套代码覆盖 **App + 小程序 + H5 多端**，且团队是 Vue 技术栈。
- 需要小程序原生支持 + App 端原生能力（插件市场）。
- App 端复杂页用 **nvue** 提性能，普通页用 **vue（WebView）**。

### 选 React Native
- 团队是 React 技术栈，要**接近原生的体验与性能**。
- 业务以 App 为主（iOS/Android），动画/交互复杂。
- 新架构 Fabric 已解决老 Bridge 异步卡顿，性能更好。

### 选 Flutter
- 追求**极致 UI 一致性 + 流畅动画**（品牌强视觉、游戏化）。
- 能接受 Dart 学习成本、接受较大包体积。
- 不重度依赖某生态小程序。

---

## 四、选型决策树

```
业务主阵地在哪？
├─ 微信/抖音/支付宝生态 → 小程序（必要时内嵌 H5）
├─ 要一套代码打多端(含小程序) + Vue 团队 → uni-app
├─ 纯 App(iOS/Android) + React 团队 → React Native
├─ 极致视觉/动画 + 接受 Dart → Flutter
└─ 已有 H5 / 活动页 / 要免发版热更 → H5 + WebView（嵌进任意壳）
```

!!! tip "现实常见组合（大厂）"
    - **App 主体用 RN/Flutter/uni-app(nvue) 保证体验** + **活动/营销页用 H5+WebView 保证动态化**（本专题 h5-webview / uniapp 两篇即此组合）。
    - 小程序作为生态获客入口，核心体验回 App。

---

## 五、与本书其他篇章的衔接

| 你选了 | 读这些 |
|--------|--------|
| H5 + WebView | [h5-webview.md]、[vue3-mobile.md]/[react-mobile.md]、[monitoring.md]、[security.md] |
| 小程序内嵌 H5 | [uniapp-vue3-webview.md]（§5 平台差异）、[h5-webview.md] |
| uni-app 多端 | [uniapp-vue3-webview.md]、[basics.md]、[adaptation.md] |
| RN / Flutter | 本篇选型 + [basics.md]/[adaptation.md]/[compatibility.md]（原理通用） |

---

## 六、章节关联

- 混合开发落地 → [H5 + WebView 混合开发（0-1 落地）](h5-webview.md)
- uni-app 实战 → [Vue3(H5)+uni-app(WebView) 混合开发](uniapp-vue3-webview.md)
- 适配/兼容/性能 → [adaptation.md] / [compatibility.md] / [performance.md]
