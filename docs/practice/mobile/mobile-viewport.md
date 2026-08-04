# 视口高度：弃用 100vh，用 dvh / svh / lvh

**难点**：`100vh` 包含地址栏，手机地址栏收缩/展开时高度变化 → 底部被藏、出现滚动条、输入区被顶飞。

**最佳实践**：用动态视口单位，0 JS。

```css
.modal   { height: 100dvh; }  /* 动态可见区：地址栏变化自动跟随 */
.composer { height: 100svh; }  /* 小视口：键盘弹起时不被顶飞 */
```
```js
// 键盘弹起监听（弱网输入体验关键）
if (window.visualViewport) {
  visualViewport.addEventListener('resize', () => {
    document.querySelector('.composer').style.height = visualViewport.height + 'px';
  });
}
```

**关键点（生产级细节）**

- 老 WebView 不支持 `dvh`，用 `@supports not (height:100dvh)` 回退到 `--vh` JS 变量方案（`--vh: 1% * innerHeight/100`）。
- iOS 软键盘弹起属于「视觉视口」变化，要用 `svh` + `scrollIntoView` 修正输入框可见。
- `visualViewport` 是处理键盘/地址栏的终极 API，能拿到真实可见区高度与偏移。
- 全屏弹层 / 底部抽屉用 `dvh`，聊天输入区用 `svh`（键盘起时不缩成 0）。

**踩坑**

- `100vh` 在 iOS 上等于「最大视口」含地址栏，弹层底部按钮永远差一截 → 换 `dvh`。
- Android Chrome 地址栏行为相反（展开时 `100vh` 才含地址栏），`dvh` 统一处理。
- 微信/抖音内置 WebView 的 `visualViewport` 在键盘弹出时可能不触发 resize → 加 `focusin/focusout` 双保险。
