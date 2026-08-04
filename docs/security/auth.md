# 🪪 认证与授权

> 认证与授权是前后端边界最易扯皮处。依据 **[OWASP Top 10 A01/A07](https://owasp.org/Top10/)**、**[OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)**。

---

## 1. 基础概念

- **认证（Authentication）**：你是谁（登录）。
- **授权（Authorization）**：你能干啥（权限）。
- **Session-Cookie**：服务端存会话，浏览器带 cookie。
- **JWT**：服务端签名 token，前端携带，服务端验签不存状态。

---

## 2. 前端注意

- **别把 token 存 localStorage**（XSS 一偷就走）→ 用 **HttpOnly + Secure + SameSite Cookie**，或内存 + 短期刷新。
- 退出登录要**后端吊销** token/session，不能只前端删变量。
- 前端做的权限判断只是 UX，**真正拦截在后端**。

!!! tip "token 存储对照"
    | 方式 | 抗 XSS | 抗 CSRF | 说明 |
    |------|--------|---------|------|
    | localStorage | ❌ 易被偷 | ✅ | 不推荐放敏感凭证 |
    | HttpOnly Cookie | ✅ JS 读不到 | ❌ 需配合 CSRF | 推荐 |
    | 内存 + 刷新 | ✅ 刷新即失 | ✅ | SPA 常用，刷新需续期 |

---

## 3. 后端注意

- 密码用 **bcrypt / argon2** 加盐哈希，绝不明文/弱哈希（MD5/SHA1）。
- JWT 设短过期 + 刷新机制，密钥保管好（泄露=全员伪造）。
- 越权漏洞（IDOR）：`/api/order/123` 要校验"当前用户是否拥有 123"，别只靠前端隐藏按钮。
- **垂直越权**：普通用户调管理员接口，后端必须按角色鉴权。

!!! danger "越权（Broken Access Control）是 OWASP Top 1"
    - 水平越权：`/user/1001` 改成 `/user/1002` 能看到别人数据 → 每请求校验归属。
    - 垂直越权：普通用户改 `role=admin` 参数 → 后端不信任前端传的角色。

---

## 4. 使用场景

- **普通 Web 登录**：Session-Cookie（HttpOnly+Secure+SameSite）或 JWT（短期访问 + 刷新）。
- **多端（Web/App）：**App 用 JWT 更顺，Web 用 Cookie 更安全。
- **第三方登录**：OAuth2 + 后端换 token，前端只持短期凭证。

---

## 5. 下一步

- 带凭证跨域看 [CORS 跨域资源共享](cors.md)。
- 传输层保障看 [HTTPS 与传输安全](https.md)。
