# 离线缓存（PWA Service Worker）

**难点**：地铁 / 电梯里页面打不开、重复加载慢、弱网白屏。PWA 用 Service Worker 把"壳"和接口缓存，离线也能开、二次访问秒开。

**最佳实践**：SW 生命周期 `register→install(precache)→activate(清旧缓存)→fetch(缓存策略)`；静态资源 Cache First、接口 Network First / Stale-While-Revalidate；更新要 `skipWaiting + clients.claim`。

<iframe src="../../../demos/m-offline-pwa.html" height="480" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **HTTPS 必须**（localhost 例外），否则 SW 不注册。
- **缓存策略选型**：
  - `Cache First`：静态资源（JS/CSS/图片），快但更新滞后；
  - `Network First`：接口数据，实时优先、失败兜底缓存；
  - `Stale-While-Revalidate`：先返缓存、后台更新（最佳体验）。
- **更新机制**：新 SW 默认等旧页面关才激活 → `self.skipWaiting() + clients.claim()` 立即生效；UI 提示"有新版本，点击刷新"。
- **缓存上限**：浏览器约 50MB，要设上限 + `activate` 阶段清理过期 cache，防爆仓。

**踩坑**

- 不调用 `skipWaiting`，用户一直用旧缓存 → 发版后 Bug 还在。
- `fetch` 事件 `cache.put` 要 `clone()` 响应（Response 只能读一次）。
- `POST` 请求不应缓存（隐私 + 数据错乱），fetch 里要跳过非 GET。
- 开发时 SW 缓存让改的代码不生效 → 调试用 `chrome://serviceworker-internals` 清或勾"Update on reload"。
- 见 [弱网体验](mobile-weak-network.md) 衔接请求层策略。
