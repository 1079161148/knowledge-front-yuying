# 🌐 移动端网络层与数据一致性

> 移动端网络是"波动的、贵的、会断的"。本篇讲：请求层设计（拦截/重试/幂等）、弱网策略、缓存（SWR）、乐观更新、离线写队列、数据一致性。依据 **WHATWG Fetch**、**web.dev 网络可靠性**、**SWR/React Query 官方**。前置：[性能专项·弱网](performance.md) §四、[监控与上线](monitoring.md)。

---

## 一、请求层基础设施（必做）

### 1.1 统一封装 + 拦截

```ts
// 统一请求：超时 / 重试 / 错误上报 / 鉴权
async function request(url: string, opts: RequestInit = {}, retry = 2) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10000)  // 超时
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal, headers: withAuth() })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    if (retry > 0 && shouldRetry(e)) return request(url, opts, retry - 1)  // 指数退避
    reportError(e, url)  // 见 monitoring.md
    throw e
  } finally {
    clearTimeout(timer)
  }
}
```

### 1.2 超时与取消

- 弱网下请求挂死：用 `AbortController` 超时取消，避免 UI 假死。
- 页面切换/组件卸载：取消进行中请求（React `useEffect` cleanup 调 `ctrl.abort()`），防竞态（旧请求晚回覆盖新数据）。

!!! danger "坑 1：竞态导致数据错乱"
    列表页快速切 tab，A 请求晚于 B 返回 → 显示 A 的数据。用 AbortController 取消离场请求，或用"最新请求优先"标记。

---

## 二、弱网策略（移动端特有）

### 2.1 重试与退避

```ts
function shouldRetry(e: unknown) {
  // 网络错误/5xx 重试；4xx（含 401 未授权）不重试
  return e instanceof TypeError || (e as any).status >= 500
}
// 指数退避：retry 间隔 = base * 2^(n-1)，加 jitter 防惊群
```

### 2.2 请求合并与预取

- 弱网 RTT 是最大成本，**合并小请求、减少往返**。
- 关键下一页数据：空闲时 `requestIdleCallback` 预取（如详情页预拉评论）。

### 2.3 离线可读

- 列表/草稿存 **IndexedDB**，断网可看（见 [原生 API](../advanced/browser-optimize-api.md)）。
- Service Worker 缓存 API 响应壳（见 [PWA](pwa.md)）。

---

## 三、客户端缓存：SWR 模式

**stale-while-revalidate**：先返回缓存（秒开），后台重新验证，拿到新数据再更新。移动端弱网体验核心。

```ts
// SWR / React Query 思路（Vue 用 swrv / Pinia + 自写）
const { data, isLoading } = useSWR('/api/profile', request, {
  revalidateOnFocus: true,      // 回前台刷新
  dedupingInterval: 5000,       // 5s 内重复请求去重
  fallbackData: cache.get('/api/profile')  // 离线兜底
})
```

!!! tip "缓存分层"
    - **内存**（瞬时、最快）：当前页数据。
    - **持久**（IndexedDB/localStorage）：跨会话、离线可读。
    - **网络**：最终一致来源。

---

## 四、乐观更新（体验关键）

用户操作立即反映 UI，后台提交，失败回滚。

```ts
async function like(postId: string) {
  // 1) 乐观：先本地 +1
  setLikes(prev => prev + 1)
  try {
    await request(`/like/${postId}`, { method: 'POST' })
  } catch {
    setLikes(prev => prev - 1)  // 2) 失败回滚
    toast('操作失败')
  }
}
```

!!! danger "坑 2：乐观更新不处理并发"
    快速多次点赞/多端同步易冲突。用**幂等接口**（带 clientId，重复提交同结果）+ 服务端最终态为准，UI 以服务端响应修正。

---

## 五、离线写队列（断网也能操作）

```ts
// 写操作先入队，网络恢复再提交
function offlineWrite(op: Op) {
  if (navigator.onLine) return submit(op)
  queue.push(op); persist(queue)  // 存 IndexedDB
}
window.addEventListener('online', flushQueue)  // 恢复联网冲刷
```

> 注意：队列需**幂等 + 顺序保证**，避免重复提交/乱序（如草稿先存后发）。

---

## 六、数据一致性原则

| 场景 | 风险 | 对策 |
|------|------|------|
| 多端同步 | 状态不一致 | 服务端为真相源，轮询/SWR 重新验证 |
| 乐观更新 | 覆盖他人改动 | 版本号/ETag 冲突检测 |
| 列表分页 | 插入导致错位 | 稳定 key + 增量更新（见 [性能·虚拟列表](performance.md) 坑 3） |
| 表单未保存 | 切后台丢失 | 本地草稿自动存（debounce 写 IndexedDB） |

---

## 七、速查：网络问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| UI 假死 | 请求无超时 | AbortController 超时 |
| 数据错乱 | 竞态 | 取消离场请求 / 最新优先 |
| 弱网卡 | RTT 多 | 合并请求 + 重试退避 + SWR |
| 断网白屏 | 无离线缓存 | IndexedDB + SW 缓存 |
| 操作丢失 | 无草稿 | 本地自动存 + 离线队列 |
| 重复提交 | 非幂等 | 幂等接口 + clientId |

---

## 八、章节关联

- 弱网/离线缓存 → [性能专项 §四](performance.md)
- 错误上报 → [监控与上线](monitoring.md)
- Service Worker 缓存 → [PWA 离线实战](pwa.md)
- 原生 API（IndexedDB/AbortController）→ [浏览器原生优化 API](../advanced/browser-optimize-api.md)
