# 手势密码解锁

**难点**：九宫格手势密码是 App 标配登录/验证方式。但手写要处理：触屏/鼠标统一、连线吸附到最近节点、滚动穿透、安全区适配，还要把"图案"安全存后端。

**最佳实践**：用 **Pointer Events**（`pointerdown/move/up`）统一触屏与鼠标，`touch-action: none` 阻止滚动穿透；连线吸附用「距离阈值判定最近节点」；后端存图案哈希而非明文。

<iframe src="../../../demos/m-gesture-lock.html" height="440" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- `cv.setPointerCapture(e.pointerId)` 让滑动出 canvas 也能持续收到 `pointermove`，连线不断。
- 吸附：每帧算手指到各点距离，< `R+阈值` 即点亮并加入路径（去重）。
- `touch-action: none` 防页面跟着滑；`env(safe-area-inset-*)` 兜底异形屏。
- 最少 4 点才有效；记录的是**节点序列**（如 `0-1-2-4-5`），不是坐标。
- 后端存序列的**加盐哈希**，验证时比对哈希，防截屏还原。

**踩坑**

- 只监听 `touch` 在 PC 演示不了，`pointer` 事件一套通吃。
- 滑动出 canvas 边界丢 `pointerup` → `setPointerCapture` 解决。
- iOS 上 canvas 默认有触摸高亮 → `-webkit-tap-highlight-color: transparent` 关掉。
