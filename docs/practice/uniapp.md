# uni-app 跨端业务实战

uni-app 用**一套 Vue 代码**编译到 H5 / 微信小程序 / App（iOS·Android）/ 支付宝等。它的难点不在"写页面"，而在**跨端差异的抹平**：条件编译、平台 API 不一致、页面栈限制、分包、Bridge 通信、安全区。下面都是真实项目高频撞的点。

> 前置：[uni-app + Vue3 H5 混合开发](../mobile/uniapp-vue3-webview.md)、[跨端方案选型](../mobile/cross-platform.md)、[小程序原生开发](../mobile/miniprogram.md)。

---

## 条件编译：一套代码多端差异化

**难点**：分享卡片、支付、定位等各端 API 完全不同；同一段逻辑在 H5 能跑，小程序里直接报错。

**最佳实践**：用 `#ifdef %PLATFORM%` 条件编译，把平台差异收敛到最小面，业务代码保持统一。

```vue
<!-- 分享：H5 用网页分享，小程序用 button open-type=share -->
<template>
  <view class="share-btn" @click="onShare">
    <!-- #ifdef MP-WEIXIN -->
    <button open-type="share">分享给好友</button>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <text>点击复制链接</text>
    <!-- #endif -->
  </view>
</template>

<script setup>
function onShare() {
  // #ifdef H5
  navigator.clipboard.writeText(location.href);
  // #endif
  // #ifdef APP-PLUS
  uni.share({ provider: 'weixin', type: 0, title: '好物', href: 'https://x.com/a' });
  // #endif
}
</script>
```

**关键点**

- 条件编译不仅支持 `script`，也支持 `template` 和 `style`，能用 CSS 区分就别写两份 JS。
- 平台判断别散落业务里，封成 `platform.js` 统一导出 `isWeixin / isApp / isH5`。

---

## H5 ↔ App 双向通信（WebView Bridge）

**难点**：App 用 `web-view` 嵌 H5 时，H5 要调原生能力（拍照、定位、登录态）；回调是异步的，且桥**就绪有延迟**。

**最佳实践**：H5 引入官方 `uni.webview.js`，监听 `UniAppJSBridgeReady` 就绪后再通信；统一封装成 Promise Bridge，业务层不感知平台。

```js
// H5 侧：等桥就绪
function ready() {
  return new Promise(resolve => {
    if (window.__uniBridgeReady) return resolve();
    document.addEventListener('UniAppJSBridgeReady', () => {
      window.__uniBridgeReady = true; resolve();
    });
  });
}
// 统一 Promise 化调用
function callNative(method, params = {}) {
  return ready().then(() => new Promise((resolve, reject) => {
    // 注意：H5 里 uni 未注入，必须 window.uni（由 web-view 注入）
    uni.postMessage({ data: { method, params } }); // 主动发
    // 也可用 uni.webView.getEnv / 原生主动回调
    resolve();
  }));
}
// App 侧（vue 页面）接收
// <web-view @message="onMsg" :src="url" />
// onMsg(e){ const { method, params } = e.detail.data[0]; ... }
```

**关键点**

- H5 端**绝不能**用 `uni.postMessage` 的"反向调原生方法"语义误用；H5 里 `uni` 是 web-view 注入的，别在纯 H5 站点引这份脚本。
- 小程序 `web-view` 的 `@message` **只在后退/销毁/分享**触发，别拿做实时交互。
- 微信小程序需把 H5 域名加进**业务域名白名单**，否则打不开。

---

## 页面栈限制（小程序最多 10 层）

**难点**：小程序页面栈上限 10 层，深层跳转（商品→店铺→详情→…）反复 `navigateTo` 会溢出报错。

**最佳实践**：超过阈值改用 `redirectTo`（替换当前页）或 `reLaunch`；列表→详情用 `navigateTo`，详情→详情用 `redirectTo`。

```js
export function smartNavigate(url, depth = 0) {
  const pages = getCurrentPages();
  if (pages.length >= 9) {
    uni.redirectTo({ url });        // 快满栈时替换，不累加
  } else {
    uni.navigateTo({ url });
  }
}
```

**关键点**

- 用 `getCurrentPages().length` 判断当前栈深，封装成统一跳转方法。
- Tab 页用 `switchTab`，不能 `navigateTo`。

---

## 分包加载（小程序主包 2MB 限制）

**难点**：主包超 2MB 无法上传；首屏把所有页面打进主包，启动慢。

**最佳实践**：`pages.json` 里配 `subPackages`，把非首屏业务拆子包；静态大资源放 `subPackages` 或走 CDN。

```json
{
  "pages": ["pages/tab/home", "pages/tab/mine"],      // 主包只留 tab + 启动
  "subPackages": [{
    "root": "pkg-order",
    "pages": ["list", "detail", "refund"]             // 订单域整包拆出
  }],
  "preloadRule": {
    "pages/tab/home": { "network": "all", "packages": ["pkg-order"] } // 空闲预下载
  }
}
```

**关键点**

- 主包只放 tabBar 页和启动必需；`preloadRule` 在 Wi-Fi 下预拉子包，进二级页秒开。
- 分包之间**不能互相引用**（除主包），公共组件放主包或按依赖归类。
- 大图/视频走 CDN，别塞进包体。

---

## 安全区 + 键盘适配（App / H5）

**难点**：App 里 `web-view` 是最高层级，H5 的 `fixed` 弹层会被原生键盘顶起错位；底部 Home 条挡按钮。

**最佳实践**：用 `uni.getSystemInfoSync().safeAreaInsets` 拿安全区；键盘高度用 `uni.onKeyboardHeightChange` 动态修正输入框位置。

```js
// 获取安全区内边距
const { safeAreaInsets } = uni.getWindowInfo(); // 新 API
// 旧：uni.getSystemInfoSync().safeAreaInsets
data() { return { safeBottom: safeAreaInsets.bottom } }

// 键盘高度变化
uni.onKeyboardHeightChange(res => {
  this.keyboardH = res.height;
  if (res.height > 0) this.scrollToInput(); // 滚到可视区
});
```

**关键点**

- App 端想让弹层盖在 web-view 上，要用 `subNVue` 或 `plus.nativeObj.view`，纯 H5 层做不到置顶。
- H5 内软键盘用 `visualViewport` 监听（见 [移动端视口](../mobile/index.md)）。

---

## 真机调试与发布避坑

**难点**：开发器正常、真机白屏；各 App WebView 内核不一致；vConsole 忘删导致生产泄露。

**最佳实践**

- iOS 用 Safari Web Inspector、Android 用 `chrome://inspect`；App 注入 vConsole，**生产构建必须移除**。
- 上线前在目标 App（微信/抖音/支付宝）真机测，别只看系统浏览器。
- `uni.webview.js` 版本过低会导致桥事件名不一致，App 最低 1.5.8。

---

## 音视频播放与直播（跨端实战）

**难点**：uni-app 里 `<video>` 在 H5 / 微信小程序 / App 三端行为差极大；直播要低延迟、连麦要原生；移动端内核坑见 [移动端音视频](mobile/mobile-media-processing.md)、[移动端直播](mobile/mobile-live.md)。

**最佳实践**

```vue
<!-- 内联播放（电商详情页必须，防 iOS 跳全屏） -->
<video :src="url" playsinline webkit-playsinline controls
       :show-center-play-btn="false" :enable-progress-gesture="false" />
```

- **H5 端**：用 `hls.js` 播 m3u8、`flv.js` 播低延迟流；自动播放必须 `muted`（移动端禁有声自动播放）。
- **微信小程序**：`<video>` 组件原生支持，但 `rtmp` 直播要 `<live-player>` 组件，连麦要原生 `<live-pusher>`。
- **App 端**：用原生 `plus.video` 或 `uni.createLivePusherContext` 做连麦，比 WebView 内 WebRTC 稳。
- **上传视频**：大视频走 [分片上传](mobile/mobile-weak-network.md) + 服务端转码（见 [Java 音视频](java/media-processing.md)）。

**关键点**
- iOS 微信里 WebView `<video>` 自动全屏 → `playsinline` 是底线；仍被强全屏则走原生播放器。
- 直播协议选型（HLS/FLV/WebRTC 延迟对比）见 [PC 直播](pc/pc-live.md)。

---

## 原生插件 / 原生能力桥接

**难点**：H5 跑不了的能力（蓝牙、扫码、原生推送、人脸、支付 SDK）必须走原生插件；但插件开发与调试成本高，且 App/小程序两端不通用。

**最佳实践**

```js
// App 端调原生能力（module 名由原生插件暴露）
plus.bridge.exec('MyPlugin', 'scan', [arg], (res) => { /* 回调 */ });

// 小程序端用 wx 原生 API（条件编译隔离）
// #ifdef MP-WEIXIN
wx.scanCode({ success: r => console.log(r.result) });
// #endif
```

- 能用前端方案（如 Web Bluetooth 部分支持）就别上原生插件，降维护成本。
- 原生插件发布到插件市场或自研 Module，App 端 `.nativeplugin` 目录配置。
- **支付**：小程序用 `wx.requestPayment`、App 用各 SDK，统一封 `pay(order)` 按平台分支。

---

## 分包预加载 + 启动性能

**难点**：首屏白屏、二级页进得慢；主包 2MB 限制下要塞下所有首屏必需。

**最佳实践**：`preloadRule` 在空闲（Wi-Fi）预拉子包；首屏只留 tabBar + 启动逻辑。

```json
{
  "preloadRule": {
    "pages/tab/home": { "network": "all", "packages": ["pkg-order", "pkg-mall"] }
  }
}
```

- 用 `uni.preloadPage` 预载常去的二级页（小程序侧部分支持），进页秒开。
- 启动性能：拆 `main.js`、首屏数据并行请求、`onLaunch` 里别做重活。
- 真机首屏见 [弱网首屏](mobile/mobile-weak-network.md)。

---

## 跨端状态管理（Pinia / Vuex）

**难点**：多端共享用户态/购物车，刷新后丢失；Tab 切换状态不保留；模块拆分混乱导致热更新失效。

**最佳实践**：uni-app Vue3 用 **Pinia**，持久化用 `pinia-plugin-persistedstate` 落 `storage`。

```js
// stores/cart.js
export const useCart = defineStore('cart', {
  state: () => ({ items: [] }),
  getters: { total: s => s.items.reduce((a, b) => a + b.qty, 0) },
  actions: { add(g) { this.items.push(g); } },
});
// main.js：持久化到本地（小程序/App 的 storage）
createPinia().use(piniaPluginPersistedstate);
```

- **避坑**：`state` 里别放非序列化对象（函数/Proxy）；H5 用 `localStorage`、小程序用 `uni.setStorageSync`，插件自动适配。
- Tab 页状态天然保留；非 Tab 页 `onUnload` 会清，需持久化或放全局 store。
- 刷新（H5）后 store 重建，靠持久化插件恢复。

---

## 面试怎么说（STAR）

- **难点**：H5 嵌 App 桥不就绪导致支付调不起来 → 封装 `UniAppJSBridgeReady` 就绪锁 + Promise Bridge，联调通过率 100%。
- **亮点**：统一 `smartNavigate` 解决小程序 10 层栈溢出；`preloadRule` + `preloadPage` 让二级页首屏 < 800ms。
- **坑**：微信业务域名忘加白名单 → web-view 打不开，沉淀成发布 Checklist 一项。
- **音视频**：`<video playsinline>` 防 iOS 跳全屏；连麦走原生 `live-pusher` 比 WebView 稳。
- **状态**：Pinia + 持久化插件统一多端购物车，刷新不丢。
