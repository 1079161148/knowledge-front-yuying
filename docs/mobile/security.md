# 🔒 移动端 H5 / WebView 安全专项

> 移动端 H5 运行在不可信的 WebView / 浏览器环境里，安全边界比纯原生更脆弱。本篇讲：通信鉴权、HTTPS/证书、XSS 防护、Bridge 安全、WebView 远程风险、敏感信息保护。所有结论基于官方安全指南与社区验证实践。
>
> 依据：**Android Developer — WebView 安全**（`@JavascriptInterface`/API 17 约束）、**Apple — WKWebView 安全**（内容安全策略）、**OWASP Mobile Top 10**、**Google Web Fundamentals — 安全**。前置：[H5 + WebView 混合开发（0-1 落地）](h5-webview.md)、[Vue3(H5)+uni-app(WebView) 混合开发](uniapp-vue3-webview.md)。

---

## 一、通信鉴权（Bridge 安全，最高频）

### 1.1 双向鉴权，别裸奔

| 风险 | 说明 | 防护 |
|------|------|------|
| 任意 H5 调原生 | 恶意页注入 WebView 调起原生能力 | 原生端**方法白名单** + **origin 校验** |
| 伪造消息 | 第三方页伪造 `postMessage` 骗原生 | H5→原生消息带**临时签名/会话 token** |
| 原生下发被截 | 中间人篡改原生回传 | 走 HTTPS + 校验数据完整性 |

```js
// H5 调原生前，带签名（约定密钥在服务端下发，不在前端硬编码）
function callNativeSigned(method, params, sessionToken) {
  const nonce = Date.now() + '-' + Math.random().toString(36).slice(2)
  const sign = hmacSha256(method + JSON.stringify(params) + nonce, sessionToken)
  bridge.call(method, { ...params, nonce, sign })
}
```

!!! danger "铁律（官方 WebView 指南）"
    - Android：`addJavascriptInterface` 注入对象的方法**必须加 `@JavascriptInterface` 注解**，且 **minSdk ≥ API 17**（4.2 以下有反射任意执行漏洞）。
    - 原生收到调用时**校验 `window.location.origin`** 是否在白名单域名，非白名单域名直接拒绝。

### 1.2 会话安全

- token 存 `HttpOnly + Secure + SameSite` Cookie，或 WebView 注入内存（别存 `localStorage` 长期明文）。
- 原生注入的 token 用完后，H5 侧用完即清，避免持久化泄露。
- 退出登录/登录失效 → 同步清原生与 H5 两侧 token（见 h5-webview §五）。

---

## 二、HTTPS 与证书校验

### 2.1 全链路 HTTPS

- H5 资源、接口、Bridge 信令**全部 HTTPS**，禁止降级到 HTTP。
- 设置 `Content-Security-Policy: upgrade-insecure-requests` 兜底。

### 2.2 证书校验（原生侧）

| 平台 | 正确做法 | 禁忌 |
|------|----------|------|
| iOS | `WKWebView` 走系统校验；需自定义校验时实现 `didReceiveChallenge`，**严格比对** | 不要无脑 `NSURLAuthenticationChallenge` 返回 `NSURLSessionAuthChallengeUseCredential` 忽略错误 |
| Android | `WebViewClient.onReceivedSslError` **不要直接 `proceed()`** | ❌ 严禁 `handler.proceed()` 忽略证书错误（中间人攻击入口） |

!!! danger "Android 致命错误"
    ```java
    // 错误示范（绝对禁止）
    @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        handler.proceed();   // 忽略证书错误 → 中间人可窃听/篡改
    }
    ```
    正确处理：证书错误**阻断加载**，或仅在受控自签名场景下比对证书指纹（证书钉扎 pinning）。

### 2.3 证书钉扎（高安全场景）

对关键接口做证书/公钥钉扎（Certificate/Public Key Pinning），即使 CA 被攻破也无法中间人。注意保留**备用钉**（防证书轮换失败）。

---

## 三、XSS 与注入防护（H5 侧）

### 3.1 框架层天然防护

- Vue/React 默认 **文本插值自动转义**（`{{ }}` / JSX 文本节点），不把用户数据当 HTML 渲染。
- **禁止**：`v-html="userInput"`、`dangerouslySetInnerHTML`。必须渲染富文本时，用 **DOMPurify** 清洗（白名单过滤）。

```js
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userHtml, { USE_PROFILES: { html: true } })
```

### 3.2 URL / 路由注入

- `web-view` 的 `src` 来自参数时，**校验域名白名单**，禁止 `javascript:` / `file:` 等非预期协议。
- 微信小程序侧：`web-view` src 必须在**微信后台配业务域名**，否则打不开（平台级防护）。

### 3.3 CSP 内容安全策略

```http
Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://trusted.cdn.com; connect-src 'self' https://api.example.com
```

- 用 nonce/hash 替代 `unsafe-inline`（生产应去掉 `unsafe-inline`）。
- 禁止 `eval`（拦 `Function()` / `setTimeout('string')`）。

---

## 四、WebView 专属风险

### 4.1 文件访问越权

```java
// Android：默认允许 file 域访问，跨域漏洞
webView.getSettings().setAllowFileAccess(false);          // 不需要时关
webView.getSettings().setAllowFileAccessFromFileURLs(false); // 禁止 file 跨域
webView.getSettings().setAllowUniversalAccessFromFileURLs(false);
```

### 4.2 密码/表单保存

```java
webView.getSettings().setSavePassword(false);   // 别让 WebView 存密码
webView.getSettings().setSaveFormData(false);
```

### 4.3 调试与日志泄漏

- 生产移除 `WebContentsDebuggingEnabled`（Android）/ 关闭 Safari 远程调试。
- 生产移除 vConsole/Eruda（见 [调试章节](debug-hybrid.md)）。
- 禁止把 token/密钥打印到 console。

### 4.4 第三方 SDK / 离线包完整性

- 离线包/远程 H5 资源加**签名校验**，防止 CDN 被篡改注入恶意脚本。
- 第三方 JS SDK 锁定版本 + SRI（Subresource Integrity）。

```html
<script src="https://cdn.com/sdk.js"
        integrity="sha384-xxxx" crossorigin="anonymous"></script>
```

---

## 五、敏感信息保护清单

| 项 | 做法 |
|----|------|
| token | HttpOnly+Secure Cookie / 内存，勿明文 localStorage 长期存 |
| 密钥 | 不在前端硬编码；签名密钥走服务端下发 |
| 日志 | 生产不打印敏感字段；脱敏后上报 |
| 剪切板 | 读取剪切板需用户授权，勿静默读取 |
| 定位/相册/相机 | 按需申请，Bridge 调用前 UI 明示用途 |

---

## 六、速查：安全 Checklist

| 风险面 | 必做 |
|--------|------|
| Bridge | 方法白名单 + origin 校验 + 消息签名 + API≥17 + @JavascriptInterface |
| 传输 | 全 HTTPS + upgrade-insecure-requests + 证书严格校验（禁 proceed） |
| XSS | 禁 v-html/危险 API + DOMPurify + CSP(nonce) + src 域名白名单 |
| WebView | 关 file 访问/跨域、禁存密码、禁调试、SRI 校验第三方 |
| 敏感 | token 安全存储、日志脱敏、权限按需申请 |

---

## 七、章节关联

- Bridge 协议设计 → [H5 + WebView 混合开发](h5-webview.md) §四
- uni-app 通信鉴权细节 → [Vue3(H5)+uni-app(WebView) 混合开发](uniapp-vue3-webview.md)
- 调试与日志清理 → [真机调试与 Hybrid 桥协议实战](debug-hybrid.md)
