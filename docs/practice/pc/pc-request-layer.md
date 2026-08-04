# 请求层：无感刷新 + 取消 + 重试

**难点**：token 过期 → 多个并发请求同时 401 → 如果每个都去刷新 token 会刷新 N 次；还有重复提交要取消、网络抖动要重试。

**最佳实践**：**单飞刷新（single-flight）**——第一个 401 触发刷新，其余请求挂起等同一个 Promise；刷新完原请求自动重试。配合 `AbortController` 取消、指数退避重试。

<iframe src="../../../demos/pc-request-layer.html" height="460" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- `refreshing` 用模块级变量存 Promise，保证全局只刷一次（`single-flight`）。
- 401 刷新后**重试原请求**（不是重试刷新），否则用户操作丢失。
- 用 `AbortController` 在组件卸载 / 路由切换时取消未完成请求，防内存泄漏与竞态（旧响应覆盖新数据）。
- 重试用**指数退避 + 抖动**（如 1s、2s、4s），避免雪崩；只对幂等 GET / 特定状态码重试，写请求不盲目重试。
- 并发重复提交：用请求指纹（method+url+body）去重，相同在途请求复用同一 Promise。

**踩坑**

- 刷新 token 的请求本身 401 会死循环 → 刷新接口单独标记 `skipAuthRefresh`。
- 多标签页：一个 tab 刷新了 token，其他 tab 的 refreshToken 失效 → 用 `BroadcastChannel` 广播登出/刷新。
- 不要在拦截器里吞掉错误，要 `throw` 让业务层感知。
