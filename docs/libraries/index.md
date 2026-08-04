# 📦 前端热门第三方库 / 插件实战总览（场景 · 用法 · 避坑）

> 业务里真正"扛把子"的第三方库，按**技术方案场景**分类：可视化、大屏、状态管理、请求、动画、工具函数、UI 组件、表格表单、地图、富文本等。每类给出：解决什么问题、代表库、最小可用写法、真实业务作用、避坑指南。依据各库官方文档与社区最佳实践。
>
> 适用：全等级——选型时看、落地时抄、踩坑时查。安装均用 `npm i`（或 `pnpm add`）。中国大陆建议先 `npm config set registry https://registry.npmmirror.com`。
>
> 关联：[工程化 - 依赖管理](../engineering/monorepo/index.md)、[浏览器原生优化 API](../advanced/browser-optimize-api.md)。

---

## 一、数据可视化 / 大屏

### 1.1 ECharts（百度开源，最主流）

**解决**：折线/柱状/饼/地图/雷达/K 线等几十种图表，大屏标配。

```bash
npm i echarts
```

```js
import * as echarts from 'echarts'
const chart = echarts.init(document.querySelector('#box'))
chart.setOption({
  xAxis: { type: 'category', data: ['Mon','Tue'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [120, 200] }]
})
// 响应式：窗口变化时
window.addEventListener('resize', () => chart.resize())
```

**真实业务作用**：运营数据看板、监控大屏、报表导出（支持 `getDataURL` 出图）。

!!! danger "避坑 1：不销毁导致内存泄漏"
    组件卸载必须 `chart.dispose()`，否则切页后旧实例残留、内存涨。

!!! danger "避坑 2：大屏自适应"
    用 `transform: scale()` 整体缩放 + 监听 `resize` 调 `chart.resize()`；或 ECharts 自带 `dataZoom` 做交互缩放。

!!! tip "按需引入瘦身"
    ```js
    import * as echarts from 'echarts/core'
    import { BarChart } from 'echarts/charts'
    echarts.use([BarChart])
    ```
    全量引入 ~1MB，按需可降到 200KB 级。

### 1.2 D3.js（底层绘图，灵活但门槛高）

**解决**：定制化极强的关系图、力导向、地理投影、自定义可视化。

```bash
npm i d3
```

```js
import * as d3 from 'd3'
d3.select('#box').append('circle').attr('r', 30).attr('fill', 'teal')
```

!!! warning "别用 D3 重复造 ECharts 的轮子"
    标准图表直接用 ECharts；只有"非常规交互/独特视觉"才上 D3，开发成本 3-10 倍。

### 1.3 AntV（G2/G6/X6）—— 阿里系

- **G2**：统计图（类 ECharts）。
- **G6**：图可视化（流程图、关系网）。
- **X6**：流程图编辑（拖拽连线，做低代码/工作流编辑器）。

### 1.4 大屏专项方案

**DataV（火山/阿里 DataV 社区版）**：

```bash
npm i @jiaminghi/data-view  # 或 @kjgl77/datav-vue3（Vue3）
```

提供边框、装饰、轮播表、胶囊等"大屏组件"，省去手写 CSS 装饰。

!!! tip "大屏分辨率适配三板斧"
    1. 设计稿按 1920×1080。
    2. 外层 `transform: scale(实际宽/1920)` 等比缩放。
    3. 图表/文字用相对单位，避免固定 px 错位。

---

## 二、状态管理

| 库 | 适用框架 | 场景 |
|----|---------|------|
| **Pinia** | Vue3 | 官方推荐，Composition 友好，TS 好 |
| **Vuex** | Vue2/3 | 老项目维护 |
| **Zustand** | React | 极简，无 Provider 嵌套 |
| **Redux Toolkit** | React | 大团队规范、可调试（DevTools/时间旅行） |
| **Jotai / Recoil** | React | 原子化状态，细粒度更新 |
| **Context API** | React | 轻量全局（主题/用户），别放高频更新数据（整树重渲染） |

```bash
npm i zustand        # React
npm i pinia          # Vue3
```

```js
// Zustand 最小用法
import { create } from 'zustand'
const useStore = create(set => ({ count: 0, inc: () => set(s => ({ count: s.count + 1 })) }))
```

!!! danger "避坑 3：Context 放高频数据"
    React Context 一变全树重渲染，购物车/计数器这类高频更新务必用 Zustand/Redux，别塞 Context。

---

## 三、HTTP 请求

### 3.1 Axios（最常用）

```bash
npm i axios
```

```js
const api = axios.create({ baseURL: '/api', timeout: 8000 })
api.interceptors.request.use(cfg => { cfg.headers.token = getToken(); return cfg })
api.interceptors.response.use(r => r.data, err => Promise.reject(err))
```

!!! danger "避坑 4：取消重复请求 + 组件卸载取消"
    用 `CancelToken`/`AbortController` 防重复提交；路由切换时取消未完成请求，避免 setState 报错。

!!! warning "浏览器原生 fetch 已够用"
    简单项目可直接用 `fetch` + `AbortController`（见 [原生优化 API](../advanced/browser-optimize-api.md)），不必强引 Axios。

### 3.2 SWR / React Query（数据获取 + 缓存）

**解决**：请求缓存、轮询、分页、乐观更新、失效重取，省手写 loading/error 状态机。

```bash
npm i swr            # React 轻量
npm i @tanstack/react-query  # 功能更全
```

```js
import useSWR from 'swr'
const { data, error, isLoading } = useSWR('/api/user', fetcher)
```

---

## 四、动画

### 4.1 GSAP（专业动画，性能最强）

```bash
npm i gsap
```

```js
import gsap from 'gsap'
gsap.to('.box', { x: 200, rotation: 360, duration: 1, ease: 'power2.out' })
```

**业务作用**：营销页复杂时间线动画、大屏入场动效。比 CSS 动画更可控、比手写 rAF 更稳。

### 4.2 Framer Motion（React 声明式动画）

```bash
npm i framer-motion
```

```jsx
<motion.div animate={{ x: 100 }} transition={{ duration: 0.5 }} />
```

### 4.3 anime.js / Lottie（轻量）

- **anime.js**：轻量 SVG/DOM 动画。
- **lottie-web**：播放 AE 导出的 JSON 动画（运营活动动效神器）。

!!! tip "动画走 transform/opacity"
    任何库最终都应改 `transform`/`opacity`（GPU 合成），避免改 `top/left/width` 触发重排（见 [原生优化 API §6](../advanced/browser-optimize-api.md)）。

---

## 五、工具函数库

| 库 | 作用 | 说明 |
|----|------|------|
| **lodash / lodash-es** | 防抖节流、深拷贝、数组工具 | 按需 `import debounce from 'lodash/debounce'` 防全量打包 |
| **dayjs** | 日期处理（2KB，moment 替代品） | `dayjs().add(1,'day').format('YYYY-MM-DD')` |
| **nanoid** | 生成唯一 ID | 比 uuid 更小 |
| **clsx / classnames** | 条件拼接 className | 组件必备 |
| **uuid** | UUID | 需要标准 UUID 时用 |
| **decimal.js / big.js** | 高精度计算 | 金额/价格必用，防浮点误差 `0.1+0.2` |

!!! danger "避坑 5：lodash 全量引入撑大包"
    `import _ from 'lodash'` 全量 ~70KB。用 `import debounce from 'lodash/debounce'` 或 `lodash-es` + tree-shaking。

!!! danger "避坑 6：金额用浮点"
    `0.1 + 0.2 === 0.30000000000000004`。价格计算用 `decimal.js` 或整数分存储。

---

## 六、UI 组件库（按框架）

| 框架 | 库 | 说明 |
|------|-----|------|
| Vue3 | **Element Plus** / **Naive UI** / **Ant Design Vue** | 中后台首选 |
| Vue2 | **Element UI** | 老项目 |
| React | **Ant Design** / **MUI** / **shadcn/ui** | 中后台/通用 |
| 通用 | **Tailwind CSS** | 原子化 CSS，非组件库但是样式基建 |

!!! tip "中后台直接上组件库"
    别手写表格/表单/弹窗；Ant Design / Element Plus 自带校验、分页、虚拟滚动，省 80% 工作量。

---

## 七、表格 / 表单 / 树（大数据）

| 库 | 场景 |
|----|------|
| **vxe-table** | Vue 虚拟滚动表格（万行不卡） |
| **ag-grid** | 企业级表格（排序/筛选/分组，功能最全，部分收费） |
| **react-window / react-virtualized** | React 虚拟列表 |
| **vue-virtual-scroller** | Vue 虚拟列表 |
| **Formily** | 复杂动态表单（低代码表单引擎） |

!!! danger "避坑 7：万行数据别普通 v-for"
    普通渲染上万行直接卡死。用虚拟滚动（只渲染可视区），`vxe-table` / `react-window` 等。

---

## 八、地图

| 库 | 场景 |
|----|------|
| **高德地图 JS API** / **百度地图** | 国内业务定位/路径/POI |
| **Leaflet** | 轻量开源地图（配合 OSM） |
| **Mapbox GL** | 炫酷矢量地图（大屏可视化常用） |
| **deck.gl** | 海量地理数据可视化（飞线/热力） |

!!! warning "地图要 Key + 配额"
    各家地图需申请 Key，有 QPS/配额限制，大屏批量打点注意限流和聚合。

---

## 九、富文本 / 文档

| 库 | 场景 |
|----|------|
| **wangEditor** | 国内轻量富文本，开箱即用 |
| **Quill** | 中等复杂度 |
| **Tiptap**（基于 ProseMirror） | 高度可定制，React/Vue 友好 |
| **Slate** | 完全自定义编辑器 |
| **docx / pdf-lib** | 前端生成 Word/PDF |

---

## 十、拖拽 / 低代码

| 库 | 场景 |
|----|------|
| **vuedraggable**（Vue，基于 SortableJS） | 列表拖拽排序 |
| **@dnd-kit/core**（React） | 现代拖拽，无障碍好 |
| **react-dnd** | React 拖拽（老牌） |
| **SortableJS** | 框架无关拖拽底层 |

---

## 十一、文件处理 / 上传

| 库 | 场景 |
|----|------|
| **aliyun-oss / qcloud-cos** | 直传阿里云/腾讯云 OSS（前端签名直传，省后端流量） |
| **plupload / uppy** | 大文件分片断点续传 |
| **jszip** | 前端打 zip 包下载 |
| **file-saver** | 触发文件下载 |

!!! danger "避坑 8：大文件别一次性上传"
    用分片上传 + 断点续传（uppy/plupload），否则网络抖动全失败重来。直传 OSS 需后端签临时凭证，别把 Secret 放前端。

---

## 十二、选型与依赖治理避坑

!!! danger "避坑 9：盲目引库，依赖膨胀"
    - 先问"浏览器原生能不能做"（见 [原生优化 API](../advanced/browser-optimize-api.md)），能原生就别引。
    - 引库前看 **周下载量、最近维护时间、bundle 体积、TS 类型支持**。
    - 用 `npm ls` / `depcheck` 定期清无用依赖。

!!! danger "避坑 10：锁文件与版本漂移"
    - 提交 `package-lock.json` / `pnpm-lock.yaml`。
    - 大版本升级（如 Antd 4→5、Vue2→3）先看迁移指南，别直接 `npm i 最新`。

!!! tip "体积分析"
    ```bash
    npm i -D webpack-bundle-analyzer   # webpack
    # 或 vite 用 rollup-plugin-visualizer
    ```
    定期看包体，揪出意外引入的大库。

---

## 十三、速查：业务场景 → 库映射

| 业务需求 | 首选库 |
|---------|--------|
| 数据看板/大屏图表 | ECharts |
| 流程图编辑 | AntV X6 / G6 |
| 大屏装饰边框 | DataV |
| 中后台表格万行 | vxe-table / ag-grid |
| React 虚拟列表 | react-window |
| 全局状态 Vue3 | Pinia |
| 全局状态 React | Zustand / Redux Toolkit |
| HTTP 请求 | Axios（或 fetch） |
| 数据请求缓存 | SWR / React Query |
| 专业动画 | GSAP |
| 日期处理 | dayjs |
| 金额计算 | decimal.js |
| UI 组件 Vue3 | Element Plus |
| UI 组件 React | Ant Design |
| 地图国内 | 高德/百度 |
| 富文本 | wangEditor / Tiptap |
| 拖拽 React | @dnd-kit/core |
| 大文件上传 | uppy / plupload |
| 前端生成 PDF | pdf-lib |
