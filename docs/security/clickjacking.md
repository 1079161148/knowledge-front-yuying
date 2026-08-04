# 🖼️ 点击劫持（Clickjacking）

> 攻击者用透明 iframe 盖在你的按钮上，骗用户点（比如"点好看视频"实际点了"转账"）。依据 **[OWASP Clickjacking](https://owasp.org/www-community/attacks/Clickjacking)**、**[MDN X-Frame-Options](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/X-Frame-Options)**。

---

## 1. 原理

攻击者页面用透明 iframe 嵌套你的页面，并把关键按钮（转账/关注）对准用户以为在点的"诱饵按钮"，借用户已登录状态发起操作。

---

## 2. 防御

- `X-Frame-Options: DENY`（或 `SAMEORIGIN`）。
- 现代推荐 CSP：`frame-ancestors 'none'`（功能覆盖 X-Frame-Options，且更灵活）。
- 前端可用 JS 的 **frame-busting** 兜底（但 CSP 才是正解）。

!!! tip "frame-ancestors vs X-Frame-Options"
    ```http
    # 老方案
    X-Frame-Options: DENY
    # 现代方案（支持白名单域名）
    Content-Security-Policy: frame-ancestors 'self' https://trusted.com
    ```

---

## 3. 进阶：SRI 防第三方资源被篡改

CDN 上的 JS（统计/SDK）如被篡改会直接 XSS。用 **SRI（Subresource Integrity）** 校验文件哈希：

```html
<script src="https://cdn.x.com/lib.js"
        integrity="sha384-xxxx"
        crossorigin="anonymous"></script>
```

浏览器下载后比对哈希，不符则拒绝执行。

---

## 4. 使用场景

- **资金/管理操作页**：`frame-ancestors 'none'` 必加。
- **引用第三方 SDK**：加 SRI + `crossorigin`，并配 CSP `script-src` 白名单。

---

## 5. 下一步

- 与 CSP 配合看 [CSP 内容安全策略](csp.md)。
- 供应链层面看 [依赖与供应链安全](supply-chain.md)。
