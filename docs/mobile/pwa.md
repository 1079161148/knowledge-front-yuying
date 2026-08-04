# 🔌 PWA 离线实战（Service Worker + 离线缓存 + 可安装）

> PWA 让 H5 拥有"类原生"能力：离线可看、秒开、可加到桌面、推送通知。本篇从 0 讲清 **Service Worker 生命周期、离线缓存策略、manifest 可安装、调试与避坑**。依据 **web.dev PWA**、**MDN Service Worker**、**Workbox 文档**。
>
> 适用：中级进阶、想做"免下载 App"的团队。前置：[移动端性能专项](performance.md)、[浏览器原生优化 API §4.1](../advanced/browser-optimize-api.md)。

---

## 一、PWA 是什么 / 不是什么

- **是**：标准 Web 技术（SW + manifest + HTTPS），渐进增强。离线壳 + 缓存资源 + 可安装。
- **不是**：不是原生 App，不能上架应用商店（除非套 Capacitor/React Native 壳），无系统级权限。

!!! tip "适合场景"
    内容型/工具型产品（资讯、文档、电商、内部系统）。强原生能力（蓝牙/支付/推送精准）仍走 Hybrid（见 [debug-hybrid](debug-hybrid.md)）。

---

## 二、最小可运行 PWA（手写 Service Worker）

### 2.1 注册 SW（主线程）

```js
// main.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('SW registered'))
      .catch(err => console.error('SW fail', err))
  })
}
```

### 2.2 离线缓存（SW 生命周期）

```js
// sw.js
const CACHE = 'v1-shell'
const SHELL = ['/', '/index.html', '/main.js', '/styles.css', '/offline.html']

// 安装：预缓存壳
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)))
  self.skipWaiting()          // 跳过等待，立即激活新 SW
})

// 激活：清旧缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  )
})

// 拦截请求：缓存优先，失败回源/离线页
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        // 动态缓存成功的响应
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, copy))
        return res
      }).catch(() => caches.match('/offline.html'))
    )
  )
})
```

!!! danger "坑 1：缓存不更新（最经典）"
    只 `skipWaiting` 没在 `activate` 删旧缓存 → 用户永远拿旧 JS。务必：**版本化 cache name + activate 删旧 + 关键资源用网络优先或 stale-while-revalidate**。

!!! danger "坑 2：本地 http 不生效"
    SW 要求 **HTTPS**（localhost 例外）。本地用 `http://127.0.0.1` 可调试，但真机/测试环境必须 HTTPS。

---

## 三、用 Workbox（生产推荐，别手写）

手写 SW 易错。Workbox（Google 官方）封装了策略：

```bash
npm i -D workbox-build workbox-window
```

```js
// workbox-config.js
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
  swDest: 'dist/sw.js',
  runtimeCaching: [{
    urlPattern: /\/api\//,
    handler: 'NetworkFirst',      // API：网络优先，失败用缓存
    options: { cacheName: 'api', networkTimeoutSeconds: 3 }
  }]
}
```

```js
// 主线程
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
registerRoute(/\.(?:js|css)$/, new StaleWhileRevalidate())
```

**缓存策略选型**：

| 策略 | 适用 |
|------|------|
| `CacheFirst` | 静态资源（JS/CSS/图），变了靠文件名 hash |
| `NetworkFirst` | API 请求，弱网回退缓存 |
| `StaleWhileRevalidate` | 可容忍旧数据的资源（字体、头像） |

---

## 四、可安装（manifest）

```json
// manifest.webmanifest
{
  "name": "我的应用",
  "short_name": "应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fff",
  "theme_color": "#1677ff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

```html
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#1677ff">
```

!!! tip "安装条件（浏览器）"
    需 HTTPS + 有效 manifest + 至少一个 SW + 用户交互后。iOS Safari 需用户"添加到主屏幕"（无自动弹窗）。

---

## 五、推送通知（进阶）

```js
// 订阅（需后端 VAPID 密钥）
navigator.serviceWorker.ready.then(reg =>
  reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_KEY })
)
// SW 接收
self.addEventListener('push', e => {
  self.registration.showNotification('新消息', { body: e.data.text() })
})
```

!!! warning "平台差异"
    iOS 的 Web Push 仅 **iOS 16.4+ 且添加到主屏幕的 PWA** 才支持，且需用户授权。Android 支持最好。

---

## 六、调试与验证

- Chrome → `Application` 面板：看 SW 状态、Cache Storage、Manifest、通知权限。
- Lighthouse → PWA 审计给分。
- 真机：Android Chrome 直接测；iOS 用 Safari Web Inspector 看 SW。

!!! danger "坑 3：开发环境 SW 缓存导致改了不生效"
    开发时 SW 缓存让你改的代码"看不到"。Dev 环境用 `self.skipWaiting` 谨慎，或本地关 SW（`Application → Unregister`）。生产才启用。

!!! danger "坑 4：缓存了 API 导致数据不刷新"
    API 别用 `CacheFirst`，用 `NetworkFirst` + 超时回退，避免看到陈旧数据。

---

## 七、PWA vs Hybrid 怎么选

| 维度 | PWA | Hybrid（含壳） |
|------|-----|---------------|
| 离线 | ✅ 强 | ⚠️ 离线包可 |
| 可安装 | ✅ 加到桌面 | ✅ 应用商店 |
| 原生能力 | ❌ 有限 | ✅ 相机/支付/蓝牙 |
| 上架商店 | ❌ | ✅ |
| 推送 | ⚠️ iOS 受限 | ✅ |
| 开发成本 | 低（纯 Web） | 中（需原生配合） |

**决策**：内容型/轻工具 → PWA；要原生能力/上架 → Hybrid（[debug-hybrid](debug-hybrid.md)）。

---

## 八、速查：PWA 避坑

1. 必须 HTTPS（localhost 例外）。
2. cache name 版本化 + activate 删旧，否则永远旧版。
3. API 用 NetworkFirst，静态用 CacheFirst。
4. 开发环境别让 SW 缓存挡你调试。
5. iOS 推送仅 16.4+ 加到主屏的 PWA 支持。
6. 离线页 `offline.html` 必须进预缓存，否则断网白屏。
