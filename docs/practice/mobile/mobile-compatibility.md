# 兼容性问题解决（真机碎片化实战）

**难点**：移动端最头疼的不是写功能，而是"开发器正常、真机白屏/错位/卡死"。内核碎片化（iOS WKWebView / Android 系统 WebView / 微信 X5 / 各 App 自研内核）、版本跨度大（iOS 14 到 17、Android 8 到 14）、各 App WebView 行为不一。

> 前置：[移动端兼容性总纲](../../mobile/compatibility.md) 是原理与方案库；本页是**真实项目撞过的兼容性坑 + 解法**，可直接抄。

## 1. iOS / Android 行为差异常撞的点

| 现象 | 根因 | 解法 |
|------|------|------|
| `100vh` 底部被地址栏/Home 条切 | iOS 把地址栏算进 vh | 用 `dvh`/`svh`（见 [视口章节](mobile-viewport.md)） |
| `position: fixed` 弹层被软键盘顶飞 | iOS 键盘改变视口、Android 常驻 | `visualViewport` 监听 + `scrollIntoView` |
| `0.5px` 边框消失 | 老安卓 WebView 不支持亚像素，四舍五入成 0 | 伪元素 `transform: scale(0.5)` 兜底（见 [1px 章节](mobile-hairline.md)） |
| `click` 事件 300ms 延迟 | 老浏览器双击缩放 | `touch-action: manipulation` 或 `viewport` 禁缩放 |
| `Date('2026-08-04')` 解析为 NaN | Safari 不支持 `-` 分隔 | 用 `new Date('2026/08/04')` 或 `day.js` |
| `flex: 1` 子元素溢出 | 老安卓 WebView 不收缩 | 子项加 `min-width: 0; min-height: 0` |

## 2. 微信 / 抖音 / 支付宝内置 WebView 差异

```js
// 识别运行环境，针对性降级
function getEnv() {
  const ua = navigator.userAgent;
  if (/MicroMessenger/i.test(ua)) return 'wechat';
  if (/Toutiao|Douyin/i.test(ua)) return 'douyin';
  if (/AlipayClient/i.test(ua)) return 'alipay';
  if (/iPhone|iPad/i.test(ua)) return 'ios-safari';
  return 'android-webview';
}
```

**真实坑**
- **微信**：`web-view` 业务域名必须加白名单，否则打不开（[uni-app 发布 Checklist](../uniapp.md)）；`wx.config` 签名 URL 必须**动态取当前页**，Hash 路由 `#` 后不计入。
- **抖音**：X5 内核下 `position: sticky` 偶发失效 → 关键吸顶用 `fixed` 自己算 offset。
- **支付宝**：`localStorage` 在隐私模式写入抛异常 → 所有存储包 `try/catch` 兜底内存 Map。
- **iOS WKWebView**：跨域 Cookie 默认不携带（`ITP` 智能防跟踪）→ 登录态用 `Authorization` Header 而非 Cookie。

## 3. 兼容性兜底套路（可复用工具）

```js
// 1. 安全存储：隐私模式/容量满都不崩
const safeStore = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { mem.set(k, v); } },
};
// 2. 特性检测而非 UA 判断（更稳）
const supportsDvh = CSS.supports('height', '100dvh');
const supportsIO = 'IntersectionObserver' in window; // 老机没有 → 回退 scroll 监听
// 3. 平滑滚动回退
function smoothScrollTo(el) {
  if ('scrollBehavior' in document.documentElement.style) {
    el.scrollIntoView({ behavior: 'smooth' });
  } else {
    el.scrollIntoView(); // 老安卓直接跳
  }
}
```

## 4. 真机调试链路（别只看浏览器）

- **iOS**：Mac Safari → 开发 → 你的设备 → Web Inspector。
- **Android**：`chrome://inspect/#devices`（需 USB 调试）连真机 WebView。
- **各 App 内**：注入 vConsole，**生产构建必须移除**（见 [uni-app 真机调试](../uniapp.md)）。
- **云真机**：厂商云测平台批量跑 Android 碎片化回归。

## 5. 踩坑清单（沉淀成团队 Checklist）

- [ ] 是否在目标 App（微信/抖音/支付宝）真机验过？
- [ ] 日期解析是否避开 `new Date('2026-08-04')`？
- [ ] `localStorage` 是否全包 try/catch？
- [ ] 视口是否用 `dvh`/`svh` 而非 `100vh`？
- [ ] `IntersectionObserver` 缺失是否回退？
- [ ] vConsole / 调试开关生产是否已关？
