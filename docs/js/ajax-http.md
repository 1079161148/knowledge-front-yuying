# 🔗 前后端交互：Ajax / Fetch / 跨域（市场必会）

> 接续 [JS 基础](foundation.md) 与 [DOM/BOM 与 Web API 实战](web-api.md)。本篇系统讲"前端怎么和后端的接口对话"：从 `XMLHttpRequest` 到 `Fetch`、再到跨域（CORS / 代理 / JSONP）与鉴权。依据 **WHATWG Fetch 标准**、**W3C XMLHttpRequest 规范**、**MDN**、**web.dev**。
>
> 适用：**所有开发者**——前端写调用、后端懂"前端为什么跨域报错"、测试懂接口联调。

---

## 一、演进：从 Ajax 到 Fetch

| 方案 | 年代 | 特点 | 现状 |
|------|------|------|------|
| `XMLHttpRequest`（XHR） | 2000s | 回调式、API 繁琐、`onreadystatechange` | 老项目/上传进度仍用 |
| `Fetch` | 2015+ | Promise 式、更简洁、流式 body | **现代标配** |
| 请求库（axios） | — | 拦截器、超时、自动 JSON、取消 | 工程化首选封装层 |

!!! info "Ajax 是什么"
    Ajax = Asynchronous JavaScript And XML，本质是"不刷新页面也能发请求、局部更新 DOM"。现在数据多用 JSON，但名字沿用。

---

## 二、Fetch 完整实战 + 注意事项

```js
// 标准 POST（带错误处理）
async function createUser(payload) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',        // 跨域带 cookie
  });
  if (!res.ok) {                   // ⚠️ 404/500 不会 reject！
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.json();               // 再次 await
}
```

!!! danger "死角 1：fetch 只在断网/跨域拦截时 reject"
    HTTP 404 / 500 **不会**进入 `catch`，只有网络层失败才 reject。必须 `if (!res.ok)` 手动判错（见 [JS 高级进阶](advanced-topics.md) 错误处理章节）。

!!! danger "死角 2：Fetch 默认不带 cookie"
    跨域请求默认 `credentials: 'same-origin'`，不带 cookie。需要登录态要设 `credentials: 'include'`，且后端 CORS 不能写 `Access-Control-Allow-Credentials: true` + `Allow-Origin: *`（必须指定具体源）。

!!! tip "工程化建议"
    别在业务里裸写 fetch。封装一层：`baseURL` + 统一 token 注入 + 错误上报 + 重试，放在 `src/api/`。后端联调视角见 [给后端的前端速通](../basics/backend-to-frontend.md)。

---

## 三、跨域：为什么浏览器拦我？

浏览器**同源策略**：协议 + 域名 + 端口三者相同才同源。不同源请求会被 CORS 机制拦截（保护用户，不是拦开发者）。

### 1. CORS（主流方案，后端配合）

```
前端 http://a.com  →  请求 http://api.b.com
后端响应头需包含：
  Access-Control-Allow-Origin: http://a.com      // 或 *（但不能与 credentials 同用）
  Access-Control-Allow-Credentials: true         // 需要 cookie 时
  Access-Control-Allow-Methods: GET,POST,OPTIONS
  Access-Control-Allow-Headers: Content-Type,Authorization
```

!!! danger "死角 3：预检请求（preflight）"
    非简单请求（如带 `Authorization`、非 GET/POST、自定义头）浏览器先发 **OPTIONS 预检**。后端必须正确响应 OPTIONS，否则正式请求不发。这是联调最常见的 404/跨域报错根源。

### 2. 开发代理（devServer proxy，最常用）

```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
};
```
前端请求 `/api/users` → 开发服务器转发到后端 → **浏览器只看到同源**，无跨域。生产环境用 Nginx 反向代理同理。

### 3. JSONP（仅 GET，历史方案）

利用 `<script>` 不受同源限制，后端返回 `callback({"data":1})`。**只支持 GET、有 XSS 风险**，现代项目已被 CORS 取代，面试了解即可。

!!! warning "安全关联"
    跨域配置错误可能放大攻击面。CORS 与 CSRF/XGPO 的关系见 [前端安全全集](../security/index.md)（依据 OWASP Top 10）。

---

## 四、鉴权：前端怎么带 Token

| 方式 | 存储 | 特点 |
|------|------|------|
| Session + Cookie | `HttpOnly` Cookie | 后端管会话；前端无感；需防 CSRF |
| JWT | `localStorage` / 内存 | 无状态；前端每次塞 `Authorization` 头；**XSS 可偷** |
| OAuth2 / OIDC | 重定向 + 后端换 token | 第三方登录标准 |

!!! danger "死角 4：JWT 别存 localStorage 防 XSS"
    见 [前端安全全集](../security/index.md)：敏感 token 优先 `HttpOnly` + `Secure` Cookie，避免 JS 可读被 XSS 窃取。

---

## 五、前后端交互自检清单

- [ ] 会用 `fetch` 写带错误判断的 GET/POST
- [ ] 理解 `fetch` 不抛 HTTP 错误、默认不带 cookie
- [ ] 说清同源策略与 CORS 响应头
- [ ] 知道预检请求（OPTIONS）何时触发
- [ ] 会用 devServer proxy / Nginx 解决开发跨域
- [ ] 区分 Session-Cookie 与 JWT 的存储风险

> 衔接：接口联调站在后端视角看 [给后端的前端速通](../basics/backend-to-frontend.md)；请求性能与缓存见 [浏览器渲染与性能总纲](../performance.md)（web.dev）。
