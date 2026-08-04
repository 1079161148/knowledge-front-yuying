# 📊 移动端监控与上线：从 0-1 工程闭环

> 一个移动端应用"做出来"只是第一步，**"能上线、能兜住故障、能持续优化"**才是工程闭环。本篇讲：前端监控（错误/性能/行为）、错误上报、性能埋点（Web Vitals）、灰度发布、CI 卡质量门禁。
>
> 依据：**W3C Web Vitals / Google Web Fundamentals**（LCP/INP/CLS 官方定义）、**Sentry 官方文档**（前端 SDK）、**Google Lighthouse CI** 官方实践。方案均为官方/社区主流最佳实践。
>
> 前置：[移动端性能专项](performance.md)、[H5 + WebView 混合开发（0-1 落地）](h5-webview.md)。

---

## 一、监控体系全景（要监控什么）

| 维度 | 指标/事件 | 工具 |
|------|-----------|------|
| **错误** | JS 异常、Promise reject、资源加载失败、接口错误 | Sentry / 自研 |
| **性能** | LCP / INP / CLS、FCP、TTFB、首屏接口耗时 | Web Vitals + RUM |
| **行为** | PV/UV、路由停留、点击漏斗、白屏 | 自研埋点 / 神策/GA |
| **稳定性** | 崩溃率、ANR（原生）、WebView 白屏率 | 原生 + H5 探针 |
| **业务** | 转化率、关键路径耗时 | 业务埋点 |

!!! tip "核心原则：先有 RUM（真实用户监控），再做优化"
    本地 Lighthouse 只能测实验室值；**线上真实数据（RUM）才能反映用户实际体验**，优化决策以 RUM 为准。

---

## 二、错误监控（Sentry 官方方案）

### 2.1 接入（Vue3 / React 通用）

```bash
pnpm add @sentry/vue @sentry/browser   # 或 @sentry/react
```

```ts
// main.ts（Vue3 示例，React 用 @sentry/react 的 init）
import * as Sentry from '@sentry/vue'
import { createApp } from 'vue'

Sentry.init({
  app,                       // Vue3 需传 app 实例以捕获组件级错误
  dsn: 'https://xxx@sentry.io/123',
  environment: import.meta.env.MODE,   // development / production
  release: __APP_VERSION__,            // 关联源码版本，定位问题必须
  tracesSampleRate: 0.2,               // 性能采样，控制成本
  beforeSend(event) {
    // 生产才上报；过滤噪音（如取消的请求）
    if (import.meta.env.DEV) return null
    return event
  }
})
```

### 2.2 必须额外捕获的三类

```js
// 1) 资源加载失败（Sentry 默认不捕获 <img>/<script> 加载错）
window.addEventListener('error', (e) => {
  if (e.target && (e.target.src || e.target.href)) {
    Sentry.captureMessage(`资源加载失败: ${e.target.src || e.target.href}`, 'warning')
  }
}, true)

// 2) 未处理的 Promise reject
window.addEventListener('unhandledrejection', (e) => {
  Sentry.captureException(e.reason)
})

// 3) 接口错误（axios 拦截器统一上报）
axios.interceptors.response.use(null, (err) => {
  Sentry.captureException(err, { tags: { type: 'http', url: err.config?.url } })
  return Promise.reject(err)
})
```

!!! danger "坑：release 不填 = 无法定位源码"
    `release` 必须和**实际部署的构建版本**一致（CI 注入版本号），否则报错堆栈无法 sourcemap 还原到具体行。生产必须开启 **sourcemap 上传**到 Sentry（别把 map 部署到公网）。

---

## 三、性能埋点（Web Vitals 官方）

### 3.1 采集三大核心指标（官方 web-vitals 库）

```bash
pnpm add web-vitals
```

```ts
import { onLCP, onINP, onCLS } from 'web-vitals'

function report(metric) {
  // 上报到监控后端（Sentry 的 metrics / 自研）
  Sentry.captureMetric?.(metric.name, metric.value) ??
    navigator.sendBeacon('/log/vitals', JSON.stringify(metric))
}

onLCP(report)
onINP(report)   // INP 已取代 FID 成为核心指标（2024-03 起）
onCLS(report)
```

!!! warning "官方口径（2024 起）"
    - **FID 已废弃，INP 成为交互核心指标**（官方 Core Web Vitals 更新）。移动端 INP 尤其重要（低端机主线程易卡）。
    - 移动端达标参考：LCP ≤ 2.5s、INP ≤ 200ms、CLS ≤ 0.1（Google 阈值为"良好"标准）。

### 3.2 首屏接口耗时

```js
// 用 PerformanceObserver 抓关键请求耗时
const po = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name.includes('/api/home')) {
      Sentry.captureMetric?.('home_api', entry.duration)
    }
  }
})
po.observe({ type: 'resource', buffered: true })
```

> 弱网专项优化看 [移动端性能专项](performance.md) §弱网。

---

## 四、灰度发布与线上兜底

### 4.1 灰度策略

| 方式 | 做法 | 适用 |
|------|------|------|
| 白名单/内部账号 | 后端按 userId 返回新版本资源 | 先小范围验证 |
| 百分比灰度 | CDN/网关按比例分流 | 渐进放量 |
| 按地区/渠道 | App 渠道包 + H5 版本分流 | 分地域验证 |
| 配置中心开关 | 远程开关控制功能/资源版本 | 一键回滚 |

!!! tip "H5 资源天然适合灰度"
    H5 改完不用发 App 包，直接发 CDN 新版本 + 配置中心开关即可放量/回滚，**这是 H5+WebView 混合方案最大工程优势**（见 [H5+WebView](h5-webview.md)）。

### 4.2 兜底防白屏

- 资源加载失败 → 加载旧版本 CDN（版本协商，见 h5-webview §六）。
- 致命 JS 错 → 全局 `error` 监听触发"轻量降级页"（原生可 `closePage` 回原生）。
- 离线包损坏 → 回源 CDN（不要只信本地包）。

---

## 五、CI 质量门禁（卡质量，防劣化）

### 5.1 卡构建体积（大厂普遍做法）

```yaml
# CI 流程：构建后检查首屏 JS 体积
- pnpm build
- node scripts/check-size.mjs   # 失败则 CI 红，禁止合并
```

```js
// scripts/check-size.mjs
import { statSync } from 'fs'
const MAX = 200 * 1024 // 首屏 chunk ≤ 200KB
const size = statSync('dist/assets/index-*.js').size
if (size > MAX) {
  console.error(`首屏 JS ${size} > ${MAX}，请拆分或懒加载`)
  process.exit(1)
}
```

> Vue3/React 0-1 章节已要求路由级懒加载，配合体积门禁才能兜住（见 [Vue3 落地](vue3-mobile.md) §首屏）。

### 5.2 Lighthouse CI（性能回归拦截）

```yaml
# .github/workflows/lhci.yml 或 gitlab-ci
- run: lhci autorun --assert.preset=lighthouse:recommended
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI }}
```

> 只对合并到主分支前的关键页跑；移动端模拟（throttling）必开，否则测的是桌面值。

### 5.3 提交门禁清单

- ✅ ESLint + Stylelint（pre-commit 拦截）
- ✅ 类型检查 `vue-tsc`/`tsc --noEmit` 不过不许合并
- ✅ 构建产物体积门禁
- ✅ Lighthouse 移动端分数门禁（性能/可访问性）
- ✅ 断链检查（本项目 `mkdocs build --strict` 思路同理）

---

## 六、速查：监控上线 Checklist

| 阶段 | 必做 |
|------|------|
| 开发期 | Sentry init + release + sourcemap 上传、web-vitals 接入 |
| 提测 | CI 体积门禁 + Lighthouse CI 通过 |
| 灰度 | 白名单/百分比 + 配置开关可回滚 |
| 上线 | RUM 看板盯 LCP/INP/崩溃率、告警阈值 |
| 故障 | 全局兜底降级页 + 离线包回源 + 一键回滚 |

---

## 七、章节关联

- 性能优化手段 → [移动端性能专项](performance.md)
- 混合/H5 灰度天然优势 → [H5 + WebView 混合开发](h5-webview.md)
- 首屏体积控制 → [Vue3 移动端 0-1](vue3-mobile.md) / [React 移动端 0-1](react-mobile.md)
