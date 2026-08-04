# 🔧 移动端真机调试与 Hybrid 桥协议实战

> 模拟器跑通 ≠ 真机没问题。本篇讲 **真机远程调试**（iOS/Android/各 App WebView）+ **Hybrid JS Bridge 协议**设计与实战（如何和原生通信、鉴权、路由、安全）。依据 **Chrome DevTools 文档**、**Safari Web Inspector**、**微信/抖音 JS-SDK 文档**、社区 bridge 实践。
>
> 适用：中级实战、Hybrid 开发。前置：[兼容性处理](compatibility.md)、[基础](basics.md)。

---

## 一、真机调试：三种方式

### 1.1 iOS（Safari / WKWebView）

**Mac + iPhone**：
1. iPhone：`设置 → Safari → 高级 → 打开"Web 检查器"`。
2. Mac：Safari（`开发` 菜单 → 选设备 → 选页面）。首次需在 `Safari 偏好 → 高级` 勾"在菜单栏显示开发菜单"。
3. 可断点、看 Console、查安全区、模拟网络。

**无 Mac（Windows/Linux）**：用 **ios-webkit-debug-proxy** + Chrome，或第三方工具（如 `remotedebug-ios-webkit-adapter`）。体验略差。

### 1.2 Android（Chrome / 系统 WebView）

1. 手机：`设置 → 关于手机 → 连点版本号 7 次` 开开发者模式 → `USB 调试` 打开。
2. 数据线连电脑，`chrome://inspect/#devices` → 选页面 → `inspect`。
3. 可审查元素、Console、Network、Performance。

!!! tip "连不上？"
    - 装对应 **USB 驱动**（小米/华为各自驱动）。
    - 手机选"传输文件"模式而非"仅充电"。
    - 命令行 `adb devices` 确认识别。

### 1.3 在 App 内 WebView 调试（微信/抖音/支付宝）

| App | 调试入口 |
|-----|---------|
| **微信** | 公众号网页：`微信开发者工具` 的"webview 调试"；小程序用 DevTools。真机用 `vConsole` 注入 |
| **抖音/头条** | 字节小程序 DevTools，或真机 `vConsole` |
| **支付宝** | 蚂蚁开发者工具 Web 调试 |

**通用兜底**：页面注入 **vConsole / Eruda**（移动端专属调试面板）：

```html
<script src="https://cdn.jsdelivr.net/npm/vconsole@3"></script>
<script>new VConsole()</script>
```

!!! danger "坑：vConsole 别上生产"
    调试完必须移除/按环境开关，否则泄露日志、占性能、暴露敏感信息。

---

## 二、真机调试必查清单

| 检查项 | 为什么 |
|--------|--------|
| 安全区（刘海/灵动岛/Home 条） | 模拟器经常不显示 cutout |
| 软键盘弹起/收起 | 模拟器键盘行为不同于真机 |
| 手势/滚动回弹 | 模拟器触摸手感失真 |
| 不同 DPR 清晰度 | 模拟器 DPR 可改但不如真机真实 |
| 目标 App 内 WebView | 内核/缓存差异最大 |
| 弱网/断网 | 用 DevTools `Network` 节流模拟 |
| 横竖屏切换 | 折叠屏/旋转布局 |
| 通知/权限弹窗 | 原生层交互 |

---

## 三、Hybrid 架构：H5 与原生怎么分工

```
┌─────────────┐   JS Bridge    ┌─────────────┐
│  H5 (Vue/React) │ ◀──────────▶ │ 原生 (iOS/Android)│
│  业务 UI/逻辑   │  call / callback│ 相机/定位/支付/   │
└─────────────┘                │ 文件系统/推送      │
                               └─────────────┘
```

**分工原则**：
- **H5 做**：页面 UI、业务交互、数据展示（迭代快、热更新）。
- **原生做**：相机、相册、定位、支付、蓝牙、推送、文件、生物识别（需系统权限）。

---

## 四、JS Bridge 协议设计（核心）

### 4.1 两种通信机制

| 方向 | iOS | Android |
|------|-----|---------|
| H5 → 原生 | 注入 `WKScriptMessageHandler` / 改 `location.href` scheme | `addJavascriptInterface` / scheme |
| 原生 → H5 | `webView.evaluateJavaScript` | `loadUrl("javascript:...")` |

**统一抽象**：不管底层机制，对 H5 暴露**一个 Promise 化的 `bridge.call()`**。

### 4.2 协议格式（推荐 JSON-RPC 风格）

```js
// H5 调用原生
bridge.call('getLocation', { type: 'wgs84' })
  .then(res => console.log(res.lat, res.lng))
  .catch(err => console.error(err))

// 原生收到：{ id, method: 'getLocation', params: {...} }
// 原生回：{ id, data: {...} } 或 { id, error: { code, msg } }
```

### 4.3 实现一个最小 Bridge（H5 侧）

```js
class Bridge {
  constructor() { this._cbs = new Map(); this._seq = 0; this._init() }
  _init() {
    // 原生回调入口（全局挂在 window）
    window.__nativeCallback = (id, data, err) => {
      const cb = this._cbs.get(id)
      if (!cb) return
      this._cbs.delete(id)
      err ? cb.reject(err) : cb.resolve(data)
    }
  }
  call(method, params = {}, timeout = 10000) {
    const id = ++this._seq
    return new Promise((resolve, reject) => {
      this._cbs.set(id, { resolve, reject })
      // iOS: 通过 WKWebView messageHandlers
      if (window.webkit?.messageHandlers?.bridge) {
        window.webkit.messageHandlers.bridge.postMessage({ id, method, params })
      } else if (window.AndroidBridge) {
        // Android: 注入对象
        window.AndroidBridge.call(id, method, JSON.stringify(params))
      } else {
        // 兜底：自定义 scheme
        location.href = `myapp://bridge?data=${encodeURIComponent(JSON.stringify({ id, method, params }))}`
      }
      // 超时保护
      setTimeout(() => {
        if (this._cbs.has(id)) { this._cbs.delete(id); reject({ code: 'TIMEOUT' }) }
      }, timeout)
    })
  }
}
const bridge = new Bridge()
```

!!! danger "坑 1：Bridge 调用没超时 → 页面假死"
    原生异常不回调，Promise 永远 pending。必须加 `timeout` 兜底。

!!! danger "坑 2：scheme 长度限制"
    `location.href = myapp://...` 的 URL 有长度上限（约 2MB，且部分 WebView 更短）。大数据走 `postMessage` 或原生注入对象，别塞 scheme。

!!! danger "坑 3：Android `addJavascriptInterface` 注入对象可被 XSS 利用"
    4.2 以下有反射漏洞。现代做法用 `postMessage` + 白名单方法名，禁止注入任意对象。

---

## 五、Bridge 安全（必做）

| 风险 | 方案 |
|------|------|
| 任意网页调用原生能力 | 校验 `location.origin` 白名单，非白名单域名拒绝 bridge |
| XSS 触发敏感操作 | 方法名白名单（只允许 `getLocation` 等显式列表） |
| 数据泄露 | 敏感接口（支付/通讯录）需原生二次确认 + token |
| 伪造回调 | 回调 `id` 由 H5 生成、原生原样回传，防重放 |

!!! tip "最佳实践：方法白名单"
    原生端维护允许的方法清单，不在清单的一律拒绝，杜绝"任意 H5 调任意原生"。

---

## 六、Hybrid 路由与通信约定

### 6.1 路由：H5 内路由 vs 打开新原生页

- H5 内部跳转用前端路由（不刷新 WebView）。
- 需要原生页（如原生支付结果页）用 `bridge.call('openNativePage', { name, params })`。

### 6.2 登录态打通

```js
// H5 拿 token：优先读原生注入，其次 localStorage
bridge.call('getToken').then(t => localStorage.setItem('token', t))
```

!!! tip "统一登录：原生登录后注入 token 到 WebView"
    避免 H5 再走一遍登录流程，体验一致。

### 6.3 事件下发（原生 → H5）

```js
// 原生 push 事件给 H5
window.__onNativeEvent('loginExpire', {})
// H5 监听
bridge.on('loginExpire', () => { /* 跳登录 */ })
```

---

## 七、离线包 / 热更新（进阶）

| 方案 | 说明 |
|------|------|
| 离线包 | 原生把 H5 资源预埋/下载到本地，WebView 加载 `file://` 或 `localServer`，秒开、省流量 |
| 增量更新 | 只下 diff 包，原生解压替换 |
| 版本协商 | H5 启动向原生要"当前资源版本"，决定用本地还是拉新 |

!!! danger "坑：离线包版本不一致"
    发版后资源不更新 → 用户看到旧页面。必须有**版本号校验 + 失败时回源 CDN** 的兜底。

---

## 八、调试 Hybrid 的实战步骤

1. **先独立调 H5**：Chrome 桌面 + 移动端模拟，跑通业务。
2. **注入 vConsole**，真机在目标 App 打开，看 Console/Network。
3. **Bridge 联调**：原生打 debug 包，H5 调 `bridge.call` 看原生是否收到、回什么。
4. **安全区/键盘真机复测**（见 [兼容性](compatibility.md)）。
5. **弱网卡/离线包**验证首屏与回源。

---

## 九、速查：Hybrid 问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| bridge 无响应 | 原生未注入 / 方法名错 | 白名单核对 + vConsole 打点 |
| 调用后 Promise 挂死 | 原生没回调 | 加 `timeout` |
| 微信旧资源 | 缓存激进 | 版本号/离线包 |
| 安全区错 | WebView 内核老 | `@supports` 降级 |
| 敏感操作被拦 | 白名单限制 | 走原生二次确认 |
| 数据过长失败 | scheme 长度限制 | 改 `postMessage` |
