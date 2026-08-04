# 🧱 纵深防御与自检清单

> 单一措施都会破，正确做法是**层层设防**。本文给出体系图和前后端自检清单。

---

## 1. 纵深防御体系

```
用户输入 → 前端校验/转义 ─┐
                          ├─→ 后端校验/编码/参数化 ─→ 存储
前端渲染 ←── textContent/框架转义 ─┘
全局护城河：CSP + HTTPS/HSTS + HttpOnly Cookie + SameSite + CSRF Token + 鉴权 + 依赖审计
```

- **前端**：输入校验（UX）+ 输出转义 + 不用危险 API。
- **后端**：参数化查询（防 SQL 注入）+ 输出编码 + 鉴权 + CORS 白名单 + CSP。
- **运维**：HTTPS、WAF、依赖扫描、日志脱敏。

---

## 2. 其他高频风险速查

| 风险 | 说明 | 防御 |
|------|------|------|
| 敏感信息泄露 | token 存 localStorage 被 XSS 偷 | HttpOnly + Secure cookie |
| 开放重定向 | `?redirect=evil.com` | 白名单校验跳转地址 |
| SSRF | 服务端代发请求访问内网/云元数据 | 禁访问内网段、校验 URL 协议与域名 |
| 控制台注入 | 生产暴露敏感日志 | 生产关 `console.log`、脱敏 |
| 不安全的反序列化 | 后端反序列化不可信数据 | 用安全格式（JSON）、签名校验 |
| 限流缺失 | 短信轰炸/爆破 | 接口加 rate limit + 验证码 |

---

## 3. 安全自检清单（前后端）

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

## 4. 下一步

- 回到合集首页 → [前端安全全集](../security/index.md)
- 想看 HTTP/网络层通识 → [浏览器原理深化：网络通识](../advanced/browser-network.md)
