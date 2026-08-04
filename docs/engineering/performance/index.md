# ⚡ 性能优化

> 性能 = 用户感知的"快"。本篇从 **Core Web Vitals 指标** 出发，覆盖 **构建期优化、网络/加载优化、运行时优化、监控**，全部基于 web.dev 与浏览器官方最佳实践。
>
> 权威来源：[web.dev Performance](https://web.dev/learn/performance)、[Core Web Vitals](https://web.dev/articles/vitals)、[MDN 性能](https://developer.mozilla.org/zh-CN/docs/Web/Performance)。

---

## 1. 核心指标（Core Web Vitals）

| 指标 | 含义 | 良好阈值 |
|------|------|----------|
| **LCP**（最大内容绘制） | 主内容加载速度 | ≤ 2.5s |
| **INP**（交互到下一次绘制） | 响应延迟（替代旧 FID） | ≤ 200ms |
| **CLS**（累积布局偏移） | 视觉稳定性 | ≤ 0.1 |

!!! danger "INP 已取代 FID"
    2024 年起 Google 以 **INP** 替代 FID 作为交互指标。FID 只看首次交互，INP 看所有交互的响应延迟，更能反映真实卡顿。

---

## 2. 构建期优化

- **代码分割/懒加载**：路由级 `import()`，降低首包（见 [模块化](../modularization/index.md)）。
- **Tree Shaking**：用 ESM + 正确 `sideEffects`。
- **压缩**：JS 用 esbuild/terser，CSS 用 CssNano，开启 gzip/brotli。
- **依赖分析**：`rollup-plugin-visualizer` 找出大依赖，考虑按需引入（如 lodash-es 而非 lodash）。

---

## 3. 网络与加载优化

- **图片**：用 WebP/AVIF，响应式 `srcset`，懒加载 `loading="lazy"`。
- **预加载关键资源**：`<link rel="preload" as="font">`、`<link rel="modulepreload">`。
- **HTTP 缓存**：静态资源加 `Cache-Control: immutable, max-age=31536000`（带 hash 文件名）。
- **CDN + HTTP/2 多路复用**：并发请求不再受队头阻塞。

!!! danger "CLS 常见元凶"
    - 图片/广告没给宽高 → 加载后撑开布局。用 `width/height` 或 `aspect-ratio` 占位。
    - 字体闪烁（FOIT/FOUT）→ `font-display: swap` + 预加载。
    - 动态插入内容（弹窗/埋点条）插在顶部 → 把已有内容挤下去。

---

## 4. 运行时优化

- **防抖/节流**：搜索输入、滚动监听用 `debounce`/`throttle`。
- **虚拟列表**：长列表只渲染可视区（react-window / vue-virtual-scroller）。
- **避免强制同步布局（layout thrashing）**：读写 DOM 样式分开，批量操作。
- **Web Worker**：重计算（解析、加密）移出主线程。
- **记忆化**：React `useMemo/useCallback`、Vue `computed` 避免重复计算（见 [框架基础](../../framework-compare/essentials/index.md)）。

!!! danger "过度优化也是问题"
    - 到处 `useMemo` 反而增加内存与比较开销。只在「计算贵」或「作为 memo 子组件依赖」时用。
    - 微优化（把 `for` 换成 `forEach`）收益微乎其微，先抓大头（网络、首包、长任务）。

---

## 5. 监控与度量

- **Lighthouse**：本地/CI 跑分，定位瓶颈。
- **RUM（真实用户监控）**：上报真实 PV 的 LCP/INP/CLS（web-vitals 库）。
- **Long Tasks API**：捕获 > 50ms 的长任务，定位卡顿源。

```js
import { onLCP, onINP, onCLS } from 'web-vitals'
onLCP(console.log); onINP(console.log); onCLS(console.log)
```

---

## 6. 自检清单

- [ ] 我关注 LCP ≤ 2.5s / INP ≤ 200ms / CLS ≤ 0.1
- [ ] 首包做了代码分割与懒加载
- [ ] 图片用现代格式 + 懒加载 + 尺寸占位
- [ ] 静态资源带 hash 并长缓存
- [ ] 长列表用虚拟滚动
- [ ] 重计算放 Web Worker
- [ ] 有 Lighthouse / RUM 持续度量

---

## 7. 下一步

- 构建产物怎么优化 → [构建工具](../build-tools/index.md)
- 性能回归用测试守护 → [测试](../testing/index.md)
- 运行时细节 → [浏览器原理](../../advanced/browser-network.md)
