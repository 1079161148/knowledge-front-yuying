# ♿ 移动端无障碍与合规

> 无障碍（Accessibility，a11y）与合规是大厂/出海**上线硬门槛**。本篇讲：语义化、读屏适配（VoiceOver/TalkBack）、字体缩放、深色模式、动效降级、隐私合规（采集最小化和授权）。依据 **W3C WAI-ARIA**、**WCAG 2.1**、**Apple Accessibility**、**Android Accessibility**、**GDPR / 个人信息保护法**。
>
> 前置：[移动端基础](basics.md)、[动画与手势](animation.md)。

---

## 一、为什么必须做（不只是道德）

- **合规强制**：国内《无障碍环境建设法》、欧盟 EAA（2025 起）、美国 ADA；出海 App 不合规可被下架/罚款。
- **覆盖更大用户**：视力/运动障碍、临时情境（阳光下看不清、单手操作）都受益。
- **SEO/体验双赢**：语义化同时利好 SEO 与读屏。

---

## 二、语义化（最基础、性价比最高）

```html
<!-- 错误：div 当按钮 -->
<div onclick="submit()">提交</div>
<!-- 正确：原生控件自带语义 + 键盘可达 -->
<button type="submit">提交</button>

<!-- 图片必须有 alt -->
<img src="hero.avif" alt="2026 春季新品主视觉">

<!-- 表单关联 label -->
<label for="phone">手机号</label>
<input id="phone" type="tel" aria-describedby="phone-tip">
<span id="phone-tip">用于接收验证码</span>
```

!!! tip "Vue/React 同理"
    Vue 用 `<button>`/原生元素；自定义组件加 `role`/`aria-*`，如 `<div role="tab" aria-selected="true">`。

---

## 三、读屏适配（VoiceOver / TalkBack）

### 3.1 结构清晰

- 用**标题层级**（h1-h6）让读屏用户跳读。
- 给装饰性元素 `aria-hidden="true"`（图标、分隔线）避免干扰。
- 给交互元素可访问名：`aria-label` 或关联 `label`。

### 3.2 动态内容通知

```js
// 内容变化通知读屏（如加载完成、Toast）
const live = document.getElementById('live')
live.setAttribute('aria-live', 'polite')  // 不打断当前朗读
live.textContent = '已加载 20 条'
```

!!! danger "坑 1：Toast 不通知读屏"
    自定义 Toast 用 `aria-live` 区域，否则视障用户看不到提示。错误提示用 `role="alert"` 强提醒。

---

## 四、字体缩放与可读

### 4.1 尊重系统字号

```css
/* 用 rem/em，跟着根字号走；别写死 px 禁止缩放 */
html { font-size: 16px }   /* 用户调系统字号时根字号变，rem 跟随 */
body { font-size: 1rem }
```

- iOS **Dynamic Type**、Android **字体大小** 会改变根字号；用 `rem` 而非写死 `px` 才能跟随。
- 别用 `user-scalable=no` 永久禁缩放（无障碍要求允许用户缩放），确需禁时提供替代。

### 4.2 不破坏布局

- 字号放大后布局不能溢出/重叠 → 用 `flex`/`clamp()` 弹性布局（见 [适配方案](adaptation.md)）。
- 测试：iOS 辅助功能把字号调到最大、Android 显示大小调到最大。

---

## 五、动效降级

```css
/* 用户开启"减少动态效果"时关动画（iOS 设置/Android 省电） */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
```

> 前庭功能障碍用户会因大幅位移动画不适。所有装饰性动画必须可被 `prefers-reduced-motion` 关闭（见 [动画](animation.md)）。

---

## 六、深色模式

```css
@media (prefers-color-scheme: dark) {
  :root { --bg: #111; --fg: #eee }
}
```

- 用 CSS 变量管理颜色，随系统切换；别写死背景色/文字色。
- 图片/图标准备深色版或用 `filter`/遮罩适配，避免深色下看不清。

---

## 七、隐私合规（采集最小化 + 授权）

| 要求 | 做法 |
|------|------|
| 最小必要 | 只采集业务必需数据；监控埋点脱敏（见 [监控](monitoring.md)） |
| 告知同意 | 隐私政策弹窗 + 关键权限（定位/相册）用时申请，明示用途 |
| 权限按需 | Bridge 调原生能力前 UI 说明用途（见 [安全·敏感](security.md) §五） |
| 数据可删 | 提供账号注销/数据删除入口 |
| 跨境合规 | 出海需满足 GDPR（欧盟）/CCPA（加州）的数据主体权利 |

!!! danger "坑 2：默认全量采集 + 静默授权"
    未弹窗同意就采集设备信息/定位 = 违规。先做"告知-选择"，敏感权限"用时申请"。

---

## 八、速查：a11y/合规问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| 读屏读不出 | 用 div 当按钮 | 换原生控件 + aria |
| Toast 视障不可见 | 无 aria-live | 加 aria-live/role=alert |
| 放大字号布局崩 | 写死 px | 改 rem + 弹性布局 |
| 动画致晕 | 无 reduced-motion | 加媒体查询关闭 |
| 深色看不清 | 写死颜色 | CSS 变量 + 深色媒体查询 |
| 合规风险 | 静默采集 | 告知同意 + 最小必要 |

---

## 九、章节关联

- 弹性布局单位 → [适配方案](adaptation.md)
- 动画降级 → [动画与手势](animation.md)
- 权限/敏感 → [安全专项](security.md)
- 埋点脱敏 → [监控与上线](monitoring.md)
