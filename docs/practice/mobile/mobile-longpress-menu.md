# 长按弹出操作菜单

**难点**：微信式长按气泡弹出"复制/转发/引用/删除"，但长按 500ms 触发期间手指微移要取消（防误触）、要屏蔽系统默认选择/上下文菜单、弹层要贴底 + 安全区。

**最佳实践**：`touchstart` 起 500ms 定时器，`touchmove` 超阈值（10px）取消；`contextmenu` 事件 `preventDefault` 屏蔽系统菜单；弹层 `fixed` + `env(safe-area-inset-bottom)`。

<iframe src="../../../demos/m-longpress-menu.html" height="520" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **阈值取消**：`touchmove` 位移 > 10px 清定时器，避免"想滑动却弹出菜单"的误触。
- **系统菜单**：`contextmenu` 必须 `preventDefault`，否则安卓弹出系统复制条；`user-select: none` 防选中。
- **触感反馈**：`navigator.vibrate(15)` 长震一下，体验接近原生（支持的机型）。
- **弹层动画**：`translateY(100%)→0` + `transition`，遮罩 `fixed inset:0`，底部 `safe-area-inset-bottom` 兜底。
- **选择文本场景**：若需支持选中复制，长按阈值内不做 `preventDefault`，冲突场景用双击选中替代。

**踩坑**

- 只 `preventDefault` `contextmenu` 但忘了 `touchstart` 的 500ms 计时 → 短按也弹。
- 弹层用 `position: absolute` 在长列表里滚走 → 必须 `fixed` 全屏。
- iOS 长按会触发文本选择气泡，要 `user-select: none` + `-webkit-touch-callout: none`。
