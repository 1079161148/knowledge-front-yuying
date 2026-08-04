# 🔒 前端安全全集（前后端通识）

> 安全不是前端一个人的事，而是**前后端协作的边界**。本合集从**术语 → 原理 → 基础防御 → 高级进阶 → 真实使用场景 → 易踩的坑**，逐篇讲清 XSS / CSRF / CORS / CSP / HTTPS / 点击劫持 / 认证授权 / 依赖安全。
>
> 适用：**所有层次开发者**——零基础能看懂攻击长啥样，资深能照着搭纵深防御。依据 **OWASP Top 10 (2021)**、**[MDN Web Security](https://developer.mozilla.org/zh-CN/docs/Web/Security)**、**[W3C CSP Level 3](https://www.w3.org/TR/CSP3/)**、**[OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)**。

---

## 本合集导航

- **[概述与术语](overview.md)**：安全全景图 + 必懂术语，先看这。
- **[XSS 跨站脚本](xss.md)**：三种类型、DOM 型代码模板、富文本消毒、mXSS 等高级坑。
- **[CSRF 跨站请求伪造](csrf.md)**：SameSite / Token / Double Submit 与跨站带凭证场景。
- **[CORS 跨域资源共享](cors.md)**：预检、动态回显白名单、`Vary: Origin` 等。
- **[CSP 内容安全策略](csp.md)**：nonce / hash / Report-Only / strict-dynamic。
- **[HTTPS 与传输安全](https.md)**：HSTS 预加载、TLS 版本、敏感数据不进 URL。
- **[认证与授权](auth.md)**：JWT 存哪、越权（IDOR）即 OWASP Top 1。
- **[点击劫持](clickjacking.md)**：frame-ancestors / X-Frame-Options / SRI。
- **[依赖与供应链安全](supply-chain.md)**：投毒 / SBOM / SRI 校验。
- **[纵深防御与自检清单](defense.md)**：体系图 + 前后端自检清单。

---

## 1. 术语表（先看这，后面才不懵）

- **同源策略（SOP）**：协议 + 域名 + 端口三者相同才允许互相读资源，浏览器的安全基石。
- **XSS（跨站脚本）**：把恶意脚本塞进页面，在受害者浏览器里执行。
- **CSRF（跨站请求伪造）**：借受害者已登录的身份，偷偷发请求。
- **CORS（跨域资源共享）**：后端用响应头"授权"浏览器放行某个跨域请求。
- **CSP（内容安全策略）**：后端用响应头声明"哪些来源的资源能加载"，从源头挡脚本。
- **CSP Nonce**：每次响应随机生成的令牌，内联脚本带上它才被信任（避免 `unsafe-inline`）。
- **SameSite Cookie**：控制 cookie 在跨站请求时是否携带（`Strict` / `Lax` / `None`）。
- **HttpOnly Cookie**：JS 读不到的 cookie，防止 XSS 偷 token。
- **HSTS**：强制浏览器只用 HTTPS 访问本站。
- **SSRF（服务端请求伪造）**：攻击者让服务器替他访问内网/云元数据（后端重点）。
- **零信任 / 纵深防御**：不依赖单一措施，层层设防。

---

## 2. 安全自检清单（前后端）

- [ ] 前端不用 `innerHTML` / `v-html` / `dangerouslySetInnerHTML` 渲染用户输入
- [ ] 富文本走 DOMPurify + CSP 双保险
- [ ] 后端设 CSP（优先 nonce）+ 输出编码
- [ ] 接口有 CSRF Token 或 SameSite Cookie（带凭证场景）
- [ ] CORS 不用 `*` + 凭证；动态回显 Origin 走白名单
- [ ] 全站 HTTPS + HSTS + 不把 token 放 URL
- [ ] 防 iframe 嵌套（frame-ancestors / X-Frame-Options）
- [ ] token 用 HttpOnly + Secure + SameSite，不存 localStorage
- [ ] 后端密码 bcrypt/argon2，JWT 短过期 + 密钥严管
- [ ] 每个涉及用户数据的接口校验归属（防越权）
- [ ] 跑过 `npm audit` / SCA，关键第三方资源加 SRI

---

## 3. 下一步

- 想看前端怎么和后端联调鉴权/跨域 → [给后端的前端速通](../basics/backend-to-frontend.md)
- 想学 Web API 里 cookie/localStorage 的正确用法 → [DOM/BOM 与 Web API 实战](../js/web-api.md)
- 想了解 JS 高级里的安全死角 → [JS 高级进阶](../js/advanced-topics.md)
- 想看 HTTP/网络层通识 → [浏览器原理深化：网络通识](../advanced/browser-network.md)
