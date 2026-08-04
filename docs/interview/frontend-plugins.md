# 🔌 常用插件 / 第三方库面试题

> 前端面试越来越看重**生态工具链熟练度**：你不是只会写组件，还要懂「常用库为什么这么设计、踩过什么坑、怎么选型」。覆盖请求、状态、路由、构建、样式、动画、图表、工具函数等。答案依据各库**官方文档**（Axios / Pinia / Vue Router / Vite / Webpack / Tailwind / ECharts / Lodash / Day.js 等）。

---

## 1. 请求层：Axios

#### Q1：Axios 的拦截器？和 fetch 比有什么优势？
- 拦截器：`request` 拦截统一加 token/loading；`response` 拦截统一解包、错误处理、刷新 token。
- 相比 fetch：内置**超时**、**自动 JSON**、**取消请求**（`CancelToken` / `AbortController`）、**XSRF 防御**、**进度**；fetch 更底层、要手动封装。

#### Q2：怎么实现无感刷新 token？
- response 拦截器捕获 401 → 用 `refreshToken` 换 `accessToken` → **用同一 refresh 队列**避免并发重复刷新 → 重放原请求。

#### Q3：Axios 取消请求怎么用？什么场景？
- `const c = new AbortController(); axios.get(url, { signal: c.signal })`，组件卸载 `c.abort()`。
- 场景：切页/搜索联想防竞态、组件卸载防 setState 警告。

## 2. 状态与路由：Pinia / Vue Router / Redux

#### Q4：Pinia 持久化怎么做？注意什么？
- 用 `pinia-plugin-persistedstate` 写 `localStorage`；敏感信息（token）别存持久化、或存 `sessionStorage`。
- 注意：持久化的是**快照**，结构变更要做版本迁移，否则旧数据污染新结构。

#### Q5：Vue Router 路由守卫执行顺序？
- 全局 `beforeEach` → 路由 `beforeEnter` → 组件 `beforeRouteEnter` → 全局 `beforeResolve` → `afterEach`。
- 常用于登录鉴权：`beforeEach` 里判 token 跳登录；`afterEach` 做埋点/进度条收尾。

#### Q6：React Router v6 与 v5 核心差异？
- v6 用 `<Routes>` 替代 `<Switch>`；`useNavigate` 替代 `useHistory`；`Outlet` 做嵌套；`useParams/useSearchParams` 更函数式；路由可嵌套、可配 `index`。

## 3. 构建工具：Vite / Webpack

#### Q7：Vite 依赖预构建（Pre-Bundling）干嘛的？
- 把 CommonJS/多文件依赖（如 `lodash`、`vue`）提前用 esbuild 打成 ESM、合并，避免浏览器发起海量请求、解决 CJS 兼容。
- 产物在 `node_modules/.vite`，改 `optimizeDeps` 配置或删缓存可重构建。

#### Q8：Webpack 的 loader 和 plugin 区别？
- **loader**：文件级转换（`.css → js`、`.ts → js`），管道式。
- **plugin**：全生命周期钩子（打包优化、资源注入、压缩），如 `HtmlWebpackPlugin`、`SplitChunksPlugin`、`DefinePlugin`。

#### Q9：怎么用 Webpack / Vite 做代码分割？
- Webpack：`optimization.splitChunks` + 动态 `import()`。
- Vite/Rollup：动态 `import()` 自动分包；`build.rollupOptions.output.manualChunks` 手动拆 vendor。

## 4. 样式与 UI

#### Q10：Tailwind 的优缺点？原子化 CSS 怎么防样式膨胀？
- 优点：开发快、无命名纠结、约束设计 token、产物小（只生成用到的类）。
- 缺点：HTML 长、学习曲线；膨胀靠 **JIT**（只生成使用到的类）+ `content` 扫描解决。

#### Q11：PostCSS 是什么？和 Sass/Less 关系？
- PostCSS 是 CSS 的「AST 处理器」，插件化（autoprefixer、px→vw、nesting）。
- Sass/Less 是预处理器（变量/嵌套/混合）；PostCSS 常与之配合（如 Sass 编译后再 autoprefixer）。

## 5. 数据可视化与动画

#### Q12：ECharts 大数据量卡顿怎么优化？
- `large: true` 大数据模式、`progressive` 增量渲染；降采样；用 `dataset` 而非逐项 setOption；`setOption` 注意合并策略；组件销毁 `dispose()` 防泄漏。

#### Q13：GSAP / anime.js 与 CSS 动画怎么选？
- 简单过渡用 CSS（性能、易维护）；**复杂时间线/序列/物理缓动**用 GSAP（时间轴、暂停/倒放、ScrollTrigger）。
- 性能：能用 `transform/opacity` 就别动布局属性。

## 6. 工具库

#### Q14：Lodash 你常用哪些？为什么别全量引？
- `debounce/throttle`、`cloneDeep`、`get`、数组/集合工具。
- 全量引入会让 Tree Shaking 失效、体积暴涨；按需 `import debounce from 'lodash/debounce'`，或用 `lodash-es`。

#### Q15：Day.js / moment 怎么选？时区坑？
- moment 已废弃（体积大、不可 Tree Shake）；Day.js API 兼容、轻量。
- 时区：用 `dayjs/plugin/timezone` + `utc`；存储统一 **UTC**，展示按用户时区转，避免「服务器时间=用户时间」错乱。

#### Q16：怎么选组件库（Element Plus / Ant Design / Naive）？
- 中后台：Ant Design（React）/ Element Plus（Vue）生态最全。
- 轻量/定制：Naive UI（Vue，TS 友好）、Arco。
- 选型看：TS 支持、按需加载、无障碍、是否仍活跃维护、团队熟悉度。

## 7. 下一步

- 框架原理看 [框架面试题（深化）](frontend-framework-deep.md)；工程化总览看 [工程化面试题](engineering.md)。
- 生态库实战看 [前端热门第三方库 / 插件实战总览](../libraries/index.md)。
