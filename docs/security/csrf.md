# 🛡️ CSRF 跨站请求伪造

> 受害者已登录 A 站，攻击者诱导其访问 B 站，B 站偷偷发请求到 A 站（携带着 A 站的 cookie），以受害者身份操作。关键在于：浏览器**自动带 cookie**，用户无感知。依据 **[OWASP CSRF](https://owasp.org/www-community/attacks/csrf)**。

---

## 1. 原理

借受害者已登录身份，在受害者无感知下发起"状态变更"请求（转账/改密码/改邮箱）。

---

## 2. 基础防御（后端为主）

- **SameSite Cookie**：`Set-Cookie: sid=xxx; SameSite=Lax`。Lax 下跨站 GET 仍可，但 POST 等不安全方法被拦；`Strict` 更严但影响体验。
- **CSRF Token**：表单/接口带服务端下发的随机 token，校验通过才处理（token 不在 cookie 里，B 站拿不到）。
- **校验 Origin / Referer**：非同源请求直接拒绝。

---

## 3. 高级进阶

- **Double Submit Cookie**：把 token 同时放 cookie 和请求头，后端比对——适合无状态服务，但需防 cookie 注入。
- **SameSite=None; Secure** 场景（需要跨站带凭证，如第三方登录）：必须配合 CSRF Token，因为 SameSite 已不防护。
- **登录态接口也要防**：改密码/换绑手机等"高价值"接口最该加 Token。

!!! tip "前端配合"
    - `fetch` 默认 `credentials: 'same-origin'`，跨域不带 cookie，需显式 `credentials: 'include'`——这也意味着后端要允许。别随意全局 `include`。
    - 表单里把 CSRF Token 放在隐藏域，AJAX 放在请求头（如 `X-CSRF-Token`）。

---

## 4. 使用场景

| 场景 | 推荐方案 |
|------|----------|
| 传统多页表单（登录/下单） | SameSite=Lax + CSRF Token |
| 前后端分离（JWT 在请求头） | 无 cookie 则 CSRF 天然弱，但仍防 Token 泄露 |
| 第三方嵌入/跨站带凭证 | SameSite=None;Secure + 强 Token |

---

## 5. 下一步

- 跨域配置细节看 [CORS 跨域资源共享](cors.md)。
- 凭证存储安全看 [认证与授权](auth.md)。
