# 🔒 HTTPS 与传输安全

> 全站 HTTPS 是安全底座。明文 HTTP 下，token、密码、会话全在链路上裸奔。依据 **[MDN HTTPS](https://developer.mozilla.org/zh-CN/docs/Glossary/HTTPS)**、**[OWASP Transport](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)**。

---

## 1. 基础

- 全站 HTTPS，禁止明文 HTTP（HSTS 头：`Strict-Transport-Security: max-age=31536000; includeSubDomains`）。
- 敏感接口必须 HTTPS，否则 token 在链路上裸奔。
- 混合内容（HTTPS 页加载 HTTP 资源）会被浏览器拦截。

---

## 2. 高级进阶

- **证书管理**：用 Let's Encrypt / 云厂商自动化续期，避免过期宕机。
- **HSTS Preload**：提交到浏览器预加载列表，首次访问也强制 HTTPS。
- **TLS 版本**：禁用 TLS1.0/1.1，至少 TLS1.2。
- **敏感数据不进 URL**：token 别放 query（会进日志/Referer），放 Header 或 Body。

!!! danger "token 进 URL 的坑"
    把 `?token=xxx` 放在链接里，token 会出现在：服务器访问日志、浏览器历史、Referer 头、运维监控。一律放 `Authorization` 请求头。

---

## 3. 使用场景

- **对外服务**：强制 HTTPS + HSTS + 预加载。
- **内网管理后台**：同样上 TLS，内网也可能被嗅探。
- **第三方回调**：校验来源 + 签名，别只靠 HTTPS。

---

## 4. 下一步

- 凭证存储安全看 [认证与授权](auth.md)。
- 跨域配置看 [CORS 跨域资源共享](cors.md)。
