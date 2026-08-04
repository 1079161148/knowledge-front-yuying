# 🟢 Vue3(H5) + uni-app(WebView) 混合开发：从 0-1 技术方案

> 业务场景：主体 App 用 **uni-app（Vue3）** 开发，部分业务用**纯 Vue3 H5** 写（或已有 H5 站点），通过 `web-view` 组件嵌进 App 的 WebView 里运行。本文档从 0-1 讲清：**架构选型、项目搭建、H5↔App 双向通信、登录态/路由、兼容性坑与规避、性能与调试**。
>
> 依据：**uni-app 官方文档** `web-view` 组件页（2026-05-14 更新）、**uni-app 官方混合开发文档** `hybrid.html`（2025-09-10 更新）、**DCloud 插件市场/问答**社区最佳实践。所有结论均来自官方或大规模验证方案，**无自创猜测**。
>
> 前置：[移动端开发基础](basics.md)、[兼容性处理](compatibility.md)、[H5 + WebView 混合开发（0-1 落地）](h5-webview.md)。

---

## 一、先定架构：谁主谁从（官方混合开发文档）

uni-app 官方把混合开发按"主从关系"分三种，选错会返工（官方强调必须先把这点定清楚）：

| 方案 | 主 | 从 | 适用 | 能力完整度 |
|------|----|----|------|-----------|
| **A. uni-app 为主 + 原生插件** | uni-app | 原生能力 | App 基本用 uni-app 写，个别原生能力做插件 | 高 |
| **B1. 原生 App 为主 + uni 小程序 SDK** | 原生 App | uni 小程序 | 已有原生 App，想嵌 uni 页面 | 高（接近原生） |
| **B2. 原生/uni App + H5(web-view)** | App | 纯 H5 | 已有 Vue3 H5，或活动页/第三方页 | 中（受 WebView 限制） |

> 本篇聚焦 **B2**：uni-app 壳（Vue3）里用 `web-view` 承载**纯 Vue3 H5**。理由：H5 可动态下发、无需发版、复用现有 Vue3 资产。
>
> !!! warning "官方提醒（hybrid.html）"
>     - 离线打包请走 **App 离线打包 SDK**，**不要误用 uni 小程序 SDK**，否则付费原生插件不可用、功能受限。
>     - 只想扩展原生能力、App 本身已是 uni-app → 优先用**插件市场**或自研原生插件，而非嵌 web-view（web-view 层级高、体验弱于原生）。

---

## 二、0-1 项目搭建

### 2.1 目录结构建议

```
project/                 # uni-app（Vue3 + Vite）壳工程
├─ pages/
│  └─ webview/
│     └─ index.vue       # 承载 web-view 的页面
├─ hybrid/html/          # 可选：本地 H5 资源（App 端可直接加载）
├─ static/
└─ manifest.json

h5-project/              # 独立 Vue3 H5 工程（Vite + TS）
├─ src/
│  └─ bridge/            # H5 侧 uni.webview 封装
└─ vite.config.ts        # base 配置（见 2.3）
```

### 2.2 uni-app 壳：承载页 `pages/webview/index.vue`

```vue
<template>
  <view class="webview-wrap">
    <!-- 加载网络 H5 -->
    <web-view
      :src="url"
      @message="onMessage"
      @loaded="onLoaded"
      @error="onError"
    ></web-view>
  </view>
</template>

<script setup>
import { ref, onLoad } from '@dcloudio/uni-app'

const url = ref('')
onLoad((opts) => {
  // 通过页面参数传 H5 地址 + 初始 token
  const base = 'https://h5.example.com/activity'
  const token = uni.getStorageSync('token') || ''
  url.value = `${base}?token=${encodeURIComponent(token)}#/page`
})
</script>
```

!!! danger "坑 1：app-vue 下 web-view 不支持 `v-show`"
    官方明确：app-vue 的 web-view **不支持 `v-show`**（本质是改样式），**只支持 `v-if`**。用 `v-show` 切换会不显示或异常。需要显隐控制时用 `v-if`，或改用 `plus` 控制子 webview 的 `setStyle` 显隐。

### 2.3 H5 工程：base 与路由

H5 被嵌进 WebView 后，路由用 **hash 模式**最稳（App 内 `file://` 或自定义 scheme 下 history 模式刷新会 404）：

```ts
// h5-project/src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
const router = createRouter({
  history: createWebHashHistory(),   // 嵌 web-view 用 hash，避免刷新 404
  routes
})
```

> 同时 `vite.config.ts` 设正确 `base`（部署子路径时），否则静态资源 404。

---

## 三、H5 ↔ App 双向通信（核心难点）

### 3.1 H5 引入官方桥脚本

**App 端使用 `uni.web-view.js` 最低版为 `uni.webview.1.5.8.js`**（官方 2026-05-14 文档）。必须从官方仓库取最新版：

```html
<!-- H5 的 index.html，放在 body 末尾 -->
<script src="https://gitcode.com/dcloud/uni-app/raw/uni-app-vue2-dev/dist/uni.webview.1.5.8.js"></script>
```

> 鸿蒙（HarmonyOS）平台需 `uni.webview.1.5.7.js+`；环境判断 `uni.getEnv()` 返回 `harmony`。

### 3.2 H5 → App 发送消息

必须等桥就绪（`UniAppJSBridgeReady`），再 `uni.postMessage`：

```js
// h5-project/src/bridge/index.ts
export function postToApp(data: Record<string, unknown>) {
  if (typeof uni === 'undefined' || !uni.postMessage) {
    // 非 uni 环境（普通浏览器预览）降级
    return console.warn('[bridge] not in uni web-view')
  }
  uni.postMessage({ data })      // 注意：官方 API 是 { data } 包裹
}

// 初始化：等桥就绪
export function initBridge(cb?: () => void) {
  if (typeof uni !== 'undefined' && uni?.getEnv) {
    document.addEventListener('UniAppJSBridgeReady', () => cb?.(), false)
  }
}
```

!!! warning "App 端 @message 触发时机（官方）"
    - **app-vue**：实时接收 `uni.postMessage`（实时）。
    - **nvue**：用 `@onPostMessage` 实时接收。
    - **小程序**：`@message` **只在页面后退、组件销毁、用户分享时**触发（非实时）。
    - **H5 端**：`uni.postMessage` 不存在，H5 里只能用 **`window.postMessage`**。

### 3.3 App 侧接收

```vue
<!-- pages/webview/index.vue -->
<script setup>
function onMessage(e: any) {
  // App-vue：e.detail.data 是数组（官方：data 为数组形式）
  const payload = Array.isArray(e.detail.data) ? e.detail.data[0] : e.detail.data
  console.log('from H5:', payload)
  if (payload?.action === 'chooseImage') {
    uni.chooseImage({ success: (r) => callH5('onImage', r.tempFilePaths) })
  }
}
</script>
```

### 3.4 App → H5（反向调用）

App 端用 `createWebviewContext` 的 `evalJS`，或直接拿子 webview 对象：

```js
// App 端拿到子 webview
const wv = this.$scope.$getAppWebview().children()[0]
// 调用 H5 全局函数
wv.evalJS("window.onNativeCallback && window.onNativeCallback('hello from app')")
```

H5 侧暴露接收函数：

```js
window.onNativeCallback = (msg) => { /* 处理 App 下发 */ }
```

> 也可在 H5 `src` 的 query 里带初始 token/参数（一次性），持续通信仍走 `evalJS` / `postMessage`。

### 3.5 封装统一 Promise Bridge（推荐）

把双向调用统一成 `bridge.call(method, params)` Promise 化（参考 [H5+WebView 章节](h5-webview.md) 第四节），H5 业务层不感知平台差异。

!!! tip "最佳实践：URL 带 token，桥走方法调用"
    初始登录态通过 `src` query 传入（一次性、可靠）；后续动态交互（选图、定位、支付）走 `postMessage`/`evalJS`。别把所有数据塞 URL（超长会被截断）。

---

## 四、登录态与路由打通

### 4.1 登录态

```js
// H5 启动：优先读 URL token，其次 localStorage
const token = new URLSearchParams(location.search).get('token') || localStorage.getItem('token')
if (token) localStorage.setItem('token', token)
```

- App 壳登录成功后，把 token 存 `uni.setStorageSync('token')`，打开 web-view 页面时带进 `src`。
- token 过期：H5 调 `postToApp({ action: 'loginExpire' })`，App 跳登录页，登录完重开 web-view 带新 token。

### 4.2 路由：H5 内 vs 回 App

- H5 内部跳转：Vue Router（hash），**不刷新 web-view**，流畅。
- 需要 App 原生页（如支付结果）：H5 `postToApp({ action: 'openNative', page: 'payResult' })`，App 用 `uni.navigateTo` 跳转。
- 关闭 web-view 回上一页：App 侧 `uni.navigateBack()`（H5 无法直接关自己的 web-view 容器）。

---

## 五、兼容性常见问题与规避（重点）

### 5.1 层级覆盖问题（最高频坑）

> 官方：App/小程序中 **web-view 层级极高**，覆盖在普通 vue 组件之上；想盖在 web-view 之上只能用 **subNVue / nativeObj.view** 或注入 div（App 端）。

| 场景 | 问题 | 规避 |
|------|------|------|
| 自定义导航栏/弹层想盖在 H5 上 | vue 组件被 H5 遮住 | App 用 **subNVue** 或 `plus.nativeObj.view`；或把弹层做在 H5 内部 |
| 小程序自定义导航栏 | 小程序 web-view **强制带原生导航栏**，custom 无效 | 接受原生栏，或业务挪到 H5 内 |
| H5 内 fixed 元素被键盘顶起 | 软键盘遮挡 | 用 `uni.onKeyboardHeightChange` 调整，或 H5 内 `visualViewport` 监听 |

### 5.2 平台差异速查

| 项 | App-vue | App-nvue | 微信小程序 | H5 |
|----|---------|----------|-----------|-----|
| web-view 承载 | 子 webview | 需手动定宽高 | 全屏，带原生栏 | `<iframe>` |
| `uni.postMessage` 接收 | `@message` 实时 | `@onPostMessage` 实时 | `@message`（后退/销毁/分享时） | 不支持，用 `window.postMessage` |
| v-show | ❌ 不支持 | ❌ | — | ✅ |
| 本地 html | ✅ `hybrid/html` | ✅ | ❌ 仅网络 | ✅ |
| plus API | ✅ 可运行 | ❌ | ❌ | ❌ |
| 域名白名单 | 无 | 无 | ✅ 需配置 | 无 |

### 5.3 其他高频坑

!!! danger "坑清单（官方 + 社区验证）"
    1. **app-vue 不支持 `v-show`**：用 `v-if`（见 2.2）。
    2. **nvue web-view 必须指定宽高**：默认无尺寸，要 `flex:1` 或显式宽高，否则不显示。
    3. **uni.webview.js 版本过旧**：App 最低 1.5.8，旧版 `UniAppJSBridgeReady` 事件名/行为不一致，导致桥不就绪。
    4. **H5 端误用 `uni.postMessage`**：H5 里 `uni` 未注入，必须 `window.postMessage`，否则静默失败。
    5. **小程序 web-view src 未配域名白名单**：微信后台需把 H5 域名加进"业务域名/跳转域名"，否则打不开。
    6. **@message 实时性误判**：小程序端只在后退/销毁/分享触发，别拿来做实时交互。
    7. **鸿蒙不支持 plus**：鸿蒙用 `uni.createWebviewContext` 的 `back`/`evalJS`，不能调 `plus.*`。
    8. **web-view 全屏盖住原生导航**：App 若要原生头部，用 `navigationStyle:custom` + subNVue 自绘，或把头部放进 H5。

---

## 六、性能与调试

### 6.1 性能

- H5 自身优化照常做（路由级懒加载、图片 `srcset`、长列表虚拟滚动），见 [移动端性能专项](performance.md)。
- web-view 首次加载有初始化开销，频繁开关页面用 `v-if` 缓存或保持单实例。
- 本地 H5 放 `hybrid/html` 走 file 协议，**首屏秒开**，适合稳定页（活动页）。
- App 端可对子 webview `setStyle({ scalable:false })` 禁双指缩放，避免误触。

### 6.2 调试

- **App 端**：HBuilderX 真机运行 → WebView 页面可用 Chrome DevTools（`chrome://inspect`）或 Safari Inspector 调试 H5 部分；原生侧用 HBuilderX 日志。
- **vConsole**：H5 工程接入 vConsole/Eruda 便于真机看日志，**生产构建必须移除**。
- **桥联调**：用 `UniAppJSBridgeReady` 监听确认桥是否就绪；联调细节见 [真机调试与 Hybrid 桥协议实战](debug-hybrid.md)。

---

## 七、速查：Vue3(H5) + uni-app(WebView) 问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| 桥一直调不通 | `uni.webview.js` 版本旧/未就绪 | 升 1.5.8+，等 `UniAppJSBridgeReady` |
| H5 发消息 App 收不到 | H5 端用了 `uni.postMessage`（不存在） | H5 用 `window.postMessage` |
| 小程序收消息延迟 | `@message` 仅后退/销毁/分享触发 | 小程序勿做实时交互 |
| web-view 不显示 | nvue 未定宽高 / app-vue 用了 v-show | nvue 加宽高；app-vue 改 v-if |
| 弹层被 H5 遮住 | web-view 层级极高 | App 用 subNVue/nativeObj |
| 小程序打不开页 | 域名未加白名单 | 微信后台配业务域名 |
| 软键盘遮输入框 | 键盘顶起 web-view | `onKeyboardHeightChange` 或 visualViewport |
| 鸿蒙能力报错 | 调了 `plus.*` | 改用 `createWebviewContext` |

---

## 八、章节关联

- WebView 内核/桥协议原理 → [H5 + WebView 混合开发（0-1 落地）](h5-webview.md)
- 真机调试、桥安全白名单 → [真机调试与 Hybrid 桥协议实战](debug-hybrid.md)
- 内核差异/坑全集 → [移动端兼容性处理](compatibility.md)
- 适配/视口/安全区 → [移动端适配方案选择](adaptation.md)
- Vue3 纯 H5 落地 → [Vue3 移动端 0-1 落地](vue3-mobile.md)
