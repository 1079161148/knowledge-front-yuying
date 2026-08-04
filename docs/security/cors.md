# 🌐 CORS 跨域资源共享

> 浏览器同源策略默认阻止跨域**读响应**。CORS 是后端用响应头"授权"某个跨域来源，浏览器才放行。注意：**CORS 是浏览器机制，不保护后端**——后端自己也要鉴权。依据 **[MDN CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)**。

---

## 1. 原理

同源策略阻止跨域读响应；CORS 用响应头声明"谁可以读"。CORS **只管浏览器**，Postman / 原生 App 不受限——所以后端鉴权不能省。

---

## 2. 基础配置（后端）

```
Access-Control-Allow-Origin: https://a.com   # 指定来源，别用 *
Access-Control-Allow-Credentials: true        # 允许带 cookie（此时 Origin 不能 *）
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization
```

---

## 3. 高级进阶

!!! danger "致命死角：带凭证时 Allow-Origin 不能为 *"
    前端 `fetch(url, { credentials: 'include' })` 时，后端 `Allow-Origin: *` 会被浏览器拒绝。必须写明具体域名，或按请求 `Origin` 动态回显（且校验白名单）。

- **预检 Preflight**：非简单请求（自定义头 / PUT / 带凭证）浏览器先发 `OPTIONS`，后端必须正确响应 `204`，否则真实请求不发。
- **动态回显 Origin 的风险**：直接 `Access-Control-Allow-Origin: <请求里的Origin>` 等于任意网站可跨域——必须**白名单校验**后再回显。
- **暴露响应头**：想让前端读 `X-Total-Count` 等，需 `Access-Control-Expose-Headers`。
- **带凭证的缓存投毒**：`Vary: Origin` 必须带上，避免 CDN 把带凭证响应错误缓存给别家。

!!! info "预检联调"
    非简单请求浏览器先发 `OPTIONS` 预检，后端必须正确响应，否则真实请求不发。后端联调看 [给后端的前端速通](../basics/backend-to-frontend.md)。

---

## 4. 使用场景

- **前端 dev 本地联调**：配 `Allow-Origin: http://localhost:5173`。
- **多端共用 API（web + 小程序 + App）**：按来源白名单分别授权，App 端其实不受 CORS 限制（CORS 只管浏览器）。
- **第三方开放平台**：用 OAuth + 具体 Origin 白名单，而非 `*`。

---

## 5. 下一步

- 配套防护看 [CSRF 跨站请求伪造](csrf.md)（带凭证场景）。
- 想看 HTTP/网络层通识 → [浏览器原理深化：网络通识](../advanced/browser-network.md)。
