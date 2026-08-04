# 📦 依赖与供应链安全

> 现代前端 90%+ 代码来自依赖，供应链攻击（投毒/篡改）影响面极大。依据 **[OWASP A06/A08](https://owasp.org/Top10/)**、**[Snyk 供应链安全](https://snyk.io/)**。

---

## 1. 基础

- `npm audit` 定期扫漏洞，升级有 CVE 的依赖。
- 锁定版本（`package-lock.json` / `pnpm-lock.yaml`），避免意外升级引入问题。
- 审查 `postinstall` 脚本——恶意包常在安装时执行代码。

---

## 2. 高级进阶

- **依赖投毒**：攻击者劫持维护者账号或发 typosquat（如 `lodash-util` 仿 `lodash`）。用私有源 + 锁版本 + SCA 工具（Snyk/Dependabot）。
- **供应链 SBOM**：生成软件物料清单，出事能快速定位受影响版本。
- **CDN 投毒**：引用的第三方 JS（如统计/SDK）如被篡改会直接 XSS → 用 SRI（见 [点击劫持](clickjacking.md)）。

!!! danger "postinstall 脚本风险"
    ```json
    // ❌ 陌生包的安装脚本可能在你机器上执行任意命令
    "scripts": { "postinstall": "node malicious.js" }
    ```
    装包前看依赖的 `package.json`，对 `preinstall`/`postinstall` 保持警惕，优先用 lock 文件 + 私有镜像。

---

## 3. 使用场景

- **CI 流水线**：集成 `npm audit` / Snyk，失败则阻断发布。
- **私有 npm 源**：企业内网镜像，避免直连公网被投毒。
- **第三方 SDK**：加 SRI 校验 + CSP 白名单。

---

## 4. 下一步

- 资源校验细节看 [点击劫持](clickjacking.md)。
- 全局防护体系看 [纵深防御与自检清单](defense.md)。
