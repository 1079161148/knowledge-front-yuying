# 🛠️ 工程化面试题

> 模块化、pnpm、Vite、Webpack、缓存、构建优化、CI/CD、性能。依据 **[Vite 官方文档](https://vitejs.dev/)**、**[pnpm 文档](https://pnpm.io/)**、**[Webpack 文档](https://webpack.js.org/)**、**[MDN HTTP 缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)**。覆盖大厂高频核心题。

---

## 1. 模块化

#### Q1：CommonJS 与 ES Module 区别？
- CJS：`require`/`module.exports`，**运行时**加载、同步、值拷贝（基础类型）/引用（对象）。
- ESM：`import`/`export`，**编译时**静态分析、异步、绑定引用（实时）、支持 Tree Shaking。
- 浏览器原生支持 ESM；Node 现也支持 ESM（`"type":"module"`）。

#### Q2：为什么 ESM 能 Tree Shaking？
- `import`/`export` 是静态结构，打包器可在编译期确定哪些导出未被引用并删除；CJS 动态 `require` 无法静态分析。

---

## 2. 包管理

#### Q3：pnpm 为什么又快又省空间、还能防 phantom 依赖？
- 内容寻址全局存储 + **硬链接**，依赖不重复拷贝。
- 默认**严格隔离**：只有 `package.json` 声明的依赖才能 import，避免"幽灵依赖"（误用未声明包）。

#### Q4：lock 文件的作用？
- 锁定依赖树精确版本，保证团队成员/CI 安装一致，避免"在我机器能跑"。`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`。

---

## 3. 构建工具

#### Q5：Vite 为什么快？
- 开发态用浏览器**原生 ESM**，按需编译（改哪个文件编哪个），无需打包整个项目。
- 依赖预构建用 **esbuild**（Go 编写，比 JS 快 10-100 倍）。
- 生产态用 **Rollup** 打包（成熟、Tree Shaking 好）。

#### Q6：Webpack 与 Vite 怎么选？
- Webpack：生态成熟、loader/plugin 极丰富，适合复杂定制/老项目。
- Vite：开发体验极佳、上手快，现代新项目首选。

#### Q7：常见构建优化手段？
- 代码分割（code splitting / 路由懒加载）、Tree Shaking、按需引入（如 `unplugin-vue-components`）、压缩（esbuild/terser）、CDN、文件名 Hash 缓存、`externals` 抽公共库。

#### Q8：Tree Shaking 原理与前提？
- 基于 ESM 静态结构，打包时删除未被引用的导出。前提：用 `import`/`export`、避免副作用或在 `package.json` 标注 `"sideEffects": false`、用生产模式。

---

## 4. 网络与缓存

#### Q9：输入 URL 到页面展示的完整过程？
- DNS 解析 → TCP 三次握手 → TLS 握手（HTTPS）→ 发送 HTTP 请求 → 服务器响应 HTML → 解析 DOM/CSSOM → 构建渲染树 → 布局（Layout）→ 绘制（Paint）→ 合成（Composite）→ JS 执行与关键资源加载。

#### Q10：强缓存与协商缓存？
- 强缓存：`Cache-Control` / `Expires`，命中**不发包**，直接读本地。
- 协商缓存：`ETag` / `Last-Modified`，命中返回 **304**，省传输体量。
- 策略：带 Hash 的静态资源设长缓存（`max-age=1y, immutable`），HTML 用 `no-cache` 保证更新可感知。

#### Q11：跨域怎么解决？
- CORS（后端授权）、开发代理（dev server proxy / 网关）、JSONP（仅 GET，已淘汰）、`postMessage`（跨窗口）、WebSocket（不受同源限制）。

---

## 5. 性能优化

#### Q12：首屏加载优化手段？
- 路由懒加载、图片懒加载/压缩、关键 CSS 内联、Gzip/Brotli、CDN、SSR/预渲染、减少阻塞脚本、HTTP2 多路复用、字体 `font-display: swap`。

#### Q13：CI/CD 常见流程？
- 提交 → lint + 单测 → 构建 → 部署（静态托管/容器）。常用 GitHub Actions、GitLab CI。门禁：测试不过不发布。

#### Q14：如何实现骨架屏？
- SSR 直出骨架 DOM、或构建时注入、`requestIdleCallback` 占位，避免白屏、提升体感。

---

## 6. 下一步

- 网络层细节看 [源码原理面试题](source-code.md) 与 [浏览器原理深化：网络通识](../advanced/browser-network.md)。
- 框架配套看 [框架面试题](framework.md)。
