# 🔐 CSP 内容安全策略

> 后端返回响应头，声明**哪些来源的资源可以加载**，从"源头"掐断 XSS 执行（就算有注入，脚本因不在白名单而无法运行）。依据 **[W3C CSP Level 3](https://www.w3.org/TR/CSP3/)**、**[MDN CSP](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP)**。

---

## 1. 原理

后端用响应头声明资源白名单，浏览器只加载名单内的脚本/样式/图片等，未授权的内联脚本被拒绝执行。

---

## 2. 基础配置

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com; img-src 'self' data:;
```

| 指令 | 作用 |
|------|------|
| `default-src 'self'` | 默认只允许同源 |
| `script-src` | 限制 JS 来源（防内联脚本 → 也防 XSS） |
| `style-src` | 限制样式来源 |
| `img-src` | 限制图片来源（防追踪像素） |
| `frame-ancestors` | 限制谁能 iframe 嵌套本页（替代 X-Frame-Options） |
| `'unsafe-inline'` | 允许内联（**削弱安全，尽量避免**） |

---

## 3. 高级进阶（生产级）

- **Nonce 模式**（推荐）：`script-src 'self' 'nonce-随机值'`，每个 `<script>` 标签带 `nonce`，后端每次响应换新值。这样内联脚本也能用，又不被注入脚本利用。
- **Hash 模式**：`script-src 'sha256-xxx'`，适合固定不变的内联脚本。
- **Report-Only 灰度**：`Content-Security-Policy-Report-Only` 先只上报不拦截，收集违规后再强制，避免一刀切误伤业务。
- **`strict-dynamic`**：信任被 nonce 脚本加载的脚本，简化复杂应用。

!!! tip "前端配合"
    CSP 禁止内联 `onclick=` 和 `<style>`，所以项目里点击事件要写 `addEventListener`，别用内联属性；样式放外部文件或走 CSS-in-JS（需配合 nonce）。

---

## 4. 使用场景

- **高安全要求后台（金融/管理）**：`default-src 'self'` + nonce + `frame-ancestors 'none'`。
- **内容站 / 博客**：允许 `img-src * data:` 但锁死 `script-src 'self'`。
- **迁移期**：先用 `Report-Only` 观察，再切强制。

---

## 5. 下一步

- 与 XSS 配合看 [XSS 跨站脚本](xss.md)。
- 与点击劫持配合看 [点击劫持](clickjacking.md)。
