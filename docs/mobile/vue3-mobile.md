# 🟢 Vue3 移动端 0-1 落地（技术选型 · 搭建 · 兼容 · 对标大厂）

> 用 Vue3 从零做一个生产级移动端项目。本篇给**技术选型方案、项目搭建步骤、兼容性处理、注意事项**，并**对标大厂主流方案**（字节/美团/滴滴等移动端实践）。依据 **Vue3 官方文档**、**Vite**、**Vant**、**Pinia**、社区大厂实践沉淀。
>
> 适用：要落地 Vue3 移动端项目的开发者。前置：[移动端基础](basics.md)、[适配方案](adaptation.md)、[兼容性](compatibility.md)、[性能专项](performance.md)。

---

## 一、技术选型方案（Vue3 移动端主流栈）

| 层 | 选型 | 为什么 |
|----|------|--------|
| 框架 | **Vue3 + `<script setup>`** | 组合式 API、响应式细粒度、TS 友好 |
| 构建 | **Vite** | 秒级启动、ESM 原生、HMR 快 |
| 语言 | **TypeScript** | 大厂标配，类型安全 |
| UI 组件库 | **Vant 4**（移动端首选） | 59+ 移动组件、按需引入、主题定制 |
| 状态 | **Pinia** | Vue3 官方推荐，比 Vuex 轻 |
| 路由 | **Vue Router 4**（hash 模式优先，Hybrid 友好） | hash 兼容 WebView/分享 |
| 请求 | **Axios** + 拦截器（或 `vue-request`） | 取消/重试/缓存 |
| 样式 | **PostCSS px-to-viewport + SCSS** | 设计稿 px 自动转 vw |
| 适配 | `vw + clamp + 容器查询` + `viewport-fit=cover` | 见 [适配](adaptation.md) |
| 包管理 | **pnpm** | 快、省磁盘、严格依赖 |
| 移动端增强 | **vant** + **@vant/touch-emulator**（桌面调试触摸） | — |

!!! tip "大厂对照"
    - **字节/美团**：Vue3 + Vite + TypeScript + 自研组件库（或 Vant 二开）+ pnpm monorepo。
    - **滴滴**：Vue3 + Vant + 自研桥（见 [Hybrid](debug-hybrid.md)）。
    - 共同点：**TypeScript 全量、Vite 构建、组件库二开、严格 code review、CI 卡构建体积**。

---

## 二、项目搭建（从 0 到跑起来）

### 2.1 初始化

```bash
# 用官方脚手架
npm create vue@latest my-mobile -- --ts --router --pinia
cd my-mobile && pnpm i
```

### 2.2 引入 Vant（按需）

```bash
pnpm add vant
pnpm add -D unplugin-vue-components unplugin-auto-import
```

```js
// vite.config.ts
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VantResolver()] })]  // 自动按需引入 Vant
})
```

```vue
<!-- 直接用，无需 import -->
<template><van-button type="primary">按钮</van-button></template>
```

### 2.3 适配配置（PostCSS 自动转 vw）

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    'postcss-px-to-viewport-8-plugin': {
      viewportWidth: 375,         // 设计稿宽
      unitToConvert: 'px',
      propList: ['*'],
      selectorBlackList: ['.ignore', 'van-'],  // Vant 自带适配，别二次转
      minPixelValue: 1
    }
  }
}
```

!!! danger "坑 1：Vant 组件被二次转 vw 导致尺寸错"
    Vant 默认按 375 设计且自带 rem/vw 适配，PostCSS 再转会翻倍。把 `van-` 加黑名单（黑名单，不是白名单），或统一用 Vant 的 `rootValue` 方案。

### 2.4 设计稿规范与单位转换（写 px，插件自动转）

> 核心约定：**开发时直接按设计稿写 `px`，由 PostCSS 插件在构建期自动转成 `vw`**，不要人工算 vw/rem。

**1）设计稿规范（团队对齐）**

| 项 | 要求 |
|----|------|
| 基准宽度 | **375px**（iPhone 标准，Vant 默认基准） |
| 标注单位 | 设计稿用 `px` 标注，开发**原样写 px** |
| 倍率 | @2x / @3x 切图由设计导出，开发不手动除 2 |
| 字号下限 | 最小 `20px` 起标，避免小屏糊字（iOS 最小可读） |
| 1px 边框 | 用 Vant `hairline` 或伪元素 `scale`，**不要写 0.5px**（部分机型不支持） |
| 安全区 | 底部 TabBar / 固定栏预留 `env(safe-area-inset-bottom)` |
| 间距栅格 | 统一 4px 基线（4/8/12/16/24…），保证节奏一致 |

**2）单位转换插件与职责**

| 插件 | 作用 | 何时用 |
|------|------|--------|
| `postcss-px-to-viewport-8-plugin` | px → vw（按 `viewportWidth:375`） | 主力，业务 px 自动转 |
| `postcss-pxtorem` + `amfe-flexible` | px → rem（动态根字号） | 需要兼容老安卓 WebView 时 |
| `autoprefixer` | 自动加厂商前缀 | 必备 |
| `postcss-px-to-viewport` 的 `selectorBlackList` | 跳过 Vant 组件类（`van-`） | 防二次转换 |

**3）开发注意事项**

- **只写 px，别手算 vw/rem**：`width: 100px`（设计稿量多少写多少），插件转 vw；手算易错且和插件叠加翻倍。
- **Vant 组件不转**：`selectorBlackList: ['van-']`，否则 Vant 自带适配被二次转 → 尺寸翻倍（见坑 1）。
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
      selectorBlackList: ['van-', 'ignore-'],  // 黑名单：Vant 与 .ignore- 不转
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
/* 全局安全区 */
#app { padding-bottom: env(safe-area-inset-bottom); }
```

---

## 三、目录结构（推荐）

```
src/
├─ api/          # 接口层（axios 实例 + 各模块）
├─ components/   # 业务组件
├─ composables/  # 组合式函数（useXxx）
├─ router/       # 路由 + 守卫
├─ stores/       # Pinia
├─ utils/        # 工具（bridge、request、format）
├─ views/        # 页面
├─ styles/       # 全局样式 + 变量
└─ App.vue
```

!!! tip "composables 复用逻辑"
    把"下拉刷新、上拉加载、桥调用、权限"封装成 `usePullRefresh`、`useBridge`，页面只调不写重复逻辑。

---

## 四、路由与 Hybrid（hash 模式）

```js
// router/index.ts —— Hybrid 用 hash 更稳
const router = createRouter({ history: createWebHashHistory(), routes })
```

!!! danger "坑 2：history 模式在 WebView 分享后 404"
    微信分享会改写 URL、刷新后服务端无对应路由 → 白屏。Hybrid/分享场景用 **hash 模式**（见 [兼容性 §八](compatibility.md)）。

---

## 五、兼容性注意事项（Vue3 专项）

| 项 | 注意 |
|----|------|
| **1px 边框** | 用 Vant 的 `hairline` 或自定义（[basics §2.2](basics.md)） |
| **100vh** | 用 `100dvh`，Vant 弹层已处理 |
| **长列表** | 用 `vue-virtual-scroller` 或 Vant `List` 无限滚动 |
| **组件卸载清理** | `onUnmounted` 清定时器/Observer/Worker（[性能 §五](performance.md)） |
| **iOS 点击延迟** | `touch-action: manipulation`（Vant 已处理大部分） |
| **低版本 WebView** | `@vitejs/plugin-legacy` 出兼容包 + `browserslist` |

```js
// vite.config.ts 兼容老安卓
import legacy from '@vitejs/plugin-legacy'
plugins: [legacy({ targets: ['defaults', 'not IE 11'] })]
```

---

## 六、性能落地（Vue3 专项）

- **路由懒加载**：`component: () => import('@/views/Home.vue')`
- **v-memo / shallowRef**：长列表大对象避免深度响应
- **图片懒加载**：Vant `Lazyload` 或原生 `loading="lazy"`
- **首屏骨架**：Vant `Skeleton`
- **分包**：`build.rollupOptions.output.manualChunks` 拆 vendor

!!! danger "坑 3：响应式大数组拖垮渲染"
    上万条数据别直接 `reactive`，用 `shallowRef` + 手动触发，配合虚拟滚动。

---

## 七、对标大厂：生产级 Checklist

- [ ] TypeScript 全量 + strict
- [ ] pnpm + monorepo（多端复用）
- [ ] 组件库二开（主题/规范统一）
- [ ] 路由级懒加载 + 拆包，首屏 JS < 200KB(gzip)
- [ ] 适配 vw + 安全区 + 折叠屏容器查询
- [ ] 错误监控（Sentry）+ 性能监控（Web Vitals）
- [ ] CI 卡体积/单测，禁止大依赖入库
- [ ] Hybrid 桥安全（白名单 + 超时，见 [debug-hybrid](debug-hybrid.md)）
- [ ] 离线方案（PWA 或离线包，见 [pwa](pwa.md)）

---

## 八、面试怎么讲（Vue3 移动端）

> 见 [面试难点与亮点](../interview/highlights.md)。
> - **难点**：折叠屏展开态旧断点错乱 → 容器查询 + ResizeObserver 重排。
> - **亮点**：搭的 Vue3 移动端脚手架（Vant 二开 + vw 适配 + 桥安全）被 5 个业务复用。
