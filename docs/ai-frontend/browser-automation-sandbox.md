# 🌐 浏览器自动化与沙箱

> 让 Agent "操作网页"是 2026 高频场景（自动填表、爬数据、E2E 测试、Web Agent）。但浏览器有**巨大安全风险**：模型操控的浏览器能访问你的登录态、能执行任意 JS。本页讲清 Playwright/Puppeteer 自动化 + 沙箱隔离，以官方能力为准。

依据：[Playwright 官方](https://playwright.dev/)（"for testing, scripting, and AI agents"）· 浏览器自动化安全实践。

> 📌 **适用版本 / 更新日期**：Playwright `1.4x`；沙箱方案 E2B / Pyodide（均以官方为准）；最后更新 **2026-08**。

---

## 1. 浏览器自动化能做什么

| 能力 | 工具 | 说明 |
|------|------|------|
| 驱动真实浏览器 | **Playwright** | 官方支持 Chromium/Firefox/WebKit，AI agents 场景一等公民 |
| 轻量 Chrome 驱动 | **Puppeteer** | 对 Chrome 优化，更轻 |
| 读取页面结构 | DOM 快照 / a11y tree | 给模型"看懂"页面，不传整页 HTML |
| 执行动作 | click / type / navigate | 模型决定下一步操作 |

!!! tip "给模型的是"视图"不是 HTML"
    把页面转成 **accessibility tree / 精简 DOM 快照**喂给模型，比塞整页 HTML 省 token 且更准。这是 Web Agent 的关键工程细节。

---

## 2. 最小 Playwright Agent 思路

```ts
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('https://example.com')
// 取可访问性快照给模型决策
const snapshot = await page.accessibility.snapshot()
// 模型返回动作 {action:'click', selector:'#login'}
await page.click('#login')
```

---

## 3. 沙箱：为什么必须隔离

!!! danger "不隔离 = 灾难"
    Agent 操控的浏览器若在同一台机器、用你的登录态：
    - 模型被注入指令 → 删库 / 转钱 / 发敏感邮件。
    - 页面里的恶意 JS 借 Agent 权限执行。
    - 占用本机资源、污染环境。

**原则：浏览器自动化必须跑在隔离沙箱里。**

| 方案 | 说明 |
|------|------|
| **容器 / 函数计算沙箱** | 阿里云 FC 等一键部署隔离 Playwright 环境（社区实践） |
| **E2B / 安全代码沙箱** | 专为 AI Agent 的代码/浏览器执行提供隔离运行时 |
| **Pyodide / 浏览器内 WASM** | 在浏览器内跑受限 Python/JS，不触本机 |
| **无头 + 网络隔离** | 禁公网 / 仅白名单域名，限制文件访问 |

!!! warning "沙箱选型要点"
    - 危险动作（写、删、发）走**人工确认 + 白名单**。
    - 沙箱要**无持久凭证**：别把真实账号 token 注入沙箱浏览器。
    - 网络出口白名单，防数据外泄。

---

## 4. 代码执行沙箱（让 Agent 跑代码）

除了浏览器，有时要 Agent 执行生成的代码（数据分析/计算）。同样要沙箱：

- **不可信代码绝不 `eval` / `new Function` 在本进程**。
- 用隔离运行时（容器 / WASM / 专用沙箱服务）执行，限资源、限系统调用、限网络。
- 超时强杀，防死循环。

!!! danger "代码执行铁律"
    模型生成的代码 = 不可信输入。直接 `eval` 执行 = 把服务器交给模型。必须沙箱 + 最小权限 + 资源限制。

---

## 5. 踩坑汇总

!!! danger "浏览器自动化高频坑"
    1. 不隔离沙箱，用本机登录态跑 Agent（越权风险）。
    2. 把整页 HTML 喂模型，token 爆炸 + 噪音多。
    3. 动作后不等待加载完成就下一步 → 选择器失效（用 Playwright 自动等待）。
    4. 沙箱无网络白名单 → 数据泄露。
    5. 代码执行不沙箱 → 服务器被控。

> 衔接安全：[AI 最佳实践-安全](best-practices.md) · 工具执行：[Function Calling](function-calling.md)
