# 🔵 React 移动端 0-1 落地（技术选型 · 搭建 · 兼容 · 对标大厂）

> 用 React 从零做一个生产级移动端项目。本篇给**技术选型方案、项目搭建步骤、兼容性处理、注意事项**，并**对标大厂主流方案**（Meta/字节/阿里/拼多多等移动端实践）。依据 **React 官方文档**、**Vite**、**Ant Design Mobile**、**Zustand**、社区大厂实践沉淀。
>
> 适用：要落地 React 移动端项目的开发者。前置：[移动端基础](basics.md)、[适配方案](adaptation.md)、[兼容性](compatibility.md)、[性能专项](performance.md)。

---

## 一、技术选型方案（React 移动端主流栈）

| 层 | 选型 | 为什么 |
|----|------|--------|
| 框架 | **React 18 + 函数组件 + Hooks** | 并发特性、生态最大 |
| 构建 | **Vite**（或 Next.js 若需 SSR） | 秒级启动；SSR 见 [全栈 Next](../fullstack/index.md) |
| 语言 | **TypeScript** | 大厂标配 |
| UI 组件库 | **Ant Design Mobile (antd-mobile v5)** | 移动端组件全、按需引入 |
| 状态 | **Zustand**（轻）/ **Redux Toolkit**（大团队） | 见 [第三方库](../libraries/index.md) |
| 路由 | **React Router 6**（hash 优先 Hybrid） | hash 兼容 WebView |
| 请求 | **Axios** + **SWR/React Query**（请求缓存） | 见 [第三方库](../libraries/index.md) |
| 样式 | **CSS Modules / Tailwind + PostCSS px-to-viewport** | 设计稿 px 转 vw |
| 适配 | `vw + clamp + 容器查询` + `viewport-fit=cover` | 见 [适配](adaptation.md) |
| 包管理 | **pnpm** | 快、严格 |
| 移动增强 | `antd-mobile` + 手势库（如 `@use-gesture/react`） | — |

!!! tip "大厂对照"
    - **阿里/蚂蚁**：React + Umi + antd-mobile + TypeScript + 自研构建（同构/SSR）。
    - **字节**：React + Vite + TypeScript + 自研组件库 + pnpm monorepo。
    - **Meta/海外**：React + Next.js（SSR/SSG）+ React Query。
    - 共同点：**函数组件 + Hooks、TypeScript 全量、严格 lint、CI 卡体积、组件库二开**。

---

## 二、项目搭建（从 0 到跑起来）

### 2.1 初始化

```bash
npm create vite@latest my-mobile -- --template react-ts
cd my-mobile && pnpm i
```

### 2.2 引入 antd-mobile（按需，babel 自动）

```bash
pnpm add antd-mobile
pnpm add -D babel-plugin-import   # 或 Vite 用 unplugin-auto-import
```

```tsx
// 直接用，配置按需
import { Button, Toast } from 'antd-mobile'
export default () => <Button color="primary">按钮</Button>
```

### 2.3 适配配置（PostCSS 自动转 vw）

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    'postcss-px-to-viewport-8-plugin': {
      viewportWidth: 375,
      unitToConvert: 'px',
      propList: ['*'],
      selectorBlackList: ['.ignore', 'adm-'],  // antd-mobile 自带适配，别二次转
      minPixelValue: 1
    }
  }
}
```

!!! danger "坑 1：antd-mobile 组件被二次转 vw 尺寸错"
    同 Vue 的 Vant 问题。把 `adm-` 加黑名单（黑名单，不是白名单），或统一用 antd-mobile 自带 viewport 方案，避免叠加。

### 2.4 设计稿规范与单位转换（写 px，插件自动转）

> 核心约定：**开发时直接按设计稿写 `px`，由 PostCSS 插件在构建期自动转成 `vw`**，不要人工算 vw/rem。

**1）设计稿规范（团队对齐）**

| 项 | 要求 |
|----|------|
| 基准宽度 | **375px**（iPhone 标准，antd-mobile 默认基准） |
| 标注单位 | 设计稿用 `px` 标注，开发**原样写 px** |
| 倍率 | @2x / @3x 切图由设计导出，开发不手动除 2 |
| 字号下限 | 最小 `20px` 起标，避免小屏糊字（iOS 最小可读） |
| 1px 边框 | 用 antd-mobile `hairline` 或伪元素 `scale`，**不要写 0.5px**（部分机型不支持） |
| 安全区 | 底部 TabBar / 固定栏预留 `env(safe-area-inset-bottom)` |
| 间距栅格 | 统一 4px 基线（4/8/12/16/24…），保证节奏一致 |

**2）单位转换插件与职责**

| 插件 | 作用 | 何时用 |
|------|------|--------|
| `postcss-px-to-viewport-8-plugin` | px → vw（按 `viewportWidth:375`） | 主力，业务 px 自动转 |
| `postcss-pxtorem` + `amfe-flexible` | px → rem（动态根字号） | 需要兼容老安卓 WebView 时 |
| `autoprefixer` | 自动加厂商前缀 | 必备 |
| `postcss-px-to-viewport` 的 `selectorBlackList` | 跳过 antd-mobile 组件类（`adm-`） | 防二次转换 |

**3）开发注意事项**

- **只写 px，别手算 vw/rem**：`width: 100px`（设计稿量多少写多少），插件转 vw；手算易错且和插件叠加翻倍。
- **antd-mobile 组件不转**：`selectorBlackList: ['adm-']`，否则其自带适配被二次转 → 尺寸翻倍（见坑 1）。
- **不该转的**：`border-width: 1px` 想保留物理 1px 时，把对应类加黑名单；或用 `hairline`。
- **媒体查询 / 动画里的 px**：`propList` 默认 `['*']` 会转，若某属性不想转用 `['*', '!border*']` 或加 `mediaQuery: false`。
- **大屏 / 平板**：用 `max-vw` 或容器查询限制最大宽度，避免无限放大（见 [适配方案](adaptation.md)）。

```js
// postcss.config.cjs —— 写 px，自动转 vw
module.exports = {
  plugins: {
    'postcss-px-to-viewport-8-plugin': {
      viewportWidth: 375,         // 设计稿基准宽
      unitToConvert: 'px',
      propList: ['*'],
      selectorBlackList: ['adm-', 'ignore-'],  // 黑名单：antd-mobile 与 .ignore- 不转
      mediaQuery: false,          // 媒体查询里的 px 不转
      minPixelValue: 1
    },
    autoprefixer: {}
  }
}
```

!!! tip "写代码的心智模型"
    你眼里只有 375 设计稿的 px；vw、rem、安全区、黑名单全是构建期的"翻译层"，开发时不用管。

### 2.5 viewport meta + 安全区

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```
```css
#root { padding-bottom: env(safe-area-inset-bottom); }
```

---

## 三、目录结构（推荐）

```
src/
├─ api/           # 接口层
├─ components/    # 业务组件
├─ hooks/         # 自定义 Hooks（useXxx）
├─ router/        # 路由 + 守卫
├─ store/         # Zustand / Redux
├─ utils/         # 工具（bridge、request）
├─ views/         # 页面
├─ styles/        # 全局样式
└─ App.tsx
```

!!! tip "用 hooks 复用逻辑"
    `usePullRefresh`、`useInfiniteScroll`、`useBridge` 封装成 hooks，页面只调。

---

## 四、路由与 Hybrid（hash 模式）

```tsx
import { createHashRouter } from 'react-router-dom'
const router = createHashRouter([{ path: '/', element: <Home /> }])
```

!!! danger "坑 2：history 模式在 WebView 分享后 404"
    同 Vue。Hybrid/分享场景用 **hash 模式**（见 [兼容性 §八](compatibility.md)）。

---

## 五、兼容性注意事项（React 专项）

| 项 | 注意 |
|----|------|
| **1px 边框** | 用 antd-mobile 的 `hairline` 或自定义（[basics §2.2](basics.md)） |
| **100vh** | 用 `100dvh`，antd-mobile 弹层已处理 |
| **长列表** | `react-window` / `react-virtuoso` 虚拟滚动 |
| **卸载清理** | `useEffect` 的 cleanup 清定时器/Observer/Worker（[性能 §五](performance.md)） |
| **Context 误用** | 高频更新别放 Context，用 Zustand（见 [第三方库](../libraries/index.md)） |
| **低版本 WebView** | `@vitejs/plugin-legacy` + `browserslist` |

```js
// vite.config.ts
import legacy from '@vitejs/plugin-legacy'
plugins: [react(), legacy({ targets: ['defaults', 'not IE 11'] })]
```

---

## 六、性能落地（React 专项）

- **路由懒加载**：`const Home = lazy(() => import('./views/Home'))` + `<Suspense>`
- **memo / useMemo / useCallback**：避免子组件无谓重渲染（长列表关键）
- **虚拟滚动**：`react-window`（[性能 §三](performance.md)）
- **图片懒加载**：原生 `loading="lazy"` 或 `react-lazy-load`
- **请求缓存**：SWR/React Query 自动缓存 + 去重
- **分包**：`manualChunks` 拆 vendor

!!! danger "坑 3：列表用 index 当 key"
    数据重排时复用错乱、状态串台。用**稳定业务 id**（见 [性能 §三](performance.md)）。

!!! danger "坑 4：useEffect 依赖缺失导致重复请求/内存泄漏"
    漏依赖 → 闭包拿旧值或卸载不取消请求。配合 `AbortController`（[原生API §5.1](../advanced/browser-optimize-api.md)）。

---

## 七、对标大厂：生产级 Checklist

- [ ] TypeScript 全量 + strict
- [ ] pnpm + monorepo（多端复用）
- [ ] 组件库二开（主题/规范统一）
- [ ] 路由级懒加载 + 拆包，首屏 JS < 200KB(gzip)
- [ ] 适配 vw + 安全区 + 折叠屏容器查询
- [ ] 错误监控（Sentry）+ 性能监控（Web Vitals / INP）
- [ ] CI 卡体积/单测，禁止大依赖入库
- [ ] Hybrid 桥安全（白名单 + 超时，见 [debug-hybrid](debug-hybrid.md)）
- [ ] 离线方案（PWA 或离线包，见 [pwa](pwa.md)）
- [ ] SSR 需求走 Next.js（见 [全栈 Next](../fullstack/nextjs-from-scratch.md)）

---

## 八、Vue3 vs React 移动端对照

| 维度 | Vue3 | React |
|------|------|-------|
| UI 库 | Vant 4 | antd-mobile v5 |
| 状态 | Pinia | Zustand / Redux Toolkit |
| 逻辑复用 | composables | hooks |
| 响应式 | 编译期自动追踪 | 手动 memo/useMemo |
| 长列表 | vue-virtual-scroller | react-window |
| 适配坑 | Vant 别二次转 vw | antd-mobile 别二次转 vw |
| 大厂 | 字节/美团/滴滴 | 阿里/字节/拼多多 |

> 两者工程化（Vite/TS/pnpm/拆包/桥安全）高度一致，差异在框架层 API。选型看团队储备。

---

## 九、面试怎么讲（React 移动端）

> 见 [面试难点与亮点](../interview/highlights.md)。
> - **难点**：万行列表 INP 超标 → 虚拟滚动 + memo + 稳定 key，INP 从 320ms 降到 90ms。
> - **亮点**：React 移动端脚手架（antd-mobile 二开 + vw 适配 + 桥安全）被多业务复用。
