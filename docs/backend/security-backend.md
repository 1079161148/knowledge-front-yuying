# 🛡️ 后端安全专项深化（OWASP 视角 + 密钥/审计）

> 前端的 [安全全集](../security/index.md) 讲通识，本篇从**后端责任主体**角度深化：OWASP Top 10 与后端的具体落地、密钥管理、审计日志、渗透防护清单。资深后端必须把安全当需求而不是事后补丁。
>
> 依据 **[OWASP Top 10 (2021)](https://owasp.org/Top10/)**、**[OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)**、**[12-Factor·配置](https://12factor.net/config)**。

---

## 一、OWASP Top 10 与后端落地映射

| 风险 | 后端责任 | 落地动作 |
|------|----------|----------|
| **A01 失效的访问控制（越权）** | 极高 | 每个资源校验归属（`/api/order/:id` 查 owner）；RBAC 角色校验；防 IDOR |
| **A02 加密失败** | 高 | 传输 HTTPS；静态敏感数据加密；密码慢哈希 |
| **A03 注入** | 极高 | 参数化查询/ORM；命令不用拼接；输入白名单 |
| **A04 不安全设计** | 中 | 威胁建模；默认拒绝；关键操作二次确认 |
| **A05 安全配置错误** | 高 | 关调试模式；删默认账号；安全头（helmet）；最小化暴露 |
| **A06 脆弱过时组件** | 中 | `npm audit`；依赖锁定；及时升级 |
| **A07 身份鉴别失效** | 高 | 强密码策略；JWT 短过期+吊销；防爆破限流；防会话固定 |
| **A08 软件数据完整性失败** | 中 | CI 签名；依赖来源校验；防供应链投毒 |
| **A09 日志监控不足** | 中 | 安全事件记日志；告警；防日志注入 |
| **A10 服务端请求伪造（SSRF）** | 中 | 限制出网目标；白名单域名；禁止内网地址 |

!!! danger "A01 越权（后端最致命）"
    - 只看"是否登录"不看"是否有权访问这条数据"= 越权（IDOR）。`/api/user/123/profile` 必须校验 `currentUser.id === 123`。
    - 改密码/提权接口必须二次校验（旧密码/验证码）。
    - 前端隐藏按钮 ≠ 后端防护，攻击者直接 curl。

---

## 二、注入防护（代码级）

```ts
// ✅ 参数化（ORM）
await repo.createQueryBuilder('u').where('u.email = :e', { e: email }).getOne()
// ❌ 拼接（灾难）
await query(`SELECT * FROM users WHERE email = '${email}'`) // SQL 注入
```

!!! warning "注入不止 SQL"
    - **命令注入**：`exec('convert ' + userInput)` 危险，用 `execFile` + 数组参数。
    - **NoSQL 注入**：MongoDB 里 `{ $gt: '' }` 绕过，校验类型 + 白名单。
    - **模板注入**：用户可控模板字符串 `eval`/`new Function` 绝对禁止。
    - **日志注入**：用户输入写日志要转义换行，防伪造日志条目。

---

## 三、密钥管理与配置安全

- 绝不硬编码：密钥/密码走环境变量或密钥管理（Vault / KMS / 云 Secret）。
- `.env` 必须 `.gitignore`，泄露立即轮换。
- 不同环境不同密钥，生产密钥不进仓库、不在前端可见。

!!! danger "密钥泄露后果"
    - DB 密码泄露 = 数据裸奔；JWT 密钥泄露 = 任何人可伪造 token 冒充任意用户（包括 admin）。
    - CI 日志里别 `console.log(process.env)`——密钥会进构建日志。
    - 用 `dontenv` 加载 `.env`，生产用平台 Secret 注入，**不要**把 `.env` 打进 Docker 镜像。

---

## 四、审计日志（Audit Log）

安全事件必须留痕：登录成功/失败、改密码、改权限、删数据、导出。

```ts
logger.info({ type: 'AUDIT', actor: userId, action: 'delete_user', target: targetId, ip })
// 审计日志：不可篡改、保留期长、含 who/what/when/where
```

!!! tip "审计日志要求"
    - 含 **who（谁）+ what（做了啥）+ when（时间）+ source IP**。
    - 写**只追加（append-only）**存储，防篡改（攻击者清日志掩盖痕迹）。
    - 敏感操作（删库、提权）必须审计，且异常操作触发告警。

---

## 五、渗透防护自查清单

- [ ] 所有资源校验归属，防越权（IDOR）
- [ ] 参数化查询，无拼接；命令/NoSQL/模板注入已防
- [ ] 密码慢哈希，登录限流防爆破
- [ ] JWT 短过期 + 可吊销；HTTPS 全程
- [ ] 安全头已上（helmet：CSP/X-Frame-Options 等）
- [ ] 密钥不硬编码、不入库、不进日志
- [ ] 依赖 `npm audit` 无高危
- [ ] 审计日志记录关键操作
- [ ] SSRF：出网请求白名单，禁内网地址
- [ ] 生产关调试模式、删默认账号

配合：[前端安全全集](../security/index.md)、[Node 最佳实践·安全](best-practices.md)、[部署与运维](deploy-ops.md)。
