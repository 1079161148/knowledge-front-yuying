# 🧩 H5 + WebView 混合开发：从 0-1 落地指南

> 移动端大量业务是 **H5 跑在原生 App 的 WebView 里**（微信/抖音/支付宝/自研 App）。本篇从 0-1 讲清楚：WebView 是什么、H5 在 WebView 里和浏览器有什么不同、怎么和原生通信（JS Bridge）、登录态/路由怎么打通、缓存与离线包怎么做、调试与性能注意点。
>
> 依据：**Apple Developer — WKWebView / WKScriptMessageHandler 文档**、**Android Developer — WebView / addJavascriptInterface 文档**、**Google Web Fundamentals**、社区成熟实践（marcuswestin/WebViewJavascriptBridge、JsBridge）。所有方案均来自官方文档或经大规模验证的社区方案，**无自创猜测**。
>
> 适用：Hybrid / 混合开发、移动端岗。前置：[移动端开发基础](basics.md)、[兼容性处理](compatibility.md)、[真机调试与 Hybrid 桥协议实战](debug-hybrid.md)。

---

## 一、先认清：WebView 不是浏览器

WebView 是原生提供的"内嵌网页渲染组件"。H5 代码和它跑在系统浏览器里**大部分一致**，但有几处本质差异，必须提前知道：

| 维度 | 系统浏览器（Chrome/Safari） | App 内 WebView |
|------|------------------------------|----------------|
| 内核 | 各自独立（Safari=WebKit，Chrome=Chromium） | iOS 统一 **WKWebView(WebKit)**；Android 多为 **System WebView(Chromium)**，国内常换 **X5(腾讯)/UC** |
| 地址栏 | 有，用户可见 URL | 无，URL 对用户在黑盒 |
| 缓存策略 | 标准 HTTP 缓存 | 受原生 `CacheMode` 控制，**经常更激进** |
| 能力边界 | 受浏览器沙箱 | 受原生注入的 Bridge 能力限制 |
| 安全区/手势 | 系统统一管理 | 由原生壳层容器决定 |
| 调试 | 简单（DevTools/Inspector） | 需联调（见 [调试](debug-hybrid.md)） |

!!! warning "关键事实（官方）"
    - **iOS**：`UIWebView` 已在 iOS 12 废弃、**iOS 18 彻底移除**。现在只有 **WKWebView**（WebKit）。H5 无需关心差异，但原生必须用 WKWebView，否则上不了架/有安全漏洞。
    - **Android**：`System WebView` 随系统更新（Chromium 内核）。国内厂商常替换内核（X5/UC），**对 `dvh`/`@container` 等新特性支持参差**，上线前必须在目标 App 真机测。

---

## 二、0-1 项目搭建清单（H5 侧）

### 2.1 入口 meta（必须）

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
```

- `viewport-fit=cover`：配合 `env(safe-area-inset-*)` 适配异形屏（见 [适配方案](adaptation.md)）。
- `user-scalable=no`：禁双指缩放（H5 内通常不需要，但无障碍场景谨慎；iOS 10+ 已忽略该设置，需额外 CSS 兜底）。

### 2.2 判断运行环境（UA 检测）

```js
function getRuntime() {
  const ua = navigator.userAgent
  if (/MicroMessenger/i.test(ua)) return 'wechat'
  if (/Douyin|Aweme/i.test(ua)) return 'douyin'
  if (/Alipay/i.test(ua)) return 'alipay'
  if (/iPhone|iPad/i.test(ua)) return 'ios-webview'
  if (/Android/i.test(ua)) return 'android-webview'
  return 'browser'
}
```

!!! danger "坑：别用 UA 做能力判断的充要条件"
    UA 可被伪造、各厂规则会变。正确做法：**UA 只判断"运行在哪个壳"，真正的能力用 `[Bridge].support('getLocation')` 探测**。能力检测优先于 UA 推断（见 [兼容性处理](compatibility.md)）。

### 2.3 Bridge 注入时机（关键）

原生注入 Bridge 对象**需要时间**，H5 不能一加载就调。标准做法：

```js
// H5 侧：等原生就绪再初始化 bridge
function whenBridgeReady(cb) {
  if (window.__bridgeReady) return cb()
  // 原生注入成功后调用 window.__onBridgeReady()
  window.__onBridgeReady = cb
}
// 原生（iOS/Android）在 WebView 加载完成后调用：
//   iOS:  webView.evaluateJavaScript("window.__onBridgeReady && window.__onBridgeReady()")
//   Android: webView.loadUrl("javascript:window.__onBridgeReady && window.__onBridgeReady()")
```

!!! tip "最佳实践：双保险"
    1. H5 暴露 `window.__onBridgeReady` 回调，原生注入完主动触发；
    2. 同时 H5 轮询/监听 `window.webkit.messageHandlers` 或 `window.AndroidBridge` 是否存在，避免原生漏触发时卡死。

---

## 三、JS Bridge 通信（官方 API 为准）

Bridge 本质是 **H5 ↔ 原生 的双向调用**。下面两套是**各平台官方提供**的底层机制，不要自己发明。

### 3.1 iOS：WKWebView 官方方案

**H5 → 原生**：用 `WKScriptMessageHandler`（原生注册 handler，H5 通过 `postMessage` 发）：

```js
// H5 调用（原生需先注册名为 'nativeBridge' 的 handler）
window.webkit.messageHandlers.nativeBridge.postMessage({
  id: 1,
  method: 'getLocation',
  params: { type: 'wgs84' }
})
```

**原生 → H5**：`webView.evaluateJavaScript("window.__nativeCallback(...)")`。

> 官方文档明确：`WKScriptMessageHandler` 是 WKWebView 推荐的 H5→原生通信方式，**比老的 `location.href` scheme 拦截更可靠、无长度限制、类型安全**（直接传对象，不用拼 URL）。

### 3.2 Android：官方方案与社区库

**官方原生 → H5**：`webView.evaluateJavascript("window.xxx(...)", callback)`（Android 4.4+ 推荐，替代老 `loadUrl("javascript:...")`）。

**官方 H5 → 原生**：`addJavascriptInterface`（注入 Java 对象给 JS 调用）：

```java
// Android 原生
webView.addJavascriptInterface(new JsBridge(), "AndroidBridge");
// H5 调用：window.AndroidBridge.getLocation(JSON.stringify({...}))
```

!!! danger "Android 安全铁律（官方安全指南）"
    - `addJavascriptInterface` 在 **Android 4.2(API 17) 以下有反射漏洞**（任意网页可执行任意 Java）。**最小版本务必 ≥ API 17**，且被注入的方法必须加 **`@JavascriptInterface` 注解**，否则不可被 JS 调用、也避免误暴露。
    - 不要在注入对象里暴露"执行任意字符串"的方法。

### 3.3 社区成熟库（经大规模验证，可直接用）

不想自己造轮子时，用社区验证过的方案：

| 库 | 平台 | 说明 |
|----|------|------|
| **marcuswestin/WebViewJavascriptBridge** | iOS(WKWebView/UIWebView) + Android | GitHub 高星、长期维护，封装了消息队列与回调 |
| **lzyzsd/JsBridge** | Android | 基于 `addJavascriptInterface` + scheme 兜底，国内项目广泛使用 |
| **微信/抖音/支付宝 JS-SDK** | 对应 App | 官方 SDK，提供分享/支付/定位等，按官方文档接入 |

!!! tip "选型建议"
    - 自研 App：直接用官方 `WKScriptMessageHandler`(iOS) + `addJavascriptInterface`(Android API≥17)，封装一层 Promise（见第四节）。
    - 接微信/抖音/支付宝：直接用官方 JS-SDK，别自己逆向 scheme。
    - 跨端统一：用 WebViewJavascriptBridge 抹平双端差异。

---

## 四、Bridge 协议设计（JSON-RPC + Promise 化 + 安全）

无论底层是 messageHandlers 还是 interface，对 H5 暴露**统一 Promise 化接口**，业务代码不感知平台差异。

### 4.1 最小可用实现（H5 侧）

```js
class HybridBridge {
  constructor() {
    this._seq = 0
    this._pending = new Map()
    // 原生回调入口（原生回传 { id, data?, error? }）
    window.__nativeCallback = (id, data, error) => {
      const task = this._pending.get(id)
      if (!task) return
      this._pending.delete(id)
      error ? task.reject(error) : task.resolve(data)
    }
  }
  call(method, params = {}, timeout = 10000) {
    const id = ++this._seq
    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject })
      const payload = { id, method, params }
      if (window.webkit?.messageHandlers?.nativeBridge) {
        window.webkit.messageHandlers.nativeBridge.postMessage(payload)
      } else if (window.AndroidBridge) {
        window.AndroidBridge.call(id, method, JSON.stringify(params))
      } else {
        // 兜底 scheme（仅短数据；长数据走 postMessage）
        location.href = `app://bridge?data=${encodeURIComponent(JSON.stringify(payload))}`
      }
      setTimeout(() => {
        if (this._pending.has(id)) {
          this._pending.delete(id)
          reject({ code: 'TIMEOUT', message: `bridge ${method} timeout` })
        }
      }, timeout)
    })
  }
}
```

### 4.2 必须遵守的 4 条规范（避免误导）

1. **必须带 timeout**：原生异常不回调时 Promise 会永远 pending，页面假死。一定要超时 reject（见上方 `setTimeout`）。
2. **scheme 有长度上限**：`location.href = app://...` URL 长度受限（且部分 WebView 更短）。**大数据必须走 `postMessage` 或注入对象**，不要塞 scheme。
3. **方法白名单**：原生端维护允许调用的方法清单（如 `getLocation`、`chooseImage`），不在清单一律拒绝，杜绝"任意 H5 调任意原生"。
4. **origin 校验**：原生收到调用时校验 `window.location.origin` 是否在白名单域名，防止恶意页面调起原生能力（见 [调试与 Hybrid 安全](debug-hybrid.md) §五）。

### 4.3 原生 → H5 事件下发

```js
// 原生 push 事件（登录失效/支付结果）
window.__dispatchNativeEvent('loginExpire', { /* payload */ })
// H5 订阅
bridge.on('loginExpire', () => { /* 跳登录 */ })
```

---

## 五、登录态 / 路由 / 生命周期打通

### 5.1 登录态：原生登录后注入 token

```js
// H5 启动：优先读原生注入的 token，其次本地 localStorage
bridge.call('getToken')
  .then(token => { if (token) localStorage.setItem('token', token) })
  .catch(() => { /* 降级：走 H5 登录 */ })
```

!!! tip "最佳实践"
    统一登录在原生层完成，登录成功把 token 注入 WebView（Cookie 或 Bridge 下发），H5 不再重复登录，体验一致。token 过期用 `loginExpire` 事件通知 H5 跳登录。

### 5.2 路由：H5 内 vs 原生页

- H5 内部跳转：**前端路由**（不刷新 WebView，体验快）。
- 需要原生页（支付结果页、扫一扫）：`bridge.call('openNativePage', { name, params })`。
- 关闭当前 WebView：`bridge.call('closePage')`。

### 5.3 生命周期对齐

WebView 有 `onResume`/`onPause`（Android）、`viewWillAppear`/`viewDidDisappear`（iOS）。原生可在这些时机通知 H5：

```js
// 原生在页面回到前台时调用
window.__onPageShow && window.__onPageShow()
```

H5 用它刷新数据、恢复动画、重连长连接。**不要只依赖 `visibilitychange`**，WebView 切后台时浏览器事件可能不触发或延迟。

---

## 六、缓存与离线包（首屏提速核心）

| 方案 | 做法 | 适用 |
|------|------|------|
| **HTTP 缓存** | 静态资源设强缓存 + 文件名 hash | 通用，但 WebView 缓存策略常被原生覆盖 |
| **离线包** | 原生把 H5 资源预埋/下载到本地，WebView 加载 `file://` 或本地 server | 首屏秒开、省流量（大厂主流） |
| **增量更新** | 只下 diff 包，原生解压替换 | 更新体积小 |
| **版本协商** | H5 启动向原生要"当前资源版本"，决定用本地还是拉新 | 避免用旧资源 |

!!! danger "坑：离线包版本不一致"
    发版后资源不更新 → 用户看到旧页面、甚至 JS/CSS 哈希对不上白屏。**必须有版本号校验 + 失败时回源 CDN 兜底**。

!!! tip "缓存策略建议（官方 Web Fundamentals）"
    - HTML 用 `no-cache`（每次协商），JS/CSS/图片用 `immutable` + 内容 hash 强缓存。
    - WebView 侧原生设置 `CacheMode`（Android）为 `LOAD_DEFAULT`，避免 `LOAD_CACHE_ONLY` 永不更新。

---

## 七、调试与性能注意（关联其他篇）

- **调试**：iOS 用 Safari Web Inspector、Android 用 `chrome://inspect`、App 内注入 **vConsole/Eruda**（生产必须移除）。完整步骤见 [真机调试与 Hybrid 桥协议实战](debug-hybrid.md)。
- **性能**：WebView 内存更紧张，长列表虚拟滚动、图片 `srcset`、路由级懒加载一样要做，见 [移动端性能专项](performance.md)。
- **兼容性**：各 WebView 内核差异见 [兼容性处理](compatibility.md)。**上线前必须在目标 App 真机测**，别只看系统浏览器。

---

## 八、速查：H5 + WebView 问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| bridge 无响应 | 原生未注入 / 方法名错 | 白名单核对 + vConsole 打点 |
| 调用后 Promise 挂死 | 原生没回调 | 加 `timeout`（第四节 4.2①） |
| 数据过长失败 | scheme 长度限制 | 改 `postMessage`（4.2②） |
| 页面在微信里样式怪 | WebView 内核差异 | 真机测 + 能力检测降级 |
| 登录态丢失 | 没走原生注入 token | `getToken` + `loginExpire`（第五节） |
| 离线包旧资源 | 版本未校验 | 版本号 + 回源兜底（第六节） |
| Android 注入报错 | 未加 `@JavascriptInterface` / API<17 | 注解 + minSdk≥17（3.2） |

---

## 九、章节关联

- 桥协议细节、安全白名单、Hybrid 联调步骤 → [真机调试与 Hybrid 桥协议实战](debug-hybrid.md)
- 适配/视口/安全区 → [移动端适配方案选择](adaptation.md)
- 内核差异/坑全集 → [移动端兼容性处理](compatibility.md)
- Vue3 / React 落地（含设计稿规范、PostCSS 自动转 vw）→ [Vue3 移动端 0-1](vue3-mobile.md) / [React 移动端 0-1](react-mobile.md)
